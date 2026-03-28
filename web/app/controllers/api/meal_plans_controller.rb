class Api::MealPlansController < ApplicationController
  before_action :set_meal_plan, only: [:show, :destroy, :add_entry, :remove_entry, :shopping_list]

  def index
    meal_plans = MealPlan.for_owner(owner_conditions)
                         .includes(meal_plan_entries: :saved_recipe)
                         .order(created_at: :desc)

    render json: { meal_plans: meal_plans.as_json(include: {
      meal_plan_entries: { include: :saved_recipe }
    }) }
  end

  def show
    render json: { meal_plan: @meal_plan.as_json(include: {
      meal_plan_entries: { include: :saved_recipe }
    }) }
  end

  def create
    start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current.beginning_of_week(:monday)
    num_days = (params[:num_days] || 7).to_i.clamp(1, 28)
    end_date = start_date + (num_days - 1).days

    meal_plan = MealPlan.new(
      name: params[:name] || "Meal Plan #{start_date.strftime('%b %-d')}",
      start_date: start_date,
      end_date: end_date
    )
    assign_owner(meal_plan)

    if meal_plan.save
      render json: { meal_plan: meal_plan }, status: :created
    else
      render json: { error: meal_plan.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def auto_generate
    meal_plan = MealPlan.for_owner(owner_conditions).first
    unless meal_plan
      start_date = Date.current.beginning_of_week(:monday)
      meal_plan = MealPlan.new(name: "Meal Plan #{start_date.strftime('%b %-d')}", start_date: start_date, end_date: start_date + 6.days)
      assign_owner(meal_plan)
      meal_plan.save!
    end

    saved_recipes = SavedRecipe.for_owner(owner_conditions)
                               .select(:id, :name, :difficulty, :cook_time)
                               .map { |r| { name: r.name, id: r.id, difficulty: r.difficulty, cook_time: r.cook_time } }

    if saved_recipes.empty?
      return render json: { error: "You need at least some saved recipes to auto-generate a meal plan" }, status: :unprocessable_entity
    end

    pantry_items = PantryItem.for_owner(owner_conditions).pluck(:name)

    recent_cooks = CookingLog.joins(:saved_recipe)
                             .for_owner(owner_conditions)
                             .order(cooked_at: :desc)
                             .limit(10)
                             .pluck("saved_recipes.name")

    nutrition_goal = NutritionGoal.find_by(owner_conditions)
    goals = nutrition_goal ? {
      daily_calories: nutrition_goal.daily_calories,
      daily_protein: nutrition_goal.daily_protein
    } : nil

    # Get existing eating-out entries so we don't overwrite them
    eating_out_dates = meal_plan.meal_plan_entries
                               .where(saved_recipe_id: nil)
                               .where.not(note: [nil, ""])
                               .pluck(:date, :meal_type)

    num_days = (meal_plan.end_date - meal_plan.start_date).to_i + 1
    result = ai_service.auto_generate_meal_plan(
      saved_recipes: saved_recipes,
      pantry_items: pantry_items,
      recent_cooks: recent_cooks,
      nutrition_goals: goals,
      household: current_household,
      preferences: current_preferences,
      num_days: num_days
    )

    # Clear existing recipe entries but keep eating-out entries
    meal_plan.meal_plan_entries.where.not(saved_recipe_id: nil).destroy_all

    valid_recipe_ids = saved_recipes.map { |r| r[:id] }
    entries_created = 0

    (result[:entries] || []).each do |entry|
      next unless valid_recipe_ids.include?(entry[:recipe_id])

      entry_date = meal_plan.start_date + (entry[:day_of_week] || 0).days

      # Skip slots marked as eating out
      next if eating_out_dates.include?([entry_date, entry[:meal_type]])

      meal_plan.meal_plan_entries.create(
        saved_recipe_id: entry[:recipe_id],
        date: entry_date,
        day_of_week: entry[:day_of_week] || 0,
        meal_type: entry[:meal_type]
      )
      entries_created += 1
    end

    render json: {
      meal_plan: meal_plan.reload.as_json(include: { meal_plan_entries: { include: :saved_recipe } }),
      reasoning: result[:reasoning],
      entries_created: entries_created
    }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def add_entry
    date = params[:date].present? ? Date.parse(params[:date]) : nil
    unless date && params[:meal_type].present?
      return render json: { error: "date and meal_type are required" }, status: :bad_request
    end

    # Find existing entry for this date/meal_type and replace it
    existing_entry = @meal_plan.meal_plan_entries.find_by(date: date, meal_type: params[:meal_type])

    if params[:eating_out].present?
      # Eating out entry
      if existing_entry
        existing_entry.update!(saved_recipe_id: nil, note: params[:note] || "Eating out")
        entry = existing_entry
      else
        entry = @meal_plan.meal_plan_entries.create!(
          date: date,
          day_of_week: (date.wday - 1) % 7,
          meal_type: params[:meal_type],
          note: params[:note] || "Eating out"
        )
      end
    else
      # Recipe entry
      saved_recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:saved_recipe_id]))
      return render json: { error: "Saved recipe not found" }, status: :not_found unless saved_recipe

      if existing_entry
        existing_entry.update!(saved_recipe_id: params[:saved_recipe_id], note: nil)
        entry = existing_entry
      else
        entry = @meal_plan.meal_plan_entries.create!(
          saved_recipe_id: params[:saved_recipe_id],
          date: date,
          day_of_week: (date.wday - 1) % 7,
          meal_type: params[:meal_type]
        )
      end
    end

    render json: { entry: entry.as_json(include: :saved_recipe) }, status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def remove_entry
    entry = @meal_plan.meal_plan_entries.find_by(id: params[:entry_id])
    return head :not_found unless entry

    entry.destroy
    head :no_content
  end

  def destroy
    @meal_plan.destroy
    head :no_content
  end

  def shopping_list
    ingredients_map = Hash.new { |h, k| h[k] = [] }

    @meal_plan.meal_plan_entries.includes(:saved_recipe).each do |entry|
      recipe = entry.saved_recipe
      next unless recipe&.ingredients_json.present?

      ingredients = recipe.parsed_ingredients
      ingredients.each do |ingredient|
        ingredient_name = ingredient["name"] || ingredient["ingredient"]
        next unless ingredient_name.present?
        ingredients_map[ingredient_name.strip.downcase] << recipe.name
      end
    end

    pantry_names = PantryItem.for_owner(owner_conditions).pluck(:name).map(&:downcase)

    ingredients = ingredients_map
      .reject { |name, _| pantry_names.include?(name) }
      .map { |name, recipes| { name: name, recipes: recipes.uniq } }
      .sort_by { |item| item[:name] }

    in_pantry = ingredients_map
      .select { |name, _| pantry_names.include?(name) }
      .map { |name, recipes| { name: name, recipes: recipes.uniq } }
      .sort_by { |item| item[:name] }

    render json: { ingredients: ingredients, in_pantry: in_pantry }
  end

  private

  def set_meal_plan
    @meal_plan = MealPlan.find_by(owner_conditions.merge(id: params[:id]))
    render json: { error: "Meal plan not found" }, status: :not_found unless @meal_plan
  end

  def meal_plan_params
    params.permit(:name, :start_date, :end_date)
  end
end
