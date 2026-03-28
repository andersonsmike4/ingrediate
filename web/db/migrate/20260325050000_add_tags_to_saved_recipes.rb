class AddTagsToSavedRecipes < ActiveRecord::Migration[7.0]
  def change
    add_column :saved_recipes, :tags_json, :text
  end
end
