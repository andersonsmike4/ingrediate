class Api::TimelinesController < ApplicationController
  def generate
    recipe_ids = params[:recipe_ids] || []
    recipes = SavedRecipe.for_owner(owner_conditions).where(id: recipe_ids).limit(4)

    recipe_data = recipes.map do |r|
      {
        name: r.name,
        steps: safe_parse_json(r.steps_json),
        cook_time: r.cook_time
      }
    end

    result = ai_service.optimize_cooking_timeline(recipes: recipe_data)
    render json: { timeline: result }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
