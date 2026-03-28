class NutritionGoal < ApplicationRecord
  include OwnerScoped

  validates :user_id, uniqueness: true, if: -> { user_id.present? }
  validates :session_id, uniqueness: true, if: -> { user_id.blank? }
  validates :daily_calories, :daily_protein, :daily_carbs, :daily_fat,
            numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
end
