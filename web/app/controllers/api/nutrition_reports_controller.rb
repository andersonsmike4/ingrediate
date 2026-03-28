class Api::NutritionReportsController < ApplicationController
  before_action :authenticate_user_or_token!

  def weekly
    logs = CookingLog.where(user_id: current_user.id)
      .where("cooked_at >= ?", 7.days.ago)
      .includes(:saved_recipe)

    cooked_recipes = logs.map(&:saved_recipe).compact
    nutrition_data = cooked_recipes.map do |r|
      safe_parse_json(r.nutrition_json, {})
    end

    goal = NutritionGoal.find_by(user_id: current_user.id)

    result = ai_service.generate_nutrition_report(
      nutrition_data: nutrition_data,
      recipe_names: cooked_recipes.map(&:name),
      goals: goal ? { daily_calories: goal.daily_calories, daily_protein: goal.daily_protein, daily_carbs: goal.daily_carbs, daily_fat: goal.daily_fat } : nil,
      days_tracked: logs.map { |l| l.cooked_at.to_date }.uniq.size,
      household: current_household,
      preferences: current_preferences
    )

    render json: { report: result }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
