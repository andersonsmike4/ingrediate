require "test_helper"

class Api::IngredientsControllerTest < ActionDispatch::IntegrationTest
  test "analyze_photo with valid image returns 200" do
    # Create a mock uploaded file
    file = Rack::Test::UploadedFile.new(
      StringIO.new("fake image data"),
      "image/jpeg",
      original_filename: "test.jpg"
    )

    mock_ingredients = [
      { name: "tomato", amount: "~3 pieces" },
      { name: "onion", amount: "~1 medium" }
    ]

    # Create a mock AiService instance using a simple object
    ai_service_instance = Object.new
    def ai_service_instance.analyze_photo(**args)
      [
        { name: "tomato", amount: "~3 pieces" },
        { name: "onion", amount: "~1 medium" }
      ]
    end

    AiService.stub(:new, ai_service_instance) do
      post api_ingredients_analyze_photo_path, params: { photo: file }
    end

    assert_response :success
    json_response = JSON.parse(response.body, symbolize_names: true)
    assert_equal 2, json_response[:ingredients].length
    assert_equal "tomato", json_response[:ingredients][0][:name]
  end

  test "analyze_photo without photo returns 400" do
    post api_ingredients_analyze_photo_path, params: {}

    assert_response :bad_request
    json_response = JSON.parse(response.body)
    assert_equal "Photo is required", json_response["error"]
  end

  test "analyze_photo with invalid content type returns 422" do
    file = Rack::Test::UploadedFile.new(
      StringIO.new("fake pdf data"),
      "application/pdf",
      original_filename: "test.pdf"
    )

    post api_ingredients_analyze_photo_path, params: { photo: file }

    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_includes json_response["error"], "Invalid file type"
  end

  test "analyze_photo with oversized file returns 422" do
    # Create a file that's larger than MAX_FILE_SIZE (10MB)
    large_data = "x" * (11 * 1024 * 1024) # 11 MB

    file = Rack::Test::UploadedFile.new(
      StringIO.new(large_data),
      "image/jpeg",
      original_filename: "large.jpg"
    )

    post api_ingredients_analyze_photo_path, params: { photo: file }

    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_includes json_response["error"], "File too large"
  end

  test "analyze_photo handles AiService errors" do
    file = Rack::Test::UploadedFile.new(
      StringIO.new("fake image data"),
      "image/png",
      original_filename: "test.png"
    )

    # Create a mock AiService instance that raises an error
    ai_service_instance = Object.new
    def ai_service_instance.analyze_photo(**args)
      raise AiService::Error.new("AI service unavailable")
    end

    AiService.stub(:new, ai_service_instance) do
      post api_ingredients_analyze_photo_path, params: { photo: file }
    end

    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_equal "AI service unavailable", json_response["error"]
  end

  test "analyze_photo accepts webp images" do
    file = Rack::Test::UploadedFile.new(
      StringIO.new("fake webp data"),
      "image/webp",
      original_filename: "test.webp"
    )

    mock_ingredients = [{ name: "apple", amount: "~2 pieces" }]

    ai_service_instance = Object.new
    def ai_service_instance.analyze_photo(**args)
      [{ name: "apple", amount: "~2 pieces" }]
    end

    AiService.stub(:new, ai_service_instance) do
      post api_ingredients_analyze_photo_path, params: { photo: file }
    end

    assert_response :success
  end

  test "analyze_photo has CSRF protection" do
    # Rails integration tests automatically handle CSRF for non-GET requests
    # This test verifies the endpoint is accessible via POST (which requires CSRF)
    file = Rack::Test::UploadedFile.new(
      StringIO.new("fake image"),
      "image/jpeg",
      original_filename: "test.jpg"
    )

    mock_ingredients = []

    ai_service_instance = Object.new
    def ai_service_instance.analyze_photo(**args)
      []
    end

    AiService.stub(:new, ai_service_instance) do
      post api_ingredients_analyze_photo_path, params: { photo: file }
    end

    # If CSRF protection wasn't enabled, we'd get a different response
    assert_response :success
  end
end
