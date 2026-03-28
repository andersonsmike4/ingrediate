class UpdateMealPlansForDateBasedPlanning < ActiveRecord::Migration[8.1]
  def change
    add_column :meal_plans, :start_date, :date
    add_column :meal_plans, :end_date, :date

    add_column :meal_plan_entries, :date, :date
    add_column :meal_plan_entries, :note, :string

    change_column_null :meal_plan_entries, :saved_recipe_id, true

    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE meal_plan_entries
          SET date = CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer + 1 + day_of_week
          WHERE date IS NULL
        SQL

        execute <<-SQL
          UPDATE meal_plans
          SET start_date = CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer + 1,
              end_date = CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer + 7
          WHERE start_date IS NULL
        SQL
      end
    end

    remove_index :meal_plan_entries, [:meal_plan_id, :day_of_week, :meal_type], if_exists: true
    add_index :meal_plan_entries, [:meal_plan_id, :date, :meal_type], unique: true
  end
end
