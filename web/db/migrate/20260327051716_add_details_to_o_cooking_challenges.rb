class AddDetailsToOCookingChallenges < ActiveRecord::Migration[8.1]
  def change
    add_column :cooking_challenges, :difficulty, :string
    add_column :cooking_challenges, :tips_json, :text
  end
end
