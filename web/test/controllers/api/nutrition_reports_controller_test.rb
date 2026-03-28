require "test_helper"

class Api::NutritionReportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
  end

  test "weekly returns nutrition report based on cooking logs" do
    mock_report = {
      summary: "You've cooked 2 meals this week",
      total_calories: 1800,
      average_protein: "45g",
      recommendations: ["Consider adding more vegetables"]
    }

    mock_ai = Object.new
    def mock_ai.generate_nutrition_report(**args)
      {
        summary: "You've cooked 2 meals this week",
        total_calories: 1800,
        average_protein: "45g",
        recommendations: ["Consider adding more vegetables"]
      }
    end

    AiService.stub(:new, mock_ai) do
      get api_nutrition_reports_weekly_url,
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    json = JSON.parse(response.body)

    assert json["report"].present?
    assert_equal "You've cooked 2 meals this week", json["report"]["summary"]
    assert json["report"]["recommendations"].present?
  end

  test "weekly includes nutrition goals in AI call" do
    received_args = nil
    mock_ai = Object.new
    mock_ai.define_singleton_method(:generate_nutrition_report) do |**args|
      received_args = args
      { summary: "Test report" }
    end

    AiService.stub(:new, mock_ai) do
      get api_nutrition_reports_weekly_url,
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    assert received_args[:goals].present?
    assert_equal 2000, received_args[:goals][:daily_calories]
  end

  test "weekly works without nutrition goals" do
    nutrition_goals(:one).destroy

    mock_ai = Object.new
    received_goals = :not_set
    mock_ai.define_singleton_method(:generate_nutrition_report) do |**args|
      received_goals = args[:goals]
      { summary: "Test report" }
    end

    AiService.stub(:new, mock_ai) do
      get api_nutrition_reports_weekly_url,
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    assert_nil received_goals
  end

  test "weekly handles AI service errors" do
    mock_ai = Object.new
    def mock_ai.generate_nutrition_report(**args)
      raise AiService::Error.new("Report generation failed")
    end

    AiService.stub(:new, mock_ai) do
      get api_nutrition_reports_weekly_url,
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_equal "Report generation failed", json["error"]
  end

  test "requires authentication" do
    get api_nutrition_reports_weekly_url, as: :json
    assert_response :unauthorized
  end
end
