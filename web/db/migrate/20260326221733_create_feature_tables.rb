class CreateFeatureTables < ActiveRecord::Migration[8.1]
  def change
    # Feature 1: User Preferences
    create_table :user_preferences do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.text :preferences_json, default: "{}"
      t.timestamps
    end

    # Feature 2: Recipe Likes (for community feed)
    create_table :recipe_likes do |t|
      t.references :user, null: false, foreign_key: true
      t.references :saved_recipe, null: false, foreign_key: true
      t.timestamps
    end
    add_index :recipe_likes, [:user_id, :saved_recipe_id], unique: true

    # Add publishing fields to saved_recipes
    add_column :saved_recipes, :is_public, :boolean, default: false
    add_column :saved_recipes, :published_at, :datetime
    add_column :saved_recipes, :likes_count, :integer, default: 0
    add_column :saved_recipes, :author_name, :string
    add_index :saved_recipes, :is_public

    # Feature 3: Achievements
    create_table :achievements do |t|
      t.string :name, null: false
      t.text :description
      t.string :icon, null: false
      t.string :category, default: "general"
      t.integer :points, default: 10
      t.text :criteria_json
      t.timestamps
    end

    create_table :user_achievements do |t|
      t.references :user, null: false, foreign_key: true
      t.references :achievement, null: false, foreign_key: true
      t.datetime :unlocked_at, null: false
      t.timestamps
    end
    add_index :user_achievements, [:user_id, :achievement_id], unique: true

    # Feature 6: Grocery Purchases
    create_table :grocery_purchases do |t|
      t.references :user, foreign_key: true, index: true
      t.string :session_id, index: true
      t.string :item_name, null: false
      t.integer :actual_price_cents
      t.date :purchased_at
      t.string :store_name
      t.timestamps
    end

    # Feature 7: Substitution Logs
    create_table :substitution_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.string :original_ingredient, null: false
      t.string :substitute_ingredient, null: false
      t.string :recipe_name
      t.integer :rating
      t.text :notes
      t.timestamps
    end
    add_index :substitution_logs, [:user_id, :original_ingredient], name: "idx_sub_logs_user_ingredient"

    # Feature 9: Cooking Challenges
    create_table :cooking_challenges do |t|
      t.text :challenge_text, null: false
      t.string :challenge_type, default: "general"
      t.text :criteria_json
      t.date :challenge_date, null: false
      t.timestamps
    end
    add_index :cooking_challenges, :challenge_date, unique: true

    create_table :challenge_submissions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :cooking_challenge, null: false, foreign_key: true
      t.text :notes
      t.datetime :completed_at
      t.timestamps
    end
    add_index :challenge_submissions, [:user_id, :cooking_challenge_id], unique: true, name: "idx_challenge_subs_user_challenge"
  end
end
