class AddExpiresAtToPantryItems < ActiveRecord::Migration[7.0]
  def change
    add_column :pantry_items, :expires_at, :date
  end
end
