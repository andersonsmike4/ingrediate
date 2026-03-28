class UserPreference < ApplicationRecord
  belongs_to :user
  validates :user_id, uniqueness: true

  def preferences
    JSON.parse(preferences_json || "{}", symbolize_names: true)
  end

  def preferences=(hash)
    self.preferences_json = hash.to_json
  end
end
