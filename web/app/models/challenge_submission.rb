class ChallengeSubmission < ApplicationRecord
  belongs_to :user
  belongs_to :cooking_challenge
  validates :cooking_challenge_id, uniqueness: { scope: :user_id }
end
