class RecipeLike < ApplicationRecord
  belongs_to :user
  belongs_to :saved_recipe, counter_cache: :likes_count
  validates :user_id, uniqueness: { scope: :saved_recipe_id }
end
