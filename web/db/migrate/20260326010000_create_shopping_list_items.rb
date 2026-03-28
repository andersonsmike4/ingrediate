class CreateShoppingListItems < ActiveRecord::Migration[8.1]
  def change
    create_table :shopping_list_items do |t|
      t.string :name, null: false
      t.string :amount
      t.boolean :checked, default: false, null: false
      t.string :session_id, null: false
      t.string :source

      t.timestamps
    end

    add_index :shopping_list_items, :session_id
    add_index :shopping_list_items, [:session_id, :name], unique: true
  end
end
