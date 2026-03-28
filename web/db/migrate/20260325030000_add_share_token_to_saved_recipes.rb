class AddShareTokenToSavedRecipes < ActiveRecord::Migration[8.0]
  def change
    add_column :saved_recipes, :share_token, :string
    add_index :saved_recipes, :share_token, unique: true
  end
end
