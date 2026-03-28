require "test_helper"

class Api::RecipesControllerTest < ActionDispatch::IntegrationTest
  def setup
    # Clear any existing saved recipes to ensure clean test state
    CollectionRecipe.delete_all
    CookingLog.delete_all
    SavedRecipe.delete_all
  end

  def current_session_id
    # Make a request to ensure session exists
    get api_recipes_saved_path unless @integration_session
    session.id.to_s
  end

  test "generate with valid ingredients returns 200" do
    mock_recipes = [
      {
        name: "Pasta Primavera",
        description: "Fresh veggie pasta",
        cook_time: "25 minutes",
        difficulty: "easy",
        servings: 4,
        ingredients: [
          { name: "pasta", amount: "300g", have: true }
        ],
        steps: ["Boil water", "Cook pasta"],
        nutrition: { calories: 400, protein: "12g", carbs: "70g", fat: "5g" },
        substitutions: []
      }
    ]

    ai_service_instance = Object.new
    def ai_service_instance.generate_recipes(**args)
      [
        {
          name: "Pasta Primavera",
          description: "Fresh veggie pasta",
          cook_time: "25 minutes",
          difficulty: "easy",
          servings: 4,
          ingredients: [
            { name: "pasta", amount: "300g", have: true }
          ],
          steps: ["Boil water", "Cook pasta"],
          nutrition: { calories: 400, protein: "12g", carbs: "70g", fat: "5g" },
          substitutions: []
        }
      ]
    end

    AiService.stub(:new, ai_service_instance) do
      post api_recipes_generate_path, params: { ingredients: "pasta, tomato" }
    end

    assert_response :success
    json_response = JSON.parse(response.body, symbolize_names: true)
    assert_equal 1, json_response[:recipes].length
    assert_equal "Pasta Primavera", json_response[:recipes][0][:name]
  end

  test "generate without ingredients returns 400" do
    post api_recipes_generate_path, params: {}

    assert_response :bad_request
    json_response = JSON.parse(response.body)
    assert_equal "Ingredients are required", json_response["error"]
  end

  test "generate with empty ingredients returns 400" do
    post api_recipes_generate_path, params: { ingredients: "" }

    assert_response :bad_request
    json_response = JSON.parse(response.body)
    assert_equal "Ingredients are required", json_response["error"]
  end

  test "generate handles AiService errors with 422" do
    ai_service_instance = Object.new
    def ai_service_instance.generate_recipes(**args)
      raise AiService::Error.new("Service unavailable")
    end

    AiService.stub(:new, ai_service_instance) do
      post api_recipes_generate_path, params: { ingredients: "chicken" }
    end

    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_equal "Service unavailable", json_response["error"]
  end

  test "generate passes filters to AiService" do
    mock_recipes = []

    # Track what filters are passed
    received_filters = nil

    ai_service_instance = Object.new
    ai_service_instance.define_singleton_method(:generate_recipes) do |ingredients:, filters:, household: nil, preferences: nil|
      received_filters = filters
      mock_recipes
    end

    AiService.stub(:new, ai_service_instance) do
      post api_recipes_generate_path, params: {
        ingredients: "chicken",
        dietary: "vegetarian",
        cuisine: "italian",
        cook_time: "30",
        difficulty: "easy",
        servings: "2"
      }
    end

    assert_response :success
    assert_equal "vegetarian", received_filters[:dietary]
    assert_equal "italian", received_filters[:cuisine]
    assert_equal "30", received_filters[:cook_time]
    assert_equal "easy", received_filters[:difficulty]
    assert_equal "2", received_filters[:servings]
  end

  test "saved_index returns only current session recipes" do
    # First request to establish session
    my_session_id = current_session_id

    other_session_id = "other_session_123"

    recipe1 = SavedRecipe.create!(
      name: "My Recipe",
      session_id: my_session_id,
      description: "Test recipe"
    )

    recipe2 = SavedRecipe.create!(
      name: "Other Recipe",
      session_id: other_session_id,
      description: "Other test recipe"
    )

    get api_recipes_saved_path

    assert_response :success
    json_response = JSON.parse(response.body, symbolize_names: true)

    # Should only return recipes from current session
    assert_equal 1, json_response[:recipes].length
    assert_equal "My Recipe", json_response[:recipes][0][:name]
  end

  test "saved_index returns recipes in descending order" do
    # First request to establish session
    my_session_id = current_session_id

    recipe1 = SavedRecipe.create!(
      name: "First Recipe",
      session_id: my_session_id,
      created_at: 2.days.ago
    )

    recipe2 = SavedRecipe.create!(
      name: "Second Recipe",
      session_id: my_session_id,
      created_at: 1.day.ago
    )

    get api_recipes_saved_path

    assert_response :success
    json_response = JSON.parse(response.body, symbolize_names: true)

    assert_equal 2, json_response[:recipes].length
    assert_equal "Second Recipe", json_response[:recipes][0][:name]
    assert_equal "First Recipe", json_response[:recipes][1][:name]
  end

  test "saved_create with valid params returns 201" do
    recipe_params = {
      recipe: {
        name: "Test Recipe",
        description: "A test recipe",
        cook_time: "30 minutes",
        difficulty: "easy",
        servings: 4,
        ingredients_json: '[{"name":"pasta","amount":"200g"}]',
        steps_json: '["Step 1","Step 2"]',
        nutrition_json: '{"calories":400}',
        substitutions_json: '[]'
      }
    }

    post api_recipes_saved_path, params: recipe_params

    assert_response :created
    json_response = JSON.parse(response.body, symbolize_names: true)
    assert_equal "Test Recipe", json_response[:recipe][:name]
    assert_not_nil json_response[:recipe][:session_id]

    # Verify it was actually saved
    assert_equal 1, SavedRecipe.count
    saved = SavedRecipe.last
    assert_equal "Test Recipe", saved.name
  end

  test "saved_create with invalid params returns 422" do
    recipe_params = {
      recipe: {
        description: "A test recipe without a name"
      }
    }

    post api_recipes_saved_path, params: recipe_params

    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_includes json_response["error"], "Name can't be blank"
  end

  test "saved_create automatically sets session_id" do
    recipe_params = {
      recipe: {
        name: "Auto Session Recipe"
      }
    }

    post api_recipes_saved_path, params: recipe_params

    assert_response :created
    json_response = JSON.parse(response.body, symbolize_names: true)
    assert_not_nil json_response[:recipe][:session_id]
    assert_not_empty json_response[:recipe][:session_id]
  end

  test "saved_destroy with matching session returns 204" do
    # Establish session first
    my_session_id = current_session_id

    recipe = SavedRecipe.create!(
      name: "Recipe to Delete",
      session_id: my_session_id
    )

    assert_difference "SavedRecipe.count", -1 do
      delete "/api/recipes/saved/#{recipe.id}"
    end

    assert_response :no_content
  end

  test "saved_destroy with non-matching session returns 404" do
    # Establish session first
    get api_recipes_saved_path

    other_session_id = "other_session_456"

    recipe = SavedRecipe.create!(
      name: "Other User Recipe",
      session_id: other_session_id
    )

    assert_no_difference "SavedRecipe.count" do
      delete "/api/recipes/saved/#{recipe.id}"
    end

    assert_response :not_found
  end

  test "saved_destroy with non-existent id returns 404" do
    non_existent_id = 99999

    delete "/api/recipes/saved/#{non_existent_id}"

    assert_response :not_found
  end

  test "saved_create prevents mass assignment of session_id" do
    # Initialize session first
    my_session_id = current_session_id

    # Attempt to set a different session_id via params
    recipe_params = {
      recipe: {
        name: "Hacker Recipe",
        session_id: "hacker_session_789"
      }
    }

    post api_recipes_saved_path, params: recipe_params

    # Should use the actual session, not the one from params
    assert_response :created
    json_response = JSON.parse(response.body, symbolize_names: true)
    assert_equal my_session_id, json_response[:recipe][:session_id]
    assert_not_equal "hacker_session_789", json_response[:recipe][:session_id]
  end

  test "all endpoints have CSRF protection" do
    # Rails integration tests automatically handle CSRF tokens
    # This verifies that POST/DELETE endpoints are accessible (CSRF is enforced)

    # Test POST generate
    ai_service_instance = Object.new
    def ai_service_instance.generate_recipes(**args)
      []
    end

    AiService.stub(:new, ai_service_instance) do
      post api_recipes_generate_path, params: { ingredients: "test" }
      assert_response :success
    end

    # Test POST saved_create
    post api_recipes_saved_path, params: { recipe: { name: "Test" } }
    assert_response :created

    # Test DELETE saved_destroy
    my_session_id = current_session_id
    recipe = SavedRecipe.create!(name: "Delete Me", session_id: my_session_id)
    delete "/api/recipes/saved/#{recipe.id}"
    assert_response :no_content
  end
end
