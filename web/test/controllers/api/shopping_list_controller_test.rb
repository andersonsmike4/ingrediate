require "test_helper"

class Api::ShoppingListControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
    @item = shopping_list_items(:one)
  end

  test "index returns user's shopping list items" do
    get api_shopping_list_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert json["items"].present?

    # Should only return user's items
    item_names = json["items"].map { |i| i["name"] }
    assert_includes item_names, "Tomatoes"
    refute_includes item_names, "Bread" # belongs to user two
  end

  test "create adds new shopping list item" do
    assert_difference("ShoppingListItem.count") do
      post api_shopping_list_url,
        params: { name: "Eggs", amount: "1 dozen" },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal "Eggs", json["item"]["name"]
    assert_equal "1 dozen", json["item"]["amount"]
  end

  test "create fails without name" do
    assert_no_difference("ShoppingListItem.count") do
      post api_shopping_list_url,
        params: { amount: "2 lbs" },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :unprocessable_entity
  end

  test "toggle changes checked status" do
    patch "/api/shopping_list/#{@item.id}/toggle",
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal true, json["item"]["checked"]
  end

  test "toggle fails for other user's item" do
    other_item = shopping_list_items(:three) # belongs to user two

    patch "/api/shopping_list/#{other_item.id}/toggle",
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :not_found
  end

  test "destroy removes item" do
    assert_difference("ShoppingListItem.count", -1) do
      delete "/api/shopping_list/#{@item.id}",
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :no_content
  end

  test "destroy fails for other user's item" do
    other_item = shopping_list_items(:three)

    assert_no_difference("ShoppingListItem.count") do
      delete "/api/shopping_list/#{other_item.id}",
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :not_found
  end

  test "clear_checked removes only checked items" do
    checked_item = shopping_list_items(:two)
    unchecked_item = shopping_list_items(:one)

    delete api_shopping_list_clear_checked_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :no_content
    assert_nil ShoppingListItem.find_by(id: checked_item.id)
    assert_not_nil ShoppingListItem.find_by(id: unchecked_item.id)
  end

  test "works with session when not authenticated" do
    get api_shopping_list_url, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert json["items"].is_a?(Array)
  end
end
