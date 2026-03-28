class SubstitutionLog < ApplicationRecord
  belongs_to :user
  validates :original_ingredient, presence: true
  validates :substitute_ingredient, presence: true
  validates :rating, inclusion: { in: 1..5 }, allow_nil: true
end
