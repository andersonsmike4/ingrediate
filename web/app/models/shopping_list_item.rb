class ShoppingListItem < ApplicationRecord
  include OwnerScoped

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id, case_sensitive: false }, if: -> { user_id.present? }
  validates :name, uniqueness: { scope: :session_id, case_sensitive: false }, if: -> { user_id.blank? }
end
