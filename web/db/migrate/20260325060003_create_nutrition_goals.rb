class CreateNutritionGoals < ActiveRecord::Migration[7.0]
  def change
    create_table :nutrition_goals do |t|
      t.string :session_id, null: false
      t.integer :daily_calories
      t.integer :daily_protein
      t.integer :daily_carbs
      t.integer :daily_fat

      t.timestamps
    end

    add_index :nutrition_goals, :session_id, unique: true
  end
end
