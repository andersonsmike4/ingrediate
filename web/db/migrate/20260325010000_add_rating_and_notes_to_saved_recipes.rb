class AddRatingAndNotesToSavedRecipes < ActiveRecord::Migration[7.2]
  def change
    add_column :saved_recipes, :rating, :integer
    add_column :saved_recipes, :notes, :text
  end
end
