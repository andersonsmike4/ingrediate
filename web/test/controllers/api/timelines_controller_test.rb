require "test_helper"

class Api::TimelinesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
    @recipe = saved_recipes(:one)
  end

  test "generate returns optimized cooking timeline" do
    mock_timeline = {
      total_time: "45 minutes",
      parallel_tasks: [
        { time: "0:00", task: "Preheat oven to 375F" },
        { time: "0:05", task: "Start boiling water" }
      ],
      sequential_tasks: [
        { time: "0:10", task: "Chop vegetables" }
      ]
    }

    mock_ai = Object.new
    def mock_ai.optimize_cooking_timeline(**args)
      {
        total_time: "45 minutes",
        parallel_tasks: [
          { time: "0:00", task: "Preheat oven to 375F" },
          { time: "0:05", task: "Start boiling water" }
        ],
        sequential_tasks: [
          { time: "0:10", task: "Chop vegetables" }
        ]
      }
    end

    AiService.stub(:new, mock_ai) do
      post api_timelines_generate_url,
        params: { recipe_ids: [@recipe.id] },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    json = JSON.parse(response.body)

    assert json["timeline"].present?
    assert_equal "45 minutes", json["timeline"]["total_time"]
    assert json["timeline"]["parallel_tasks"].present?
  end

  test "generate only uses user's recipes" do
    other_recipe = saved_recipes(:two) # belongs to user two

    mock_ai = Object.new
    received_recipes = nil
    mock_ai.define_singleton_method(:optimize_cooking_timeline) do |recipes:|
      received_recipes = recipes
      { total_time: "30 minutes" }
    end

    AiService.stub(:new, mock_ai) do
      post api_timelines_generate_url,
        params: { recipe_ids: [@recipe.id, other_recipe.id] },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    # Should only include user one's recipe
    assert_equal 1, received_recipes.length
  end

  test "generate handles AI service errors" do
    mock_ai = Object.new
    def mock_ai.optimize_cooking_timeline(**args)
      raise AiService::Error.new("Unable to generate timeline")
    end

    AiService.stub(:new, mock_ai) do
      post api_timelines_generate_url,
        params: { recipe_ids: [@recipe.id] },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_equal "Unable to generate timeline", json["error"]
  end

  test "works with session when not authenticated" do
    mock_ai = Object.new
    def mock_ai.optimize_cooking_timeline(**args)
      { total_time: "30 minutes" }
    end

    AiService.stub(:new, mock_ai) do
      post api_timelines_generate_url,
        params: { recipe_ids: [] },
        as: :json
    end

    assert_response :success
  end
end
