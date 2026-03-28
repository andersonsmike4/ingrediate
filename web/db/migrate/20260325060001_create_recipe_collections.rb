class CreateRecipeCollections < ActiveRecord::Migration[7.0]
  def change
    create_table :recipe_collections do |t|
      t.string :session_id, null: false
      t.string :name, null: false
      t.text :description
      t.string :share_token

      t.timestamps
    end

    add_index :recipe_collections, :session_id
    add_index :recipe_collections, :share_token, unique: true
  end
end
