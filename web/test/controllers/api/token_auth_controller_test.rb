require "test_helper"

class Api::TokenAuthControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
  end

  test "should sign in with valid credentials and return token" do
    post api_auth_token_sign_in_url, params: {
      user: {
        email: @user.email,
        password: "password123"
      }
    }, as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert json["token"].present?
    assert_equal @user.email, json["user"]["email"]
  end

  test "should fail sign in with invalid credentials" do
    post api_auth_token_sign_in_url, params: {
      user: {
        email: @user.email,
        password: "wrongpassword"
      }
    }, as: :json

    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert json["error"].present?
  end

  test "should sign up new user and return token" do
    assert_difference("User.count") do
      post api_auth_token_sign_up_url, params: {
        user: {
          name: "New User",
          email: "newuser@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      }, as: :json
    end

    assert_response :created
    json = JSON.parse(response.body)
    assert json["token"].present?
    assert_equal "newuser@example.com", json["user"]["email"]
    assert_equal "New User", json["user"]["name"]

    # Verify token was generated
    new_user = User.find_by(email: "newuser@example.com")
    assert new_user.api_token.present?
  end

  test "should fail sign up with invalid data" do
    assert_no_difference("User.count") do
      post api_auth_token_sign_up_url, params: {
        user: {
          name: "New User",
          email: "invalidemail",
          password: "short",
          password_confirmation: "different"
        }
      }, as: :json
    end

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert json["error"].present?
  end

  test "should sign out and invalidate token" do
    delete api_auth_token_sign_out_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success

    # Verify old token is now invalid
    get api_auth_status_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    json = JSON.parse(response.body)
    assert_equal false, json["authenticated"]
  end

  test "should reject sign out without valid token" do
    delete api_auth_token_sign_out_url, as: :json

    assert_response :unauthorized
  end

  test "should authenticate with bearer token" do
    get api_auth_status_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal true, json["authenticated"]
    assert_equal @user.email, json["user"]["email"]
  end

  test "should reject invalid bearer token" do
    get api_auth_status_url,
      headers: { "Authorization" => "Bearer invalid_token_12345" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal false, json["authenticated"]
  end

  test "should work without CSRF token when using bearer auth" do
    # This simulates a mobile app request without CSRF token
    post api_pantry_url,
      params: { name: "Tomatoes" },
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    # Should not get CSRF error
    assert_response :success
  end
end
