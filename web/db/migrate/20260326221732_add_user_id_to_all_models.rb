class AddUserIdToAllModels < ActiveRecord::Migration[8.1]
  def change
    # Add user_id to all models
    add_reference :saved_recipes, :user, foreign_key: true, index: true
    add_reference :meal_plans, :user, foreign_key: true, index: true
    add_reference :pantry_items, :user, foreign_key: true, index: true
    add_reference :shopping_list_items, :user, foreign_key: true, index: true
    add_reference :cooking_logs, :user, foreign_key: true, index: true
    add_reference :recipe_collections, :user, foreign_key: true, index: true
    add_reference :nutrition_goals, :user, foreign_key: true, index: true

    # Change session_id to nullable
    change_column_null :saved_recipes, :session_id, true
    change_column_null :cooking_logs, :session_id, true
    change_column_null :meal_plans, :session_id, true
    change_column_null :nutrition_goals, :session_id, true
    change_column_null :pantry_items, :session_id, true
    change_column_null :recipe_collections, :session_id, true
    change_column_null :shopping_list_items, :session_id, true

    # Add unique indexes for user-scoped uniqueness
    add_index :pantry_items, [:user_id, :name], unique: true, where: "user_id IS NOT NULL", name: "index_pantry_items_on_user_id_and_name_unique"
    add_index :shopping_list_items, [:user_id, :name], unique: true, where: "user_id IS NOT NULL", name: "index_shopping_list_items_on_user_id_and_name_unique"
  end
end
