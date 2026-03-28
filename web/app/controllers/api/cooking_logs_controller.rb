class Api::CookingLogsController < ApplicationController
  def create
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:saved_recipe_id]))
    return head :not_found unless recipe

    log = CookingLog.new(saved_recipe_id: recipe.id, cooked_at: Time.current)
    assign_owner(log)
    if log.save
      # Deduct matching pantry items
      deducted_items = deduct_pantry_items_for_recipe(recipe)
      render json: { cooking_log: log, deducted_pantry_items: deducted_items }, status: :created
    else
      render json: { error: log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def index
    logs = CookingLog.for_owner(owner_conditions)
                     .includes(:saved_recipe)
                     .order(cooked_at: :desc)
                     .limit(Pagination::MAX_LIMIT)
    render json: { cooking_logs: logs.as_json(include: :saved_recipe) }
  end

  def pantry_preview
    recipe = SavedRecipe.find_by(owner_conditions.merge(id: params[:saved_recipe_id]))
    return head :not_found unless recipe

    result = preview_pantry_deduction_for_recipe(recipe)
    render json: result
  end

  private

  def deduct_pantry_items_for_recipe(recipe)
    return [] if recipe.ingredients_json.blank?

    ingredients = parse_ingredients(recipe.ingredients_json)
    deducted = []

    # Batch-load all pantry items for this owner
    pantry_items = PantryItem.for_owner(owner_conditions).pluck(:id, :name)
    pantry_lookup = pantry_items.each_with_object({}) { |(id, name), h| h[name.downcase] = id }
    ids_to_delete = []

    ingredients.each do |ingredient_name|
      pantry_item_id = pantry_lookup[ingredient_name.downcase]
      if pantry_item_id
        ids_to_delete << pantry_item_id
        deducted << ingredient_name
      end
    end

    PantryItem.where(id: ids_to_delete).destroy_all if ids_to_delete.any?

    deducted
  end

  def preview_pantry_deduction_for_recipe(recipe)
    return { in_pantry: [], missing: [] } if recipe.ingredients_json.blank?

    ingredients = parse_ingredients(recipe.ingredients_json)
    in_pantry = []
    missing = []

    # Batch-load all pantry items for this owner
    pantry_items = PantryItem.for_owner(owner_conditions).pluck(:id, :name)
    pantry_lookup = pantry_items.each_with_object({}) { |(id, name), h| h[name.downcase] = id }

    ingredients.each do |ingredient_name|
      if pantry_lookup[ingredient_name.downcase]
        in_pantry << ingredient_name
      else
        missing << ingredient_name
      end
    end

    { in_pantry: in_pantry, missing: missing }
  end

  def parse_ingredients(ingredients_json)
    return [] if ingredients_json.blank?

    parsed = safe_parse_json(ingredients_json)
    # Handle both array of strings and array of hashes with 'name' key
    if parsed.is_a?(Array)
      parsed.map do |ingredient|
        if ingredient.is_a?(String)
          ingredient.strip
        elsif ingredient.is_a?(Hash) && ingredient["name"]
          ingredient["name"].strip
        elsif ingredient.is_a?(Hash) && ingredient[:name]
          ingredient[:name].strip
        else
          nil
        end
      end.compact
    else
      []
    end
  end
end
