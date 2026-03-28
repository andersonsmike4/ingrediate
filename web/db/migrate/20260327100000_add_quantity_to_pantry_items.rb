class AddQuantityToPantryItems < ActiveRecord::Migration[8.1]
  def change
    add_column :pantry_items, :quantity, :string
  end
end
