require "test_helper"

class Api::PantryControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Clear any existing pantry items
    PantryItem.delete_all
  end

  test "should get index" do
    # Get the session_id by making a request first
    get api_pantry_url, as: :json
    session_id = session.id.to_s

    # Create some pantry items for this session
    PantryItem.create!(name: "tomatoes", category: "produce", session_id: session_id)
    PantryItem.create!(name: "milk", category: "dairy", session_id: session_id)

    # Create an item for a different session (should not appear)
    PantryItem.create!(name: "chicken", category: "protein", session_id: "different_session")

    get api_pantry_url, as: :json
    assert_response :success

    json = JSON.parse(response.body)
    assert_equal 2, json["pantry_items"].length
  end

  test "should create pantry item" do
    assert_difference("PantryItem.count") do
      post api_pantry_url,
           params: { name: "Bananas", category: "produce" },
           as: :json
    end

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal "bananas", json["pantry_item"]["name"]
    assert_equal "produce", json["pantry_item"]["category"]
  end

  test "should not create pantry item without name" do
    assert_no_difference("PantryItem.count") do
      post api_pantry_url,
           params: { category: "produce" },
           as: :json
    end

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert json["error"].present?
  end

  test "should bulk create pantry items" do
    items = [
      { name: "Tomatoes", category: "produce" },
      { name: "Milk", category: "dairy" },
      { name: "Chicken", category: "protein" }
    ]

    assert_difference("PantryItem.count", 3) do
      post api_pantry_bulk_url,
           params: { items: items },
           as: :json
    end

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal 3, json["pantry_items"].length
  end

  test "should skip duplicates in bulk create" do
    # Create initial item using API to get session
    post api_pantry_url, params: { name: "Tomatoes", category: "produce" }, as: :json

    items = [
      { name: "Tomatoes", category: "produce" }, # Duplicate
      { name: "Milk", category: "dairy" }        # New
    ]

    assert_difference("PantryItem.count", 1) do
      post api_pantry_bulk_url,
           params: { items: items },
           as: :json
    end

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal 1, json["pantry_items"].length
  end

  test "should destroy pantry item" do
    # Create item using API to get session
    post api_pantry_url, params: { name: "Tomatoes", category: "produce" }, as: :json
    pantry_item_id = JSON.parse(response.body)["pantry_item"]["id"]

    assert_difference("PantryItem.count", -1) do
      delete api_pantry_url(pantry_item_id), as: :json
    end

    assert_response :no_content
  end

  test "should not destroy pantry item from different session" do
    other_item = PantryItem.create!(name: "milk", category: "dairy", session_id: "different_session")

    assert_no_difference("PantryItem.count") do
      delete api_pantry_url(other_item.id), as: :json
    end

    assert_response :not_found
  end

  test "should clear all pantry items for session" do
    # Create items using API to get session
    post api_pantry_url, params: { name: "Item1" }, as: :json
    post api_pantry_url, params: { name: "Item2" }, as: :json
    post api_pantry_url, params: { name: "Item3" }, as: :json

    # Create item for different session
    other_item = PantryItem.create!(name: "other_item", session_id: "different_session")

    assert_difference("PantryItem.count", -3) do
      delete api_pantry_url, as: :json
    end

    assert_response :no_content
    assert PantryItem.exists?(other_item.id)
  end

  private

  def api_pantry_url(id = nil)
    id ? "/api/pantry/#{id}" : "/api/pantry"
  end

  def api_pantry_bulk_url
    "/api/pantry/bulk"
  end
end
