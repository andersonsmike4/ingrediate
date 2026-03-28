class Api::SuggestionsController < ApplicationController
  def smart_suggest
    pantry_items = PantryItem.for_owner(owner_conditions).pluck(:name)

    expiring_soon = PantryItem.for_owner(owner_conditions)
                              .where("expires_at IS NOT NULL AND expires_at <= ?", 3.days.from_now)
                              .pluck(:name)

    saved_recipes = SavedRecipe.for_owner(owner_conditions)
                               .select(:id, :name, :ingredients_json)
                               .map { |r| { name: r.name, id: r.id } }

    recent_cooks = CookingLog.joins(:saved_recipe)
                             .for_owner(owner_conditions)
                             .order(cooked_at: :desc)
                             .limit(10)
                             .pluck("saved_recipes.name")

    nutrition_goal = NutritionGoal.find_by(owner_conditions)
    goals = nutrition_goal ? {
      daily_calories: nutrition_goal.daily_calories,
      daily_protein: nutrition_goal.daily_protein,
      daily_carbs: nutrition_goal.daily_carbs,
      daily_fat: nutrition_goal.daily_fat
    } : nil

    suggestions = ai_service.suggest_what_to_cook(
      pantry_items: pantry_items,
      saved_recipes: saved_recipes,
      recent_cooks: recent_cooks,
      nutrition_goals: goals,
      expiring_soon: expiring_soon,
      household: current_household,
      preferences: current_preferences
    )

    render json: { suggestions: suggestions }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
