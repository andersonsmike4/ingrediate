class GroceryPurchase < ApplicationRecord
  include OwnerScoped
  validates :item_name, presence: true
end
