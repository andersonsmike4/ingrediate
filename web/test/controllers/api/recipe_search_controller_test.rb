require "test_helper"

class Api::RecipeSearchControllerTest < ActionDispatch::IntegrationTest
  test "should search recipes by meal name" do
    # Create pantry items for this session
    post "/api/pantry", params: { name: "flour", category: "grains" }, as: :json
    post "/api/pantry", params: { name: "blueberries", category: "produce" }, as: :json
    post "/api/pantry", params: { name: "milk", category: "dairy" }, as: :json

    # Mock the AiService response
    mock_recipes = [
      {
        name: "Classic Blueberry Muffins",
        description: "Traditional muffins with a tender crumb",
        cook_time: "30 minutes",
        difficulty: "easy",
        servings: 4,
        ingredients: [
          { name: "flour", amount: "2 cups", have: true },
          { name: "blueberries", amount: "1 cup", have: true },
          { name: "sugar", amount: "1/2 cup", have: false }
        ],
        steps: [
          "Preheat oven to 375F",
          "Mix dry ingredients",
          "Add wet ingredients",
          "Fold in blueberries",
          "Bake for 20 minutes"
        ],
        nutrition: { calories: 250, protein: "4g", carbs: "45g", fat: "6g" }
      }
    ]

    ai_service = Minitest::Mock.new
    # Use Hash matcher - the order doesn't matter for keyword arguments
    ai_service.expect :search_by_meal_name, mock_recipes do |**kwargs|
      kwargs[:meal_name] == "blueberry muffins" &&
      kwargs[:pantry_items].sort == ["blueberries", "flour", "milk"] &&
      kwargs[:household].nil? &&
      kwargs[:preferences].nil?
    end

    AiService.stub :new, ai_service do
      post "/api/recipes/search",
           params: { meal_name: "blueberry muffins" },
           as: :json

      assert_response :success
      json = JSON.parse(response.body)
      assert_equal 1, json["recipes"].length
      assert_equal "Classic Blueberry Muffins", json["recipes"][0]["name"]
      assert_equal true, json["recipes"][0]["ingredients"][0]["have"]
    end

    ai_service.verify
  end

  test "should return error when meal_name is missing" do
    post "/api/recipes/search", params: {}, as: :json

    assert_response :bad_request
    json = JSON.parse(response.body)
    assert_equal "meal_name is required", json["error"]
  end

  test "should handle AI service errors gracefully" do
    ai_service = Minitest::Mock.new
    ai_service.expect :search_by_meal_name, nil do |**kwargs|
      raise AiService::Error, "API error"
    end

    AiService.stub :new, ai_service do
      post "/api/recipes/search",
           params: { meal_name: "pancakes" },
           as: :json

      assert_response :unprocessable_entity
      json = JSON.parse(response.body)
      assert_equal "API error", json["error"]
    end
  end
end
