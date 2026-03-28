class Api::CompareController < ApplicationController
  def compare
    ids = params[:recipe_ids] || []
    recipes = SavedRecipe.for_owner(owner_conditions).where(id: ids).limit(3)

    pantry_names = PantryItem.for_owner(owner_conditions).pluck(:name).map(&:downcase)

    comparison = recipes.map do |r|
      ingredients = r.parsed_ingredients
      nutrition = r.parsed_nutrition
      {
        id: r.id,
        name: r.name,
        cook_time: r.cook_time,
        difficulty: r.difficulty,
        servings: r.servings,
        estimated_cost_cents: r.estimated_cost_cents,
        nutrition: nutrition,
        ingredient_count: ingredients.size,
        pantry_match: ingredients.count { |i| pantry_names.include?((i["name"] || "").downcase) },
        rating: r.rating
      }
    end

    render json: { comparison: comparison }
  end
end
