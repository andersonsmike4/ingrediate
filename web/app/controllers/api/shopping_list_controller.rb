class Api::ShoppingListController < ApplicationController
  def index
    items = ShoppingListItem.for_owner(owner_conditions).order(:checked, :name)
    render json: { items: items }
  end

  def create
    item = ShoppingListItem.new(item_params)
    assign_owner(item)

    if item.save
      render json: { item: item }, status: :created
    else
      render json: { error: item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def toggle
    item = ShoppingListItem.find_by(owner_conditions.merge(id: params[:id]))
    unless item
      return render json: { error: "Item not found" }, status: :not_found
    end

    item.update!(checked: !item.checked)
    render json: { item: item }
  end

  def destroy
    item = ShoppingListItem.find_by(owner_conditions.merge(id: params[:id]))
    unless item
      return render json: { error: "Item not found" }, status: :not_found
    end

    item.destroy
    head :no_content
  end

  def clear_checked
    ShoppingListItem.for_owner(owner_conditions).where(checked: true).destroy_all
    head :no_content
  end

  def populate_from_plan
    meal_plan = MealPlan.find_by(owner_conditions.merge(id: params[:plan_id]))
    unless meal_plan
      return render json: { error: "Meal plan not found" }, status: :not_found
    end

    pantry_names = PantryItem.for_owner(owner_conditions)
                             .pluck(:name)
                             .map(&:downcase)

    added = 0
    meal_plan.meal_plan_entries.includes(:saved_recipe).each do |entry|
      recipe = entry.saved_recipe
      next unless recipe.ingredients_json.present?

      ingredients = recipe.parsed_ingredients
      ingredients.each do |ingredient|
        name = (ingredient["name"] || "").strip
        next if name.blank?
        next if pantry_names.include?(name.downcase)

        item = ShoppingListItem.for_owner(owner_conditions).where(name: name).first_or_initialize
        unless item.persisted?
          item.amount = ingredient["amount"]
          item.source = recipe.name
          assign_owner(item) if item.new_record?
          item.save
          added += 1
        end
      end
    end

    items = ShoppingListItem.for_owner(owner_conditions).order(:checked, :name)
    render json: { items: items, added: added }
  end

  def add_checked_to_pantry
    checked_items = ShoppingListItem.for_owner(owner_conditions).where(checked: true)

    added = 0
    checked_items.each do |item|
      pantry_item = PantryItem.for_owner(owner_conditions).where(name: item.name).first_or_initialize
      unless pantry_item.persisted?
        pantry_item.category = "other"
        assign_owner(pantry_item) if pantry_item.new_record?
        pantry_item.save
        added += 1
      end
    end

    checked_items.destroy_all
    render json: { added_to_pantry: added }
  end

  private

  def item_params
    params.permit(:name, :amount, :source)
  end
end
