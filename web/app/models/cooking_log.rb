class CookingLog < ApplicationRecord
  include OwnerScoped

  belongs_to :saved_recipe
  validates :cooked_at, presence: true
end
