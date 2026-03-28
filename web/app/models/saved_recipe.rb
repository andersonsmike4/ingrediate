class SavedRecipe < ApplicationRecord
  include OwnerScoped

  has_many :meal_plan_entries, dependent: :destroy
  has_many :cooking_logs, dependent: :destroy

  validates :name, presence: true
  validates :rating, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }, allow_nil: true

  def generate_share_token!
    self.share_token = SecureRandom.urlsafe_base64(16)
    save!
    share_token
  end

  def tags
    tags_json.present? ? JSON.parse(tags_json) : []
  end

  def tags=(value)
    self.tags_json = value.is_a?(Array) ? value.to_json : value
  end

  def parsed_ingredients
    JSON.parse(ingredients_json || "[]")
  rescue JSON::ParserError
    []
  end

  def parsed_steps
    JSON.parse(steps_json || "[]")
  rescue JSON::ParserError
    []
  end

  def parsed_nutrition
    JSON.parse(nutrition_json || "{}")
  rescue JSON::ParserError
    {}
  end

  def parsed_substitutions
    JSON.parse(substitutions_json || "[]")
  rescue JSON::ParserError
    []
  end
end
