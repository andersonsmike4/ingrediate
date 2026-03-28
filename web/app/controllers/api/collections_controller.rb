class Api::CollectionsController < ApplicationController
  def index
    collections = RecipeCollection.for_owner(owner_conditions)
                                  .includes(collection_recipes: :saved_recipe)
                                  .order(created_at: :desc)
    render json: { collections: collections.as_json(include: { collection_recipes: { include: :saved_recipe } }) }
  end

  def create
    collection = RecipeCollection.new(name: params[:name], description: params[:description])
    assign_owner(collection)
    if collection.save
      render json: { collection: collection }, status: :created
    else
      render json: { error: collection.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    collection = find_collection
    return unless collection
    render json: { collection: collection.as_json(include: { collection_recipes: { include: :saved_recipe } }) }
  end

  def destroy
    collection = find_collection
    return unless collection
    collection.destroy
    head :no_content
  end

  def add_recipe
    collection = find_collection
    return unless collection

    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:saved_recipe_id]))
    return render(json: { error: "Recipe not found" }, status: :not_found) unless recipe

    cr = collection.collection_recipes.build(saved_recipe_id: recipe.id)
    if cr.save
      render json: { collection_recipe: cr.as_json(include: :saved_recipe) }, status: :created
    else
      render json: { error: cr.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def remove_recipe
    collection = find_collection
    return unless collection

    cr = collection.collection_recipes.find_by(saved_recipe_id: params[:recipe_id])
    return head(:not_found) unless cr
    cr.destroy
    head :no_content
  end

  def share
    collection = find_collection
    return unless collection
    collection.generate_share_token! if collection.share_token.nil?
    render json: { share_url: "/shared/collection/#{collection.share_token}" }
  end

  def shared_show
    collection = RecipeCollection.find_by(share_token: params[:token])
    return head(:not_found) unless collection
    render json: { collection: collection.as_json(include: { collection_recipes: { include: :saved_recipe } }) }
  end

  private

  def find_collection
    collection = RecipeCollection.find_by(owner_conditions.merge(id: params[:id]))
    render(json: { error: "Collection not found" }, status: :not_found) unless collection
    collection
  end
end
