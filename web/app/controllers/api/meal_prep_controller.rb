class Api::MealPrepController < ApplicationController
  def generate
    recipes = SavedRecipe.for_owner(owner_conditions)
    pantry = PantryItem.for_owner(owner_conditions).pluck(:name)

    result = ai_service.generate_meal_prep_plan(
      recipes: recipes.map { |r| { name: r.name, cook_time: r.cook_time, ingredients: r.ingredients_json } },
      pantry_items: pantry,
      schedule: params[:schedule] || "standard week",
      household: current_household,
      preferences: current_preferences
    )
    render json: { meal_prep_plan: result }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
