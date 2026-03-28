class CookingChallenge < ApplicationRecord
  has_many :challenge_submissions, dependent: :destroy
  validates :challenge_text, presence: true
  validates :challenge_date, presence: true, uniqueness: true
end
