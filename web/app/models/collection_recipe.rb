class CollectionRecipe < ApplicationRecord
  belongs_to :recipe_collection
  belongs_to :saved_recipe

  validates :saved_recipe_id, uniqueness: { scope: :recipe_collection_id }
end
