class Api::FeedController < ApplicationController
  before_action :authenticate_user_or_token!, only: [:like, :unlike]

  def index
    recipes = SavedRecipe.where(is_public: true)
      .order(published_at: :desc)
      .limit(Pagination.limit_for(params))
      .offset(params[:offset] || 0)

    recipes = recipes.where("name ILIKE ? OR description ILIKE ?", "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?

    render json: {
      recipes: recipes.map { |r|
        r.as_json.merge(
          liked: user_signed_in? ? RecipeLike.exists?(user_id: current_user.id, saved_recipe_id: r.id) : false
        )
      }
    }
  end

  def like
    recipe = SavedRecipe.find_by(id: params[:id])
    return head :not_found unless recipe
    RecipeLike.find_or_create_by(user: current_user, saved_recipe: recipe)
    render json: { likes_count: recipe.reload.likes_count }
  end

  def unlike
    RecipeLike.find_by(user_id: current_user.id, saved_recipe_id: params[:id])&.destroy
    recipe = SavedRecipe.find_by(id: params[:id])
    return head :not_found unless recipe
    render json: { likes_count: recipe.reload.likes_count }
  end
end
