class CreatePantryItems < ActiveRecord::Migration[7.2]
  def change
    create_table :pantry_items do |t|
      t.string :session_id, null: false
      t.string :name, null: false
      t.string :category

      t.timestamps
    end

    add_index :pantry_items, :session_id
    add_index :pantry_items, [:session_id, :name], unique: true
  end
end
