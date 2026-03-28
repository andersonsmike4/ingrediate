require "test_helper"

class Api::ChallengesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.regenerate_api_token! if @user.api_token.blank?
    @challenge = cooking_challenges(:one)
  end

  test "today returns existing challenge for current date" do
    get api_challenges_today_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    assert json["challenge"].present?
    assert_equal @challenge.challenge_text, json["challenge"]["challenge_text"]
    assert_equal false, json["submitted"]
  end

  test "today generates new challenge if none exists" do
    # Delete today's challenge
    CookingChallenge.where(challenge_date: Date.current).destroy_all

    mock_ai = Object.new
    def mock_ai.generate_daily_challenge(**args)
      {
        challenge_text: "Cook a meal using seasonal ingredients",
        challenge_type: "seasonal",
        difficulty: "intermediate",
        criteria: { seasonal: true },
        tips: ["Visit farmers market", "Use root vegetables"]
      }
    end

    AiService.stub(:new, mock_ai) do
      assert_difference("CookingChallenge.count") do
        get api_challenges_today_url,
          headers: { "Authorization" => "Bearer #{@user.api_token}" },
          as: :json
      end
    end

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal "Cook a meal using seasonal ingredients", json["challenge"]["challenge_text"]
    assert json["challenge"]["tips"].present?
  end

  test "today handles AI service errors" do
    CookingChallenge.where(challenge_date: Date.current).destroy_all

    mock_ai = Object.new
    def mock_ai.generate_daily_challenge(**args)
      raise AiService::Error.new("Service temporarily unavailable")
    end

    AiService.stub(:new, mock_ai) do
      get api_challenges_today_url,
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_equal "Service temporarily unavailable", json["error"]
  end

  test "submit creates challenge submission" do
    assert_difference("ChallengeSubmission.count") do
      post "/api/challenges/#{@challenge.id}/submit",
        params: { notes: "Made a delicious pasta dish with 4 ingredients" },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    json = JSON.parse(response.body)
    assert json["submission"]["completed_at"].present?
    assert_equal "Made a delicious pasta dish with 4 ingredients", json["submission"]["notes"]
  end

  test "submit updates existing submission" do
    existing_submission = challenge_submissions(:one)

    assert_no_difference("ChallengeSubmission.count") do
      post "/api/challenges/#{existing_submission.cooking_challenge_id}/submit",
        params: { notes: "Updated notes" },
        headers: { "Authorization" => "Bearer #{@user.api_token}" },
        as: :json
    end

    assert_response :success
    existing_submission.reload
    assert_equal "Updated notes", existing_submission.notes
  end

  test "history returns user's past submissions" do
    get api_challenges_history_url,
      headers: { "Authorization" => "Bearer #{@user.api_token}" },
      as: :json

    assert_response :success
    json = JSON.parse(response.body)

    assert json["history"].present?
    assert json["history"].length >= 1
    assert json["history"][0]["challenge"].present?
    assert json["history"][0]["submission"].present?
  end

  test "requires authentication" do
    get api_challenges_today_url, as: :json
    assert_response :unauthorized
  end
end
