class RecipeCollection < ApplicationRecord
  include OwnerScoped

  has_many :collection_recipes, dependent: :destroy
  has_many :saved_recipes, through: :collection_recipes

  validates :name, presence: true

  def generate_share_token!
    self.share_token = SecureRandom.urlsafe_base64(16)
    save!
    share_token
  end
end
