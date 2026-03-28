class CreateCollectionRecipes < ActiveRecord::Migration[7.0]
  def change
    create_table :collection_recipes do |t|
      t.references :recipe_collection, null: false, foreign_key: true
      t.references :saved_recipe, null: false, foreign_key: true

      t.timestamps
    end

    add_index :collection_recipes, [:recipe_collection_id, :saved_recipe_id], unique: true, name: 'index_collection_recipes_on_collection_and_recipe'
  end
end
