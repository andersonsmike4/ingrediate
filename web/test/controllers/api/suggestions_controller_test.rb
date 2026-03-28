require "test_helper"

class Api::SuggestionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
  end

  test "smart_suggest returns AI-generated suggestions" do
    mock_suggestions = [
      {
        recipe_name: "Quick Pasta Dinner",
        reasoning: "You have all the ingredients and it's quick",
        estimated_time: "20 minutes",
        uses_ingredients: ["pasta", "tomatoes", "garlic"]
      }
    ]

    mock_ai = Object.new
    def mock_ai.suggest_what_to_cook(**args)
      [
        {
          recipe_name: "Quick Pasta Dinner",
          reasoning: "You have all the ingredients and it's quick",
          estimated_time: "20 minutes",
          uses_ingredients: ["pasta", "tomatoes", "garlic"]
        }
      ]
    end

    AiService.stub(:new, mock_ai) do
      post api_suggestions_smart_url,
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    json = JSON.parse(response.body)

    assert json["suggestions"].present?
    assert_equal 1, json["suggestions"].length
    assert_equal "Quick Pasta Dinner", json["suggestions"][0]["recipe_name"]
  end

  test "smart_suggest passes data to AI service" do
    # Create pantry items for the test
    PantryItem.create!(name: "Milk", user: @user, category: "dairy", expires_at: 1.day.from_now)
    PantryItem.create!(name: "Cheese", user: @user, category: "dairy")

    received_args = nil
    mock_ai = Object.new
    mock_ai.define_singleton_method(:suggest_what_to_cook) do |**args|
      received_args = args
      []
    end

    AiService.stub(:new, mock_ai) do
      post api_suggestions_smart_url,
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    assert_not_nil received_args
    assert received_args.key?(:pantry_items)
    assert received_args.key?(:expiring_soon)
  end

  test "smart_suggest handles AI service errors" do
    mock_ai = Object.new
    def mock_ai.suggest_what_to_cook(**args)
      raise AiService::Error.new("API quota exceeded")
    end

    AiService.stub(:new, mock_ai) do
      post api_suggestions_smart_url,
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_equal "API quota exceeded", json["error"]
  end

  test "works with session when not authenticated" do
    mock_ai = Object.new
    def mock_ai.suggest_what_to_cook(**args)
      []
    end

    AiService.stub(:new, mock_ai) do
      post api_suggestions_smart_url, as: :json
    end

    assert_response :success
  end
end
