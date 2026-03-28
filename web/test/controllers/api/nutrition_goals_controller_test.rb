require "test_helper"

class Api::NutritionGoalsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
    @goal = nutrition_goals(:one)
  end

  test "show returns user's nutrition goal" do
    get api_nutrition_goals_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    assert json["nutrition_goal"].present?
    assert_equal 2000, json["nutrition_goal"]["daily_calories"]
    assert_equal 150, json["nutrition_goal"]["daily_protein"]
  end

  test "show returns null when no goal exists" do
    @goal.destroy

    get api_nutrition_goals_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert_nil json["nutrition_goal"]
  end

  test "update creates new goal if none exists" do
    @goal.destroy

    assert_difference("NutritionGoal.count") do
      patch api_nutrition_goals_url,
        params: {
          daily_calories: 2200,
          daily_protein: 180,
          daily_carbs: 220,
          daily_fat: 70
        },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 2200, json["nutrition_goal"]["daily_calories"]
  end

  test "update modifies existing goal" do
    assert_no_difference("NutritionGoal.count") do
      patch api_nutrition_goals_url,
        params: {
          daily_calories: 1800,
          daily_protein: 140
        },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1800, json["nutrition_goal"]["daily_calories"]
    assert_equal 140, json["nutrition_goal"]["daily_protein"]

    @goal.reload
    assert_equal 1800, @goal.daily_calories
  end

  test "update allows partial updates" do
    patch api_nutrition_goals_url,
      params: { daily_calories: 2500 },
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    @goal.reload
    assert_equal 2500, @goal.daily_calories
    assert_equal 150, @goal.daily_protein # unchanged
  end

  test "works with session when not authenticated" do
    get api_nutrition_goals_url, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert json.key?("nutrition_goal")
  end
end
