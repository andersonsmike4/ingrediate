require "test_helper"

class Api::CompareControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
    @recipe1 = saved_recipes(:one)

    # Create a second recipe for comparison
    @recipe2 = SavedRecipe.create!(
      name: "Chicken Stir Fry",
      user: @user,
      cook_time: "30 minutes",
      difficulty: "easy",
      servings: 4,
      ingredients_json: '[{"name":"chicken","amount":"1 lb"},{"name":"vegetables","amount":"2 cups"}]',
      nutrition_json: '{"calories":350,"protein":"30g","carbs":"25g","fat":"10g"}',
      estimated_cost_cents: 1200
    )
  end

  test "compare returns comparison data for multiple recipes" do
    post api_recipes_compare_url,
      params: { recipe_ids: [@recipe1.id, @recipe2.id] },
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    assert_equal 2, json["comparison"].length

    comparison = json["comparison"]
    assert comparison[0].key?("name")
    assert comparison[0].key?("cook_time")
    assert comparison[0].key?("difficulty")
    assert comparison[0].key?("nutrition")
    assert comparison[0].key?("ingredient_count")
    assert comparison[0].key?("pantry_match")
  end

  test "compare only returns user's recipes" do
    other_recipe = saved_recipes(:two) # belongs to user two

    post api_recipes_compare_url,
      params: { recipe_ids: [@recipe1.id, other_recipe.id] },
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    # Should only return one recipe (the user's recipe)
    assert_equal 1, json["comparison"].length
    assert_equal @recipe1.id, json["comparison"][0]["id"]
  end

  test "compare calculates pantry match correctly" do
    # Add pantry items that match recipe ingredients
    PantryItem.create!(name: "chicken", user: @user)
    PantryItem.create!(name: "vegetables", user: @user)

    post api_recipes_compare_url,
      params: { recipe_ids: [@recipe2.id] },
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    assert_equal 2, json["comparison"][0]["pantry_match"]
  end

  test "compare returns empty array for no recipes" do
    post api_recipes_compare_url,
      params: { recipe_ids: [] },
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 0, json["comparison"].length
  end

  test "works with session when not authenticated" do
    post api_recipes_compare_url,
      params: { recipe_ids: [] },
      as: :json
    assert_response :success
  end
end
