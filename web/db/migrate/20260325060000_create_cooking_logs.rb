class CreateCookingLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :cooking_logs do |t|
      t.references :saved_recipe, null: false, foreign_key: true
      t.string :session_id, null: false
      t.datetime :cooked_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }

      t.timestamps
    end

    add_index :cooking_logs, :session_id
  end
end
