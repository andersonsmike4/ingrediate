require "test_helper"

class SavedRecipeTest < ActiveSupport::TestCase
  test "should save with valid attributes" do
    recipe = SavedRecipe.new(
      name: "Spaghetti Carbonara",
      session_id: "test_session_123",
      description: "Classic Italian pasta dish",
      cook_time: "30 minutes",
      difficulty: "medium",
      servings: 4
    )

    assert recipe.save, "Failed to save recipe with valid attributes"
    assert_not_nil recipe.id
  end

  test "should not save without name" do
    recipe = SavedRecipe.new(
      session_id: "test_session_123",
      description: "Some description"
    )

    assert_not recipe.save, "Saved recipe without a name"
    assert_includes recipe.errors[:name], "can't be blank"
  end

  test "should not save without owner (session_id or user_id)" do
    recipe = SavedRecipe.new(
      name: "Some Recipe",
      description: "Some description"
    )

    assert_not recipe.save, "Saved recipe without an owner"
    assert_includes recipe.errors[:base], "Must belong to a user or session"
  end

  test "should save with only required attributes" do
    recipe = SavedRecipe.new(
      name: "Minimal Recipe",
      session_id: "test_session_456"
    )

    assert recipe.save, "Failed to save recipe with minimal valid attributes"
  end

  test "should save with json fields" do
    recipe = SavedRecipe.new(
      name: "Recipe with JSON",
      session_id: "test_session_789",
      ingredients_json: '["flour", "eggs"]',
      steps_json: '["Mix", "Bake"]',
      nutrition_json: '{"calories": 500}',
      substitutions_json: '[]'
    )

    assert recipe.save, "Failed to save recipe with JSON fields"
  end
end
