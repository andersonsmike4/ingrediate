class Api::RecipesController < ApplicationController
  def generate
    unless params[:ingredients].present?
      return render json: { error: "Ingredients are required" }, status: :bad_request
    end

    ingredients = params[:ingredients]
    filters = {
      dietary: params[:dietary],
      cuisine: params[:cuisine],
      cook_time: params[:cook_time],
      difficulty: params[:difficulty],
      servings: params[:servings]
    }

    recipes = ai_service.generate_recipes(
      ingredients: ingredients,
      filters: filters,
      household: current_household,
      preferences: current_preferences
    )

    render json: { recipes: recipes }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def saved_index
    recipes = SavedRecipe.for_owner(owner_conditions).order(created_at: :desc)
    render json: { recipes: recipes }
  end

  def saved_create
    recipe = SavedRecipe.new(saved_recipe_params)
    assign_owner(recipe)

    if recipe.save
      render json: { recipe: recipe }, status: :created
    else
      render json: { error: recipe.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def saved_destroy
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:id]))

    unless recipe
      return head :not_found
    end

    recipe.destroy
    head :no_content
  end

  def saved_update
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:id]))

    unless recipe
      return head :not_found
    end

    if recipe.update(saved_recipe_params)
      render json: { recipe: recipe }
    else
      render json: { error: recipe.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def saved_share
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:id]))

    unless recipe
      return head :not_found
    end

    recipe.generate_share_token! if recipe.share_token.nil?

    render json: { share_url: "/shared/#{recipe.share_token}" }
  end

  def shared_show
    recipe = SavedRecipe.find_by(share_token: params[:token])

    unless recipe
      return head :not_found
    end

    render json: { recipe: recipe }
  end

  def import_from_url
    unless params[:url].present?
      return render json: { error: "URL is required" }, status: :bad_request
    end

    recipe_data = ai_service.import_recipe_from_url(url: params[:url])

    recipe = SavedRecipe.new(
      name: recipe_data[:name],
      description: recipe_data[:description],
      cook_time: recipe_data[:cook_time],
      difficulty: recipe_data[:difficulty],
      servings: recipe_data[:servings],
      ingredients_json: recipe_data[:ingredients].to_json,
      steps_json: recipe_data[:steps].to_json,
      nutrition_json: recipe_data[:nutrition].to_json,
      substitutions_json: "[]"
    )
    assign_owner(recipe)

    if recipe.save
      render json: { recipe: recipe }, status: :created
    else
      render json: { error: recipe.errors.full_messages }, status: :unprocessable_entity
    end
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def suggest_substitutions
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:id]))
    return head(:not_found) unless recipe

    substitutions = ai_service.suggest_substitutions(
      recipe_name: recipe.name,
      ingredients: recipe.parsed_ingredients,
      missing_ingredient: params[:ingredient]
    )

    render json: { substitutions: substitutions }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def estimate_cost
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:id]))
    return head(:not_found) unless recipe

    cost_data = ai_service.estimate_recipe_cost(
      recipe_name: recipe.name,
      ingredients: recipe.parsed_ingredients,
      household: current_household,
      preferences: current_preferences
    )

    recipe.update(estimated_cost_cents: cost_data[:total_cents])
    render json: { cost: cost_data }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def create_variation
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:id]))
    unless recipe
      return render json: { error: "Recipe not found" }, status: :not_found
    end

    unless params[:modifier].present?
      return render json: { error: "modifier is required" }, status: :bad_request
    end

    variation = ai_service.generate_variation(
      recipe_name: recipe.name,
      ingredients: recipe.parsed_ingredients,
      steps: recipe.parsed_steps,
      nutrition: recipe.parsed_nutrition,
      modifier: params[:modifier]
    )

    # Auto-save the variation
    new_recipe = SavedRecipe.new(
      name: variation[:name],
      description: variation[:description],
      cook_time: variation[:cook_time],
      difficulty: variation[:difficulty],
      servings: variation[:servings],
      ingredients_json: variation[:ingredients].to_json,
      steps_json: variation[:steps].to_json,
      nutrition_json: variation[:nutrition].to_json,
      notes: "Variation of '#{recipe.name}': #{variation[:changes_summary]}"
    )
    assign_owner(new_recipe)
    new_recipe.save!

    render json: { recipe: new_recipe, changes_summary: variation[:changes_summary] }, status: :created
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def publish
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:id]))
    return head(:not_found) unless recipe

    recipe.update!(is_public: true, published_at: Time.current, author_name: user_signed_in? ? current_user.name : "Anonymous")
    render json: { recipe: recipe }
  end

  def unpublish
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:id]))
    return head(:not_found) unless recipe

    recipe.update!(is_public: false, published_at: nil)
    render json: { recipe: recipe }
  end

  private

  def saved_recipe_params
    params.require(:recipe).permit(
      :name,
      :description,
      :cook_time,
      :difficulty,
      :servings,
      :ingredients_json,
      :steps_json,
      :nutrition_json,
      :substitutions_json,
      :rating,
      :notes,
      :tags_json,
      :estimated_cost_cents
    )
  end
end
