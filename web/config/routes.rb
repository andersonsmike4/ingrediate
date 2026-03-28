Rails.application.routes.draw do
  devise_for :users, path: "api/auth",
    path_names: { sign_up: "sign_up", sign_in: "sign_in", sign_out: "sign_out" },
    controllers: {
      sessions: "api/sessions",
      registrations: "api/registrations",
      omniauth_callbacks: "api/omniauth_callbacks"
    },
    defaults: { format: :json }

  # Explicit registration POST so /api/auth/sign_up works for both GET and POST
  devise_scope :user do
    post "api/auth/sign_up", to: "api/registrations#create", defaults: { format: :json }
  end

  root "home#index"
  get "home/index"

  # API routes
  namespace :api do
    get "auth/status", to: "auth#status"

    # Token-based authentication for mobile apps
    post "auth/token/sign_in", to: "token_auth#sign_in"
    post "auth/token/sign_up", to: "token_auth#sign_up"
    delete "auth/token/sign_out", to: "token_auth#sign_out"

    # Push notification tokens
    post "push_tokens", to: "push_tokens#create"
    delete "push_tokens", to: "push_tokens#destroy"

    post "ingredients/analyze_photo", to: "ingredients#analyze_photo"
    post "recipes/generate", to: "recipes#generate"
    get "recipes/saved", to: "recipes#saved_index"
    post "recipes/saved", to: "recipes#saved_create"
    patch "recipes/saved/:id", to: "recipes#saved_update"
    delete "recipes/saved/:id", to: "recipes#saved_destroy"
    post "recipes/saved/:id/share", to: "recipes#saved_share"
    get "recipes/shared/:token", to: "recipes#shared_show"

    # Recipe import and AI features
    post "recipes/import_url", to: "recipes#import_from_url"
    post "recipes/saved/:id/substitutions", to: "recipes#suggest_substitutions"
    post "recipes/saved/:id/estimate_cost", to: "recipes#estimate_cost"
    post "recipes/saved/:id/variation", to: "recipes#create_variation"
    post "recipes/saved/:id/publish", to: "recipes#publish"
    post "recipes/saved/:id/unpublish", to: "recipes#unpublish"

    # Smart suggestions
    post "suggestions/smart", to: "suggestions#smart_suggest"

    # Cooking logs
    get "cooking_logs", to: "cooking_logs#index"
    post "cooking_logs/preview", to: "cooking_logs#pantry_preview"
    post "cooking_logs", to: "cooking_logs#create"

    # Collections
    get "collections", to: "collections#index"
    post "collections", to: "collections#create"
    get "collections/:id", to: "collections#show"
    delete "collections/:id", to: "collections#destroy"
    post "collections/:id/recipes", to: "collections#add_recipe"
    delete "collections/:id/recipes/:recipe_id", to: "collections#remove_recipe"
    post "collections/:id/share", to: "collections#share"
    get "collections/shared/:token", to: "collections#shared_show"

    # Nutrition goals
    get "nutrition_goals", to: "nutrition_goals#show"
    patch "nutrition_goals", to: "nutrition_goals#update"

    # Meal plans
    get "meal_plans", to: "meal_plans#index"
    post "meal_plans", to: "meal_plans#create"
    post "meal_plans/auto_generate", to: "meal_plans#auto_generate"
    get "meal_plans/:id", to: "meal_plans#show"
    delete "meal_plans/:id", to: "meal_plans#destroy"
    post "meal_plans/:id/entries", to: "meal_plans#add_entry"
    delete "meal_plans/:id/entries/:entry_id", to: "meal_plans#remove_entry"
    get "meal_plans/:id/shopping_list", to: "meal_plans#shopping_list"

    # Pantry
    get "pantry", to: "pantry#index"
    post "pantry", to: "pantry#create"
    post "pantry/bulk", to: "pantry#bulk_create"
    post "pantry/voice", to: "pantry#voice_add"
    post "pantry/scan_receipt", to: "pantry#scan_receipt"
    delete "pantry/:id", to: "pantry#destroy"
    delete "pantry", to: "pantry#clear"

    # Shopping list
    get "shopping_list", to: "shopping_list#index"
    post "shopping_list", to: "shopping_list#create"
    patch "shopping_list/:id/toggle", to: "shopping_list#toggle"
    delete "shopping_list/:id", to: "shopping_list#destroy"
    delete "shopping_list_clear_checked", to: "shopping_list#clear_checked"
    post "shopping_list/populate/:plan_id", to: "shopping_list#populate_from_plan"
    post "shopping_list/add_to_pantry", to: "shopping_list#add_checked_to_pantry"

    # NEW FEATURE ROUTES
    # Preferences
    get "preferences", to: "preferences#show"
    patch "preferences", to: "preferences#update"

    # Community Feed
    get "feed", to: "feed#index"
    post "feed/:id/like", to: "feed#like"
    delete "feed/:id/like", to: "feed#unlike"

    # Achievements
    get "achievements", to: "achievements#index"

    # Meal Prep
    post "meal_prep/generate", to: "meal_prep#generate"

    # Recipe Compare
    post "recipes/compare", to: "compare#compare"

    # Recipe search by meal name
    post "recipes/search", to: "recipe_search#search"

    # Budget
    get "budget/summary", to: "budget#summary"
    post "budget/purchases", to: "budget#log_purchase"

    # Substitution Memory
    get "substitution_logs", to: "substitution_logs#index"
    post "substitution_logs", to: "substitution_logs#create"
    get "substitution_logs/lookup", to: "substitution_logs#lookup"

    # Nutrition Reports
    get "nutrition_reports/weekly", to: "nutrition_reports#weekly"

    # Challenges
    get "challenges/today", to: "challenges#today"
    post "challenges/:id/submit", to: "challenges#submit"
    get "challenges/history", to: "challenges#history"

    # Kitchen Timeline
    post "timelines/generate", to: "timelines#generate"
  end

  # Public shared recipe page
  get "shared/:token", to: "home#index"
  get "shared/collection/:token", to: "home#index"

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
end
