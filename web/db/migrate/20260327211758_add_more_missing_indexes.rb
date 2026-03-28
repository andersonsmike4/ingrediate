class AddMoreMissingIndexes < ActiveRecord::Migration[8.1]
  def change
    add_index :pantry_items, :expires_at
    add_index :saved_recipes, :published_at
    add_index :user_achievements, :unlocked_at
  end
end
