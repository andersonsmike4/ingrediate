require "test_helper"

class Api::SubstitutionLogsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
    @log = substitution_logs(:one)
  end

  test "index returns user's substitution logs" do
    get api_substitution_logs_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    assert json["substitution_logs"].present?
    original_ingredients = json["substitution_logs"].map { |l| l["original_ingredient"] }
    assert_includes original_ingredients, "butter"
  end

  test "create adds new substitution log" do
    assert_difference("SubstitutionLog.count") do
      post api_substitution_logs_url,
        params: {
          original_ingredient: "eggs",
          substitute_ingredient: "flax eggs",
          recipe_name: "Cookies",
          rating: 3,
          notes: "Texture was different"
        },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal "eggs", json["substitution_log"]["original_ingredient"]
    assert_equal "flax eggs", json["substitution_log"]["substitute_ingredient"]
  end

  test "create fails without required fields" do
    assert_no_difference("SubstitutionLog.count") do
      post api_substitution_logs_url,
        params: { notes: "Missing ingredients" },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :unprocessable_entity
  end

  test "lookup returns substitutions for specific ingredient" do
    get api_substitution_logs_lookup_url,
      params: { ingredient: "butter" },
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    assert json["substitutions"].present?
    assert_equal 1, json["substitutions"].length
    assert_equal "butter", json["substitutions"][0]["original_ingredient"]
    assert_equal "olive oil", json["substitutions"][0]["substitute_ingredient"]
  end

  test "lookup returns empty for unknown ingredient" do
    get api_substitution_logs_lookup_url,
      params: { ingredient: "unknown_ingredient" },
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 0, json["substitutions"].length
  end

  test "requires authentication" do
    get api_substitution_logs_url, as: :json
    assert_response :unauthorized
  end
end
