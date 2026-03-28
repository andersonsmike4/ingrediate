class Api::IngredientsController < ApplicationController
  ALLOWED_CONTENT_TYPES = [ "image/jpeg", "image/png", "image/webp" ].freeze
  MAX_FILE_SIZE = 10.megabytes

  def analyze_photo
    unless params[:photo].present?
      return render json: { error: "Photo is required" }, status: :bad_request
    end

    photo = params[:photo]

    unless ALLOWED_CONTENT_TYPES.include?(photo.content_type)
      return render json: {
        error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      }, status: :unprocessable_entity
    end

    if photo.size > MAX_FILE_SIZE
      return render json: {
        error: "File too large. Maximum size is 10MB."
      }, status: :unprocessable_entity
    end

    image_data = photo.read
    image_base64 = Base64.strict_encode64(image_data)
    media_type = photo.content_type

    ingredients = ai_service.analyze_photo(
      image_base64: image_base64,
      media_type: media_type
    )

    render json: { ingredients: ingredients }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
