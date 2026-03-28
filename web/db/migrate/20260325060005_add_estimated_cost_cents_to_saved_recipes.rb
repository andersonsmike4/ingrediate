class AddEstimatedCostCentsToSavedRecipes < ActiveRecord::Migration[7.0]
  def change
    add_column :saved_recipes, :estimated_cost_cents, :integer
  end
end
