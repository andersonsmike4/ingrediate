require "test_helper"

class Api::CollectionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
    @collection = recipe_collections(:one)
    @recipe = saved_recipes(:one)
  end

  test "index returns user's collections" do
    get api_collections_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    collection_names = json["collections"].map { |c| c["name"] }
    assert_includes collection_names, "My Favorite Recipes"
    refute_includes collection_names, "Quick Dinners" # belongs to user two
  end

  test "create makes new collection" do
    assert_difference("RecipeCollection.count") do
      post api_collections_url,
        params: { name: "Summer BBQ", description: "Grilling recipes" },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal "Summer BBQ", json["collection"]["name"]
  end

  test "create fails without name" do
    assert_no_difference("RecipeCollection.count") do
      post api_collections_url,
        params: { description: "No name" },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :unprocessable_entity
  end

  test "show returns collection with recipes" do
    get "/api/collections/#{@collection.id}",
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal @collection.name, json["collection"]["name"]
  end

  test "show fails for other user's collection" do
    other_collection = recipe_collections(:two)

    get "/api/collections/#{other_collection.id}",
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :not_found
  end

  test "destroy removes collection" do
    assert_difference("RecipeCollection.count", -1) do
      delete "/api/collections/#{@collection.id}",
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :no_content
  end

  test "add_recipe adds recipe to collection" do
    # Create a second recipe for user one
    new_recipe = SavedRecipe.create!(name: "New Recipe", user: @user)

    assert_difference("CollectionRecipe.count") do
      post "/api/collections/#{@collection.id}/recipes",
        params: { saved_recipe_id: new_recipe.id },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :created
  end

  test "add_recipe fails for other user's recipe" do
    other_recipe = saved_recipes(:two) # belongs to user two

    assert_no_difference("CollectionRecipe.count") do
      post "/api/collections/#{@collection.id}/recipes",
        params: { saved_recipe_id: other_recipe.id },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :not_found
  end

  test "remove_recipe removes recipe from collection" do
    assert_difference("CollectionRecipe.count", -1) do
      delete "/api/collections/#{@collection.id}/recipes/#{@recipe.id}",
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :no_content
  end

  test "works with session when not authenticated" do
    get api_collections_url, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert json["collections"].is_a?(Array)
  end
end
