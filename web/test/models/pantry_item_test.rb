require "test_helper"

class PantryItemTest < ActiveSupport::TestCase
  def setup
    @session_id = "test_session_123"
  end

  test "should create valid pantry item" do
    pantry_item = PantryItem.new(name: "Tomatoes", category: "produce", session_id: @session_id)
    assert pantry_item.save
  end

  test "should require name" do
    pantry_item = PantryItem.new(session_id: @session_id)
    assert_not pantry_item.save
    assert_includes pantry_item.errors[:name], "can't be blank"
  end

  test "should require owner (session_id or user_id)" do
    pantry_item = PantryItem.new(name: "Tomatoes")
    assert_not pantry_item.save
    assert_includes pantry_item.errors[:base], "Must belong to a user or session"
  end

  test "should normalize name before save" do
    pantry_item = PantryItem.create!(name: "  TOMATOES  ", session_id: @session_id)
    assert_equal "tomatoes", pantry_item.name
  end

  test "should prevent duplicate names for same session (case insensitive)" do
    PantryItem.create!(name: "Tomatoes", session_id: @session_id)
    duplicate = PantryItem.new(name: "TOMATOES", session_id: @session_id)
    assert_not duplicate.save
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "should allow same name for different sessions" do
    PantryItem.create!(name: "Tomatoes", session_id: @session_id)
    different_session_item = PantryItem.new(name: "Tomatoes", session_id: "different_session")
    assert different_session_item.save
  end

  test "should validate category inclusion" do
    pantry_item = PantryItem.new(name: "Tomatoes", category: "invalid", session_id: @session_id)
    assert_not pantry_item.save
    assert_includes pantry_item.errors[:category], "is not included in the list"
  end

  test "should allow nil category" do
    pantry_item = PantryItem.new(name: "Tomatoes", category: nil, session_id: @session_id)
    assert pantry_item.save
  end

  test "should allow valid categories" do
    PantryItem::CATEGORIES.each do |category|
      pantry_item = PantryItem.new(name: "Test #{category}", category: category, session_id: @session_id)
      assert pantry_item.save, "Failed to save with category: #{category}"
    end
  end
end
