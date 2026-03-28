class PantryItem < ApplicationRecord
  include OwnerScoped

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id, case_sensitive: false }, if: -> { user_id.present? }
  validates :name, uniqueness: { scope: :session_id, case_sensitive: false }, if: -> { user_id.blank? }

  before_save :normalize_name

  CATEGORIES = %w[produce dairy protein grains spices condiments canned frozen other].freeze

  validates :category, inclusion: { in: CATEGORIES }, allow_nil: true

  private

  def normalize_name
    self.name = name.strip.downcase
  end
end
