require "test_helper"

class Api::BudgetControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
  end

  test "summary returns monthly and all-time totals" do
    get api_budget_summary_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    assert json.key?("monthly_total_cents")
    assert json.key?("monthly_count")
    assert json.key?("all_time_total_cents")
    assert json.key?("recent_purchases")

    # Should include user one's purchases (1200 + 350 + 800 from recent purchase)
    assert json["all_time_total_cents"] >= 1550
  end

  test "summary returns only user's purchases" do
    get api_budget_summary_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    # Should not include user two's purchases
    purchase_items = json["recent_purchases"].map { |p| p["item_name"] }
    assert_includes purchase_items, "Chicken Breast"
    refute_includes purchase_items, "Rice" # belongs to user two
  end

  test "log_purchase creates new purchase" do
    assert_difference("GroceryPurchase.count") do
      post api_budget_purchases_url,
        params: {
          item_name: "Bananas",
          actual_price_cents: 299,
          purchased_at: Time.current.iso8601,
          store_name: "Safeway"
        },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal "Bananas", json["purchase"]["item_name"]
    assert_equal 299, json["purchase"]["actual_price_cents"]
  end

  test "log_purchase fails without required fields" do
    assert_no_difference("GroceryPurchase.count") do
      post api_budget_purchases_url,
        params: { actual_price_cents: 100 },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :unprocessable_entity
  end

  test "works with session when not authenticated" do
    get api_budget_summary_url, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert json.key?("monthly_total_cents")
  end
end
