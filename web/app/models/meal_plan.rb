class MealPlan < ApplicationRecord
  include OwnerScoped

  has_many :meal_plan_entries, dependent: :destroy
  has_many :saved_recipes, through: :meal_plan_entries

  validates :name, presence: true
  validate :end_date_after_start_date, if: -> { start_date.present? && end_date.present? }

  private

  def end_date_after_start_date
    errors.add(:end_date, "must be after start date") if end_date < start_date
  end
end
