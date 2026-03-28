class Achievement < ApplicationRecord
  has_many :user_achievements, dependent: :destroy
  has_many :users, through: :user_achievements
  validates :name, presence: true, uniqueness: true
  validates :icon, presence: true
end
