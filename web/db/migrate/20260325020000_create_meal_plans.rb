class CreateMealPlans < ActiveRecord::Migration[7.2]
  def change
    create_table :meal_plans do |t|
      t.string :session_id, null: false
      t.string :name, null: false, default: "My Meal Plan"

      t.timestamps
    end

    add_index :meal_plans, :session_id
  end
end
