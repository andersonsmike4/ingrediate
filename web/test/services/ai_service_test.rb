require "test_helper"

class AiServiceTest < ActiveSupport::TestCase
  def setup
    @api_key = "test_api_key_123"
    @original_api_key = Rails.application.credentials.gemini_api_key

    # Stub the credentials to return our test API key
    Rails.application.credentials.stub(:gemini_api_key, @api_key) do
      @service = AiService.new
    end
  end

  test "initialize raises error without API key" do
    # Temporarily clear both credential and ENV sources
    Rails.application.credentials.stub(:gemini_api_key, nil) do
      ENV.stub(:[], ->(key) { key == "GEMINI_API_KEY" ? nil : ENV.fetch(key, nil) }) do
        error = assert_raises(AiService::Error) do
          AiService.new
        end
        assert_equal "Gemini API key not configured", error.message
      end
    end
  end

  test "initialize succeeds with API key from credentials" do
    Rails.application.credentials.stub(:gemini_api_key, "test_key") do
      service = AiService.new
      assert_not_nil service
    end
  end

  test "initialize succeeds with API key from ENV" do
    Rails.application.credentials.stub(:gemini_api_key, nil) do
      ENV.stub(:[], ->(key) { key == "GEMINI_API_KEY" ? "env_test_key" : ENV.fetch(key, nil) }) do
        service = AiService.new
        assert_not_nil service
      end
    end
  end

  test "generate_recipes makes correct API call and parses response" do
    mock_response_body = {
      "candidates" => [
        {
          "content" => {
            "parts" => [
              {
                "text" => '[{"name":"Pasta","description":"Quick pasta","cook_time":"20 min","difficulty":"easy","servings":2,"ingredients":[{"name":"pasta","amount":"200g","have":true}],"steps":["Boil water","Cook pasta"],"nutrition":{"calories":400,"protein":"12g","carbs":"70g","fat":"5g"},"substitutions":[]}]'
              }
            ]
          }
        }
      ]
    }

    stub_response = Minitest::Mock.new
    stub_response.expect(:success?, true)
    stub_response.expect(:body, mock_response_body)

    stub_connection = Minitest::Mock.new
    stub_connection.expect(:post, stub_response)

    Faraday.stub(:new, ->(url:, &block) { stub_connection }) do
      Rails.application.credentials.stub(:gemini_api_key, @api_key) do
        service = AiService.new
        result = service.generate_recipes(ingredients: "pasta, tomato", filters: {})

        assert_kind_of Array, result
        assert_equal 1, result.length
        assert_equal "Pasta", result.first[:name]
      end
    end

    stub_connection.verify
  end

  test "generate_recipes strips markdown fences from response" do
    mock_response_body = {
      "candidates" => [
        {
          "content" => {
            "parts" => [
              {
                "text" => "```json\n[{\"name\":\"Test Recipe\"}]\n```"
              }
            ]
          }
        }
      ]
    }

    stub_response = Minitest::Mock.new
    stub_response.expect(:success?, true)
    stub_response.expect(:body, mock_response_body)

    stub_connection = Minitest::Mock.new
    stub_connection.expect(:post, stub_response)

    Faraday.stub(:new, ->(url:, &block) { stub_connection }) do
      Rails.application.credentials.stub(:gemini_api_key, @api_key) do
        service = AiService.new
        result = service.generate_recipes(ingredients: "test", filters: {})

        assert_kind_of Array, result
        assert_equal "Test Recipe", result.first[:name]
      end
    end

    stub_connection.verify
  end

  test "generate_recipes handles JSON parse error" do
    mock_response_body = {
      "candidates" => [
        {
          "content" => {
            "parts" => [
              {
                "text" => "This is not valid JSON"
              }
            ]
          }
        }
      ]
    }

    stub_response = Minitest::Mock.new
    stub_response.expect(:success?, true)
    stub_response.expect(:body, mock_response_body)

    stub_connection = Minitest::Mock.new
    stub_connection.expect(:post, stub_response)

    Faraday.stub(:new, ->(url:, &block) { stub_connection }) do
      Rails.application.credentials.stub(:gemini_api_key, @api_key) do
        service = AiService.new
        error = assert_raises(AiService::Error) do
          service.generate_recipes(ingredients: "test", filters: {})
        end
        assert_equal "Unable to generate recipes. Please try again.", error.message
      end
    end

    stub_connection.verify
  end

  test "analyze_photo makes correct API call with image data" do
    mock_response_body = {
      "candidates" => [
        {
          "content" => {
            "parts" => [
              {
                "text" => '[{"name":"tomato","amount":"~3 pieces"}]'
              }
            ]
          }
        }
      ]
    }

    stub_response = Minitest::Mock.new
    stub_response.expect(:success?, true)
    stub_response.expect(:body, mock_response_body)

    stub_connection = Minitest::Mock.new
    stub_connection.expect(:post, stub_response)

    Faraday.stub(:new, ->(url:, &block) { stub_connection }) do
      Rails.application.credentials.stub(:gemini_api_key, @api_key) do
        service = AiService.new
        result = service.analyze_photo(
          image_base64: "base64encodedimage",
          media_type: "image/jpeg"
        )

        assert_kind_of Array, result
        assert_equal 1, result.length
        assert_equal "tomato", result.first[:name]
        assert_equal "~3 pieces", result.first[:amount]
      end
    end

    stub_connection.verify
  end

  test "analyze_photo strips markdown fences" do
    mock_response_body = {
      "candidates" => [
        {
          "content" => {
            "parts" => [
              {
                "text" => "```\n[{\"name\":\"carrot\",\"amount\":\"~2 pieces\"}]\n```"
              }
            ]
          }
        }
      ]
    }

    stub_response = Minitest::Mock.new
    stub_response.expect(:success?, true)
    stub_response.expect(:body, mock_response_body)

    stub_connection = Minitest::Mock.new
    stub_connection.expect(:post, stub_response)

    Faraday.stub(:new, ->(url:, &block) { stub_connection }) do
      Rails.application.credentials.stub(:gemini_api_key, @api_key) do
        service = AiService.new
        result = service.analyze_photo(
          image_base64: "base64encodedimage",
          media_type: "image/png"
        )

        assert_kind_of Array, result
        assert_equal "carrot", result.first[:name]
      end
    end

    stub_connection.verify
  end

  test "analyze_photo handles JSON parse error" do
    mock_response_body = {
      "candidates" => [
        {
          "content" => {
            "parts" => [
              {
                "text" => "Not valid JSON at all"
              }
            ]
          }
        }
      ]
    }

    stub_response = Minitest::Mock.new
    stub_response.expect(:success?, true)
    stub_response.expect(:body, mock_response_body)

    stub_connection = Minitest::Mock.new
    stub_connection.expect(:post, stub_response)

    Faraday.stub(:new, ->(url:, &block) { stub_connection }) do
      Rails.application.credentials.stub(:gemini_api_key, @api_key) do
        service = AiService.new
        error = assert_raises(AiService::Error) do
          service.analyze_photo(
            image_base64: "base64encodedimage",
            media_type: "image/jpeg"
          )
        end
        assert_equal "Unable to analyze photo. Please try again with a clearer image.", error.message
      end
    end

    stub_connection.verify
  end

  test "call_api handles non-200 response" do
    stub_response = Minitest::Mock.new
    stub_response.expect(:success?, false)
    stub_response.expect(:body, { "error" => { "message" => "Internal server error" } })
    stub_response.expect(:status, 500)
    stub_response.expect(:status, 500)
    stub_response.expect(:status, 500)
    stub_response.expect(:status, 500)

    stub_connection = Minitest::Mock.new
    stub_connection.expect(:post, stub_response)

    Faraday.stub(:new, ->(url:, &block) { stub_connection }) do
      Rails.application.credentials.stub(:gemini_api_key, @api_key) do
        service = AiService.new
        error = assert_raises(AiService::Error) do
          service.generate_recipes(ingredients: "test", filters: {})
        end
        assert_equal "AI service is temporarily unavailable. Please try again.", error.message
      end
    end

    stub_connection.verify
  end

  test "call_api handles empty candidates array" do
    mock_response_body = {
      "candidates" => []
    }

    stub_response = Minitest::Mock.new
    stub_response.expect(:success?, true)
    stub_response.expect(:body, mock_response_body)

    stub_connection = Minitest::Mock.new
    stub_connection.expect(:post, stub_response)

    Faraday.stub(:new, ->(url:, &block) { stub_connection }) do
      Rails.application.credentials.stub(:gemini_api_key, @api_key) do
        service = AiService.new
        error = assert_raises(AiService::Error) do
          service.generate_recipes(ingredients: "test", filters: {})
        end
        assert_equal "Unable to generate a response. Please try again.", error.message
      end
    end

    stub_connection.verify
  end

  test "call_api handles Faraday network error" do
    stub_connection = Object.new
    def stub_connection.post
      raise Faraday::ConnectionFailed.new("Connection failed")
    end

    Faraday.stub(:new, ->(*args, **kwargs, &block) { stub_connection }) do
      Rails.application.credentials.stub(:gemini_api_key, @api_key) do
        service = AiService.new
        error = assert_raises(AiService::Error) do
          service.generate_recipes(ingredients: "test", filters: {})
        end
        assert_equal "Network error connecting to AI service. Please check your connection and try again.", error.message
      end
    end
  end
end
