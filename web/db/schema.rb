# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_27_211758) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "achievements", force: :cascade do |t|
    t.string "category", default: "general"
    t.datetime "created_at", null: false
    t.text "criteria_json"
    t.text "description"
    t.string "icon", null: false
    t.string "name", null: false
    t.integer "points", default: 10
    t.datetime "updated_at", null: false
  end

  create_table "challenge_submissions", force: :cascade do |t|
    t.datetime "completed_at"
    t.bigint "cooking_challenge_id", null: false
    t.datetime "created_at", null: false
    t.text "notes"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["cooking_challenge_id"], name: "index_challenge_submissions_on_cooking_challenge_id"
    t.index ["user_id", "cooking_challenge_id"], name: "idx_challenge_subs_user_challenge", unique: true
    t.index ["user_id"], name: "index_challenge_submissions_on_user_id"
  end

  create_table "collection_recipes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "recipe_collection_id", null: false
    t.bigint "saved_recipe_id", null: false
    t.datetime "updated_at", null: false
    t.index ["recipe_collection_id", "saved_recipe_id"], name: "index_collection_recipes_on_collection_and_recipe", unique: true
    t.index ["recipe_collection_id"], name: "index_collection_recipes_on_recipe_collection_id"
    t.index ["saved_recipe_id"], name: "index_collection_recipes_on_saved_recipe_id"
  end

  create_table "cooking_challenges", force: :cascade do |t|
    t.date "challenge_date", null: false
    t.text "challenge_text", null: false
    t.string "challenge_type", default: "general"
    t.datetime "created_at", null: false
    t.text "criteria_json"
    t.string "difficulty"
    t.text "tips_json"
    t.datetime "updated_at", null: false
    t.index ["challenge_date"], name: "index_cooking_challenges_on_challenge_date", unique: true
  end

  create_table "cooking_logs", force: :cascade do |t|
    t.datetime "cooked_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "created_at", null: false
    t.bigint "saved_recipe_id", null: false
    t.string "session_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["saved_recipe_id"], name: "index_cooking_logs_on_saved_recipe_id"
    t.index ["session_id"], name: "index_cooking_logs_on_session_id"
    t.index ["user_id", "cooked_at"], name: "index_cooking_logs_on_user_id_and_cooked_at"
    t.index ["user_id"], name: "index_cooking_logs_on_user_id"
  end

  create_table "grocery_purchases", force: :cascade do |t|
    t.integer "actual_price_cents"
    t.datetime "created_at", null: false
    t.string "item_name", null: false
    t.date "purchased_at"
    t.string "session_id"
    t.string "store_name"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["session_id"], name: "index_grocery_purchases_on_session_id"
    t.index ["user_id"], name: "index_grocery_purchases_on_user_id"
  end

  create_table "meal_plan_entries", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date"
    t.integer "day_of_week", null: false
    t.bigint "meal_plan_id", null: false
    t.string "meal_type", null: false
    t.string "note"
    t.bigint "saved_recipe_id"
    t.datetime "updated_at", null: false
    t.index ["meal_plan_id", "date", "meal_type"], name: "index_meal_plan_entries_on_meal_plan_id_and_date_and_meal_type", unique: true
    t.index ["meal_plan_id"], name: "index_meal_plan_entries_on_meal_plan_id"
    t.index ["saved_recipe_id"], name: "index_meal_plan_entries_on_saved_recipe_id"
  end

  create_table "meal_plans", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "end_date"
    t.string "name", default: "My Meal Plan", null: false
    t.string "session_id"
    t.date "start_date"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["session_id"], name: "index_meal_plans_on_session_id"
    t.index ["user_id"], name: "index_meal_plans_on_user_id"
  end

  create_table "nutrition_goals", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "daily_calories"
    t.integer "daily_carbs"
    t.integer "daily_fat"
    t.integer "daily_protein"
    t.string "session_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["session_id"], name: "index_nutrition_goals_on_session_id", unique: true
    t.index ["user_id"], name: "index_nutrition_goals_on_user_id"
  end

  create_table "pantry_items", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.date "expires_at"
    t.string "name", null: false
    t.string "quantity"
    t.string "session_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["expires_at"], name: "index_pantry_items_on_expires_at"
    t.index ["session_id", "name"], name: "index_pantry_items_on_session_id_and_name", unique: true
    t.index ["session_id"], name: "index_pantry_items_on_session_id"
    t.index ["user_id", "name"], name: "index_pantry_items_on_user_id_and_name_unique", unique: true, where: "(user_id IS NOT NULL)"
    t.index ["user_id"], name: "index_pantry_items_on_user_id"
  end

  create_table "push_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "platform", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "token"], name: "index_push_tokens_on_user_id_and_token", unique: true
    t.index ["user_id"], name: "index_push_tokens_on_user_id"
  end

  create_table "recipe_collections", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.string "session_id"
    t.string "share_token"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["session_id"], name: "index_recipe_collections_on_session_id"
    t.index ["share_token"], name: "index_recipe_collections_on_share_token", unique: true
    t.index ["user_id"], name: "index_recipe_collections_on_user_id"
  end

  create_table "recipe_likes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "saved_recipe_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["saved_recipe_id"], name: "index_recipe_likes_on_saved_recipe_id"
    t.index ["user_id", "saved_recipe_id"], name: "index_recipe_likes_on_user_id_and_saved_recipe_id", unique: true
    t.index ["user_id"], name: "index_recipe_likes_on_user_id"
  end

  create_table "saved_recipes", force: :cascade do |t|
    t.string "author_name"
    t.string "cook_time"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "difficulty"
    t.integer "estimated_cost_cents"
    t.text "ingredients_json"
    t.boolean "is_public", default: false
    t.integer "likes_count", default: 0
    t.string "name"
    t.text "notes"
    t.text "nutrition_json"
    t.datetime "published_at"
    t.integer "rating"
    t.integer "servings"
    t.string "session_id"
    t.string "share_token"
    t.text "steps_json"
    t.text "substitutions_json"
    t.text "tags_json"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["is_public"], name: "index_saved_recipes_on_is_public"
    t.index ["published_at"], name: "index_saved_recipes_on_published_at"
    t.index ["session_id"], name: "index_saved_recipes_on_session_id"
    t.index ["share_token"], name: "index_saved_recipes_on_share_token", unique: true
    t.index ["user_id", "is_public"], name: "index_saved_recipes_on_user_id_and_is_public"
    t.index ["user_id"], name: "index_saved_recipes_on_user_id"
  end

  create_table "shopping_list_items", force: :cascade do |t|
    t.string "amount"
    t.boolean "checked", default: false, null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "session_id"
    t.string "source"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["checked"], name: "index_shopping_list_items_on_checked"
    t.index ["session_id", "name"], name: "index_shopping_list_items_on_session_id_and_name", unique: true
    t.index ["session_id"], name: "index_shopping_list_items_on_session_id"
    t.index ["user_id", "name"], name: "index_shopping_list_items_on_user_id_and_name_unique", unique: true, where: "(user_id IS NOT NULL)"
    t.index ["user_id"], name: "index_shopping_list_items_on_user_id"
  end

  create_table "substitution_logs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "notes"
    t.string "original_ingredient", null: false
    t.integer "rating"
    t.string "recipe_name"
    t.string "substitute_ingredient", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "original_ingredient"], name: "idx_sub_logs_user_ingredient"
    t.index ["user_id"], name: "index_substitution_logs_on_user_id"
  end

  create_table "user_achievements", force: :cascade do |t|
    t.bigint "achievement_id", null: false
    t.datetime "created_at", null: false
    t.datetime "unlocked_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["achievement_id"], name: "index_user_achievements_on_achievement_id"
    t.index ["unlocked_at"], name: "index_user_achievements_on_unlocked_at"
    t.index ["user_id", "achievement_id"], name: "index_user_achievements_on_user_id_and_achievement_id", unique: true
    t.index ["user_id"], name: "index_user_achievements_on_user_id"
  end

  create_table "user_preferences", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "preferences_json", default: "{}"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_user_preferences_on_user_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "api_token"
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name"
    t.string "provider"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "uid"
    t.datetime "updated_at", null: false
    t.index ["api_token"], name: "index_users_on_api_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "challenge_submissions", "cooking_challenges"
  add_foreign_key "challenge_submissions", "users"
  add_foreign_key "collection_recipes", "recipe_collections"
  add_foreign_key "collection_recipes", "saved_recipes"
  add_foreign_key "cooking_logs", "saved_recipes"
  add_foreign_key "cooking_logs", "users"
  add_foreign_key "grocery_purchases", "users"
  add_foreign_key "meal_plan_entries", "meal_plans"
  add_foreign_key "meal_plan_entries", "saved_recipes"
  add_foreign_key "meal_plans", "users"
  add_foreign_key "nutrition_goals", "users"
  add_foreign_key "pantry_items", "users"
  add_foreign_key "push_tokens", "users"
  add_foreign_key "recipe_collections", "users"
  add_foreign_key "recipe_likes", "saved_recipes"
  add_foreign_key "recipe_likes", "users"
  add_foreign_key "saved_recipes", "users"
  add_foreign_key "shopping_list_items", "users"
  add_foreign_key "substitution_logs", "users"
  add_foreign_key "user_achievements", "achievements"
  add_foreign_key "user_achievements", "users"
  add_foreign_key "user_preferences", "users"
end
