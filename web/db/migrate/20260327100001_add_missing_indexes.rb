class AddMissingIndexes < ActiveRecord::Migration[7.2]
  def change
    add_index :cooking_logs, [:user_id, :cooked_at], name: "index_cooking_logs_on_user_id_and_cooked_at"
    add_index :saved_recipes, [:user_id, :is_public], name: "index_saved_recipes_on_user_id_and_is_public"
    add_index :shopping_list_items, :checked, name: "index_shopping_list_items_on_checked"
  end
end
