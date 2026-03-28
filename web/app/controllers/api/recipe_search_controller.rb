class Api::RecipeSearchController < ApplicationController
  def search
    meal_name = params[:meal_name]
    return render json: { error: "meal_name is required" }, status: :bad_request if meal_name.blank?

    pantry_items = PantryItem.for_owner(owner_conditions).pluck(:name)

    recipes = ai_service.search_by_meal_name(
      meal_name: meal_name,
      pantry_items: pantry_items,
      household: current_household,
      preferences: current_preferences
    )

    render json: { recipes: recipes }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
