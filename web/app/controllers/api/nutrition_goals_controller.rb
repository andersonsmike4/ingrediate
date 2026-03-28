class Api::NutritionGoalsController < ApplicationController
  def show
    goal = NutritionGoal.find_by(owner_conditions)
    if goal
      render json: { nutrition_goal: goal }
    else
      render json: { nutrition_goal: nil }
    end
  end

  def update
    goal = NutritionGoal.for_owner(owner_conditions).first_or_initialize
    assign_owner(goal) if goal.new_record?
    goal.assign_attributes(goal_params)
    if goal.save
      render json: { nutrition_goal: goal }
    else
      render json: { error: goal.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def goal_params
    params.permit(:daily_calories, :daily_protein, :daily_carbs, :daily_fat)
  end
end
