class CreateSavedRecipes < ActiveRecord::Migration[8.1]
  def change
    create_table :saved_recipes do |t|
      t.string :name
      t.text :description
      t.string :cook_time
      t.string :difficulty
      t.integer :servings
      t.text :ingredients_json
      t.text :steps_json
      t.text :nutrition_json
      t.text :substitutions_json
      t.string :session_id

      t.timestamps
    end

    add_index :saved_recipes, :session_id
  end
end
