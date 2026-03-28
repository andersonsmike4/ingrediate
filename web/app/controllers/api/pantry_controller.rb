class Api::PantryController < ApplicationController
  def index
    pantry_items = PantryItem.for_owner(owner_conditions)
                             .order(:category, :name)

    render json: { pantry_items: pantry_items }
  end

  def create
    pantry_item = PantryItem.new(pantry_item_params)
    assign_owner(pantry_item)

    if pantry_item.save
      render json: { pantry_item: pantry_item }, status: :created
    else
      render json: { error: pantry_item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def bulk_create
    unless params[:items].is_a?(Array)
      return render json: { error: "items parameter must be an array" }, status: :bad_request
    end

    created_items = []
    errors = []

    params[:items].each do |item_params|
      next unless item_params[:name].present?

      pantry_item = PantryItem.new(
        name: item_params[:name],
        category: item_params[:category],
        expires_at: item_params[:expires_at],
        quantity: item_params[:quantity]
      )
      assign_owner(pantry_item)

      if pantry_item.save
        created_items << pantry_item
      else
        # Skip duplicates silently (uniqueness validation)
        unless pantry_item.errors.of_kind?(:name, :taken)
          errors << { name: item_params[:name], errors: pantry_item.errors.full_messages }
        end
      end
    end

    render json: {
      pantry_items: created_items,
      errors: errors
    }, status: :created
  end

  def destroy
    pantry_item = PantryItem.find_by(owner_conditions.merge(id: params[:id]))

    unless pantry_item
      return render json: { error: "Pantry item not found" }, status: :not_found
    end

    pantry_item.destroy
    head :no_content
  end

  def clear
    PantryItem.for_owner(owner_conditions).destroy_all
    head :no_content
  end

  def voice_add
    text = params[:text].to_s.strip
    return render json: { error: "No text provided" }, status: :bad_request if text.blank?

    parsed_items = ai_service.parse_pantry_voice_input(text: text)
    created_items = create_pantry_items_from_parsed(parsed_items)

    render json: {
      pantry_items: created_items,
      parsed_count: parsed_items.size,
      added_count: created_items.size
    }, status: :created
  rescue AiService::Error => e
    Rails.logger.error("Voice add AiService error: #{e.message}")
    render json: { error: e.message }, status: :unprocessable_entity
  rescue => e
    Rails.logger.error("Voice add unexpected error: #{e.class} - #{e.message}")
    render json: { error: "Unexpected error processing voice input" }, status: :internal_server_error
  end

  def scan_receipt
    unless params[:photo].present?
      return render json: { error: "Receipt photo is required" }, status: :bad_request
    end

    photo = params[:photo]

    allowed_types = %w[image/jpeg image/png image/webp].freeze
    unless allowed_types.include?(photo.content_type)
      return render json: { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." }, status: :unprocessable_entity
    end

    if photo.size > 10.megabytes
      return render json: { error: "File too large. Maximum size is 10MB." }, status: :unprocessable_entity
    end

    image_data = photo.read
    image_base64 = Base64.strict_encode64(image_data)
    media_type = photo.content_type

    parsed_items = ai_service.parse_receipt(image_base64: image_base64, media_type: media_type)

    created_items = create_pantry_items_from_parsed(parsed_items)
    purchases = []

    # Log purchases for items with price data
    parsed_items.each do |item_data|
      next unless item_data[:name].present?

      if item_data[:price_cents].present? && item_data[:price_cents] > 0
        purchase = GroceryPurchase.new(
          item_name: item_data[:name],
          actual_price_cents: item_data[:price_cents],
          purchased_at: Date.current,
          store_name: item_data[:store_name]
        )
        assign_owner(purchase)
        purchases << purchase if purchase.save
      end
    end

    render json: {
      pantry_items: created_items,
      purchases: purchases,
      parsed_count: parsed_items.size,
      added_count: created_items.size
    }, status: :created
  rescue AiService::Error => e
    Rails.logger.error("Receipt scan AiService error: #{e.message}")
    render json: { error: e.message }, status: :unprocessable_entity
  rescue => e
    Rails.logger.error("Receipt scan unexpected error: #{e.class} - #{e.message}")
    render json: { error: "Unexpected error processing receipt" }, status: :internal_server_error
  end

  private

  def pantry_item_params
    params.permit(:name, :category, :expires_at, :quantity)
  end

  def create_pantry_items_from_parsed(parsed_items)
    created_items = []
    parsed_items.each do |item_data|
      next unless item_data[:name].present?

      pantry_item = PantryItem.new(
        name: item_data[:name],
        category: item_data[:category] || "other",
        quantity: item_data[:quantity]
      )
      assign_owner(pantry_item)

      if pantry_item.save
        created_items << pantry_item
      else
        Rails.logger.info("Pantry item save failed: #{item_data[:name]} - #{pantry_item.errors.full_messages}")
      end
    end
    created_items
  end
end
