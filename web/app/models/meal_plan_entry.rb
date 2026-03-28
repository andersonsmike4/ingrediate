class MealPlanEntry < ApplicationRecord
  belongs_to :meal_plan
  belongs_to :saved_recipe, optional: true

  validates :date, presence: true
  validates :meal_type, presence: true, inclusion: { in: %w[breakfast lunch dinner] }
  validates :meal_type, uniqueness: { scope: [:meal_plan_id, :date] }

  # Either a recipe or a note (eating out)
  validate :recipe_or_note_present

  private

  def recipe_or_note_present
    if saved_recipe_id.blank? && note.blank?
      errors.add(:base, "Must have a recipe or a note")
    end
  end
end
