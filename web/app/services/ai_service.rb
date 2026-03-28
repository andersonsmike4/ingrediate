class AiService
  class Error < StandardError; end

  GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

  def initialize
    @api_key = Rails.application.credentials.gemini_api_key || ENV["GEMINI_API_KEY"]
    raise Error, "Gemini API key not configured" unless @api_key.present?
  end

  def generate_recipes(ingredients:, filters: {}, household: nil, preferences: nil)
    prompt = build_recipe_prompt(ingredients, filters, household: household, preferences: preferences)
    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)

    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError => e
    Rails.logger.error("Failed to parse Gemini response: #{e.message}")
    raise Error, "Unable to generate recipes. Please try again."
  end

  def analyze_photo(image_base64:, media_type:)
    prompt = <<~PROMPT
      Analyze this photo and identify all food ingredients visible in the image.
      Return ONLY a valid JSON array of objects, with no markdown formatting.

      Each object should have:
      - "name": the ingredient name (lowercase, singular)
      - "amount": estimated quantity with unit (e.g., "~2 lbs", "~3 cups", "~5 pieces")

      Example format:
      [
        {"name": "chicken breast", "amount": "~2 lbs"},
        {"name": "tomato", "amount": "~4 pieces"},
        {"name": "onion", "amount": "~1 medium"}
      ]

      If no ingredients are clearly visible, return an empty array: []
    PROMPT

    response_text = call_api(build_request(prompt: prompt, image_base64: image_base64, media_type: media_type))
    json_text = strip_markdown_fences(response_text)

    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError => e
    Rails.logger.error("Failed to parse Gemini photo analysis: #{e.message}")
    raise Error, "Unable to analyze photo. Please try again with a clearer image."
  end

  def import_recipe_from_url(url:)
    url_clean = sanitize_input(url, max_length: 2000)
    prompt = <<~PROMPT
      I'll give you a recipe URL. Please extract the recipe information and return it as a JSON object.
      URL: #{url_clean}

      Return ONLY valid JSON (no markdown) with this exact structure:
      {
        "name": "Recipe Name",
        "description": "Brief description",
        "cook_time": "30 minutes",
        "difficulty": "easy|medium|hard",
        "servings": 4,
        "ingredients": [{"name": "ingredient", "amount": "1 cup", "have": false}],
        "steps": ["Step 1", "Step 2"],
        "nutrition": {"calories": 400, "protein": "25g", "carbs": "30g", "fat": "15g"}
      }

      If you cannot access or parse the URL, make your best guess based on the URL text.
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to parse recipe from URL. Please try a different URL."
  end

  def suggest_substitutions(recipe_name:, ingredients:, missing_ingredient:)
    ingredient_list = ingredients.map { |i| sanitize_input(i["name"] || i[:name], max_length: 100) }.join(", ")
    recipe_name_clean = sanitize_input(recipe_name)
    missing_clean = sanitize_input(missing_ingredient, max_length: 100)

    prompt = <<~PROMPT
      For the recipe "#{recipe_name_clean}" with ingredients: #{ingredient_list}

      Suggest 3 substitutions for "#{missing_clean}" that would work well in this specific recipe context.

      Return ONLY valid JSON array (no markdown):
      [
        {"substitute": "ingredient name", "notes": "brief explanation of how to use it", "ratio": "use same amount"}
      ]
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to generate substitutions. Please try again."
  end

  def estimate_recipe_cost(recipe_name:, ingredients:, household: nil, preferences: nil)
    ingredient_list = ingredients.map { |i|
      name = sanitize_input(i["name"] || i[:name], max_length: 100)
      amount = sanitize_input(i["amount"] || i[:amount], max_length: 50)
      "#{amount} #{name}"
    }.join(", ")
    recipe_name_clean = sanitize_input(recipe_name)
    hh = household_text(household)
    servings = household.present? ? household.size : 4

    prompt = <<~PROMPT
      Estimate the cost of these ingredients for "#{recipe_name_clean}" based on average US grocery prices in 2024:
      #{ingredient_list}
      #{hh ? "\n      #{hh}\n      Scale ingredient quantities to feed #{servings} people." : ""}

      Return ONLY valid JSON (no markdown):
      {
        "total_cents": 1250,
        "per_serving_cents": 312,
        "breakdown": [{"ingredient": "name", "estimated_cents": 300}],
        "price_level": "budget|moderate|expensive"
      }
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to estimate cost. Please try again."
  end

  def suggest_what_to_cook(pantry_items:, saved_recipes:, recent_cooks:, nutrition_goals:, expiring_soon:, household: nil, preferences: nil)
    pantry_list = pantry_items.map { |i| sanitize_input(i, max_length: 100) }.join(", ")
    saved_names = saved_recipes.map { |r| sanitize_input(r[:name], max_length: 100) }.join(", ")
    recent_names = recent_cooks.map { |r| sanitize_input(r, max_length: 100) }.join(", ")
    expiring_list = expiring_soon.map { |i| sanitize_input(i, max_length: 100) }.join(", ")
    hh = household_text(household)
    pp = preferences_text(preferences)

    goals_text = if nutrition_goals.present?
      "Daily goals: #{nutrition_goals[:daily_calories].to_i} cal, #{nutrition_goals[:daily_protein].to_i}g protein, #{nutrition_goals[:daily_carbs].to_i}g carbs, #{nutrition_goals[:daily_fat].to_i}g fat"
    else
      "No specific nutrition goals"
    end

    themes = [
      "comfort food", "quick weeknight meals", "one-pot dishes", "high-protein meals",
      "world cuisine fusion", "family favorites", "healthy bowls", "sheet pan dinners",
      "stir fry variations", "pasta dishes", "soup and stew ideas", "breakfast for dinner",
      "grilled meals", "slow cooker recipes", "30-minute meals", "budget-friendly meals",
      "meal prep friendly", "low-carb options", "vegetable-forward dishes", "hearty salads"
    ]
    theme = themes.sample

    prompt = <<~PROMPT
      You are a creative meal planning assistant. Suggest 3 UNIQUE recipes the user should cook today.
      Theme inspiration for this batch: "#{theme}" (use as loose inspiration, not a strict constraint).
      Request ID: #{SecureRandom.hex(8)}

      #{hh}
      #{pp}
      Pantry items available: #{pantry_list.presence || "none specified"}
      Saved recipes: #{saved_names.presence || "none"}
      Recently cooked (avoid repeats): #{recent_names.presence || "none"}
      Items expiring soon (prioritize these): #{expiring_list.presence || "none"}
      #{goals_text}

      Return ONLY valid JSON (no markdown) with this structure:
      [
        {
          "name": "Recipe Name",
          "description": "Why this is a good choice today",
          "reasoning": "Uses expiring tomatoes, matches your protein goals, haven't made it recently",
          "cook_time": "30 minutes",
          "difficulty": "easy|medium|hard",
          "servings": #{household.present? ? household.size : 4},
          "ingredients": [{"name": "ingredient", "amount": "1 cup", "have": true}],
          "steps": ["Step 1", "Step 2"],
          "nutrition": {"calories": 400, "protein": "25g", "carbs": "30g", "fat": "15g"}
        }
      ]

      CRITICAL: Prioritize using expiring ingredients. Prefer saved recipes the user hasn't cooked recently. Match nutrition goals if provided. Be creative and suggest DIFFERENT recipes than you normally would — surprise the user with variety.
    PROMPT

    response_text = call_api(build_request(prompt: prompt, temperature: 1.0))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to generate suggestions. Please try again."
  end

  def generate_variation(recipe_name:, ingredients:, steps:, nutrition:, modifier:)
    ingredient_list = ingredients.map { |i|
      amount = sanitize_input(i['amount'] || i[:amount], max_length: 50)
      name = sanitize_input(i['name'] || i[:name], max_length: 100)
      "#{amount} #{name}"
    }.join(", ")
    steps_text = steps.map.with_index(1) { |s, i| "#{i}. #{sanitize_input(s, max_length: 500)}" }.join("\n")
    nutrition_text = nutrition ? "Calories: #{nutrition['calories'] || nutrition[:calories]}, Protein: #{nutrition['protein'] || nutrition[:protein]}, Carbs: #{nutrition['carbs'] || nutrition[:carbs]}, Fat: #{nutrition['fat'] || nutrition[:fat]}" : "unknown"
    recipe_name_clean = sanitize_input(recipe_name)
    modifier_clean = sanitize_input(modifier)

    prompt = <<~PROMPT
      Modify this recipe based on the request: "#{modifier_clean}"

      Original recipe: #{recipe_name_clean}
      Ingredients: #{ingredient_list}
      Steps:
      #{steps_text}
      Nutrition: #{nutrition_text}

      Return ONLY valid JSON (no markdown) with the modified recipe:
      {
        "name": "Modified Recipe Name (e.g. 'Low-Carb #{recipe_name_clean}')",
        "description": "Brief description of changes made",
        "cook_time": "30 minutes",
        "difficulty": "easy|medium|hard",
        "servings": 4,
        "ingredients": [{"name": "ingredient", "amount": "1 cup", "have": false}],
        "steps": ["Step 1", "Step 2"],
        "nutrition": {"calories": 400, "protein": "25g", "carbs": "30g", "fat": "15g"},
        "changes_summary": "Brief list of what changed from the original"
      }
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to generate variation. Please try again."
  end

  def auto_generate_meal_plan(saved_recipes:, pantry_items:, recent_cooks:, nutrition_goals:, household: nil, preferences: nil, num_days: 7)
    recipes_json = saved_recipes.map { |r|
      { name: sanitize_input(r[:name], max_length: 100), id: r[:id], difficulty: sanitize_input(r[:difficulty], max_length: 50), cook_time: sanitize_input(r[:cook_time], max_length: 50) }
    }.to_json
    hh = household_text(household)
    pp = preferences_text(preferences)

    goals_text = if nutrition_goals.present?
      "Daily goals: #{nutrition_goals[:daily_calories].to_i} cal, #{nutrition_goals[:daily_protein].to_i}g protein"
    else
      "No specific nutrition goals"
    end

    prompt = <<~PROMPT
      Generate a #{num_days}-day meal plan (breakfast/lunch/dinner) using ONLY the saved recipes below.
      #{hh}
      #{pp}

      Available recipes (use these IDs):
      #{recipes_json}

      Pantry items: #{pantry_items.map { |i| sanitize_input(i, max_length: 100) }.join(", ").presence || "not specified"}
      Recently cooked (try to avoid back-to-back): #{recent_cooks.map { |r| sanitize_input(r, max_length: 100) }.join(", ").presence || "none"}
      #{goals_text}

      Return ONLY valid JSON (no markdown):
      {
        "entries": [
          {"day_of_week": 0, "meal_type": "breakfast", "recipe_id": 123},
          {"day_of_week": 0, "meal_type": "lunch", "recipe_id": 456}
        ],
        "reasoning": "Brief explanation of the plan"
      }

      day_of_week: 0=Day 1, 1=Day 2, ..., #{num_days - 1}=Day #{num_days}
      meal_type: "breakfast", "lunch", or "dinner"

      CRITICAL: Only use recipe IDs from the provided list. Create a varied, balanced plan. Don't assign the same recipe to adjacent meals. You don't need to fill every slot - leave some empty if needed for variety.
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to generate meal plan. Please try again."
  end

  def generate_meal_prep_plan(recipes:, pantry_items:, schedule:, household: nil, preferences: nil)
    recipes_text = recipes.map { |r| "- #{sanitize_input(r[:name], max_length: 100)} (#{sanitize_input(r[:cook_time], max_length: 50)})" }.join("\n")
    schedule_clean = sanitize_input(schedule)
    hh = household_text(household)
    pp = preferences_text(preferences)

    prompt = <<~PROMPT
      You are a meal prep planning expert. Create a detailed meal prep plan.
      #{hh}
      #{pp}

      Available recipes:
      #{recipes_text}

      Pantry items: #{pantry_items.map { |i| sanitize_input(i, max_length: 100) }.join(", ").presence || "not specified"}
      Schedule: #{schedule_clean}

      Return ONLY valid JSON (no markdown):
      {
        "prep_day_plan": [
          {"time": "9:00 AM", "task": "description", "recipe": "recipe name", "duration": "20 min"}
        ],
        "storage_instructions": [
          {"recipe": "name", "container": "airtight container", "shelf_life": "3 days", "reheat": "microwave 2 min"}
        ],
        "weekly_schedule": [
          {"day": "Monday", "breakfast": "recipe or prep", "lunch": "recipe or prep", "dinner": "recipe or prep"}
        ],
        "tips": ["tip 1", "tip 2"]
      }
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to generate meal prep plan. Please try again."
  end

  def generate_nutrition_report(nutrition_data:, recipe_names:, goals:, days_tracked:, household: nil, preferences: nil)
    nutrition_summary = nutrition_data.map.with_index { |n, i|
      recipe_name_clean = sanitize_input(recipe_names[i], max_length: 100)
      "#{recipe_name_clean}: #{n['calories'] || n[:calories]} cal, #{n['protein'] || n[:protein]} protein"
    }.join("\n")
    hh = household_text(household)
    pp = preferences_text(preferences)

    goals_text = goals ? "Goals: #{goals[:daily_calories].to_i} cal, #{goals[:daily_protein].to_i}g protein, #{goals[:daily_carbs].to_i}g carbs, #{goals[:daily_fat].to_i}g fat" : "No goals set"

    prompt = <<~PROMPT
      Analyze this week's nutrition data and provide a health report.
      #{hh}
      #{pp}

      Meals cooked (#{days_tracked} days):
      #{nutrition_summary}

      #{goals_text}

      Return ONLY valid JSON (no markdown):
      {
        "summary": "Overall assessment",
        "avg_daily_calories": 1800,
        "avg_daily_protein": 75,
        "avg_daily_carbs": 200,
        "avg_daily_fat": 60,
        "goal_adherence": {"calories": 85, "protein": 90, "carbs": 80, "fat": 75},
        "gaps": [{"nutrient": "fiber", "status": "low", "suggestion": "Add more vegetables"}],
        "suggested_recipes": [
          {"name": "recipe name", "reason": "High in missing nutrient"}
        ]
      }
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to generate nutrition report. Please try again."
  end

  def generate_daily_challenge(pantry_items:, skill_level:, household: nil, preferences: nil)
    skill_level_clean = sanitize_input(skill_level, max_length: 50)
    hh = household_text(household)
    pp = preferences_text(preferences)

    prompt = <<~PROMPT
      Generate a fun daily cooking challenge for a #{skill_level_clean} cook.
      #{hh}
      #{pp}

      Available pantry items: #{pantry_items.map { |i| sanitize_input(i, max_length: 100) }.join(", ").presence || "standard kitchen staples"}

      Return ONLY valid JSON (no markdown):
      {
        "challenge_text": "Create a Mexican-inspired dish using only pantry items",
        "challenge_type": "cuisine|technique|ingredient|health",
        "criteria": {"type": "use_ingredient", "ingredient": "beans"},
        "difficulty": "easy|medium|hard",
        "tips": ["tip for success"]
      }

      Make it creative, fun, and achievable. Consider the available ingredients.
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to generate challenge. Please try again."
  end

  def optimize_cooking_timeline(recipes:)
    recipes_text = recipes.map { |r|
      name_clean = sanitize_input(r[:name], max_length: 100)
      cook_time_clean = sanitize_input(r[:cook_time], max_length: 50)
      steps = r[:steps].map.with_index(1) { |s, i| "  #{i}. #{sanitize_input(s, max_length: 500)}" }.join("\n")
      "#{name_clean} (#{cook_time_clean}):\n#{steps}"
    }.join("\n\n")

    prompt = <<~PROMPT
      You are a professional kitchen coordinator. Create an optimized timeline for cooking these recipes simultaneously.

      Recipes:
      #{recipes_text}

      Return ONLY valid JSON (no markdown):
      {
        "total_time": "45 minutes",
        "timeline": [
          {"time": "0:00", "action": "Start boiling water for pasta", "recipe": "Pasta Primavera", "duration": "2 min active"},
          {"time": "0:02", "action": "Begin chopping vegetables", "recipe": "Stir Fry", "duration": "10 min active"}
        ],
        "tips": ["Use the downtime while X simmers to prep Y"],
        "timers": [
          {"name": "Pasta boiling", "minutes": 10, "start_at": "0:05"},
          {"name": "Sauce simmering", "minutes": 15, "start_at": "0:10"}
        ]
      }

      Optimize for parallel cooking. Identify idle times and suggest what to do during waits.
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to generate timeline. Please try again."
  end

  def parse_pantry_voice_input(text:)
    text_clean = sanitize_input(text, max_length: 1000)
    prompt = <<~PROMPT
      A user dictated their pantry items via voice. Parse the following text into individual pantry items with categories.

      Voice input: "#{text_clean}"

      Valid categories: produce, dairy, protein, grains, spices, condiments, canned, frozen, other

      Return ONLY valid JSON (no markdown):
      [
        {"name": "item name (lowercase, singular)", "category": "category", "quantity": "quantity if mentioned, or null"}
      ]

      Rules:
      - Normalize item names (lowercase, singular form: "tomatoes" -> "tomato")
      - Pick the most appropriate category for each item
      - If the user said quantities, include them in the quantity field (e.g., '2 lbs', '3 cans'). If no quantity mentioned, set quantity to null.
      - Split compound items ("salt and pepper" -> two items)
      - Be generous in interpretation - "chicken" -> protein, "rice" -> grains, etc.
      - Remove filler words, just extract the food items
    PROMPT

    response_text = call_api(build_request(prompt: prompt))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to parse voice input. Please try again."
  end

  def parse_receipt(image_base64:, media_type:)
    prompt = <<~PROMPT
      Analyze this grocery receipt photo and extract all food items purchased.
      Return ONLY valid JSON (no markdown formatting).

      Each object should have:
      - "name": the food item name (lowercase, singular, normalized - e.g., "chicken breast" not "BNLS CHKN BRST")
      - "category": one of: produce, dairy, protein, grains, spices, condiments, canned, frozen, other
      - "quantity": the quantity with unit if visible (e.g., "2 lbs", "1 gallon", "3"), or null if not clear
      - "price_cents": the price in cents as an integer (e.g., $3.99 = 399), or null if not visible
      - "store_name": the store name if visible at the top of the receipt, or null

      Example:
      [
        {"name": "chicken breast", "category": "protein", "quantity": "2 lbs", "price_cents": 899, "store_name": "Kroger"},
        {"name": "whole milk", "category": "dairy", "quantity": "1 gallon", "price_cents": 399, "store_name": "Kroger"},
        {"name": "banana", "category": "produce", "quantity": "6", "price_cents": 179, "store_name": "Kroger"}
      ]

      Rules:
      - Only include FOOD items (skip cleaning supplies, bags, etc.)
      - Normalize abbreviated/coded item names to readable names
      - Skip tax lines, subtotals, discounts, and non-item entries
      - If the receipt is not readable or not a grocery receipt, return an empty array: []
    PROMPT

    response_text = call_api(build_request(prompt: prompt, image_base64: image_base64, media_type: media_type))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to parse receipt. Please try again with a clearer photo."
  end

  def search_by_meal_name(meal_name:, pantry_items:, household: nil, preferences: nil)
    meal_name_clean = sanitize_input(meal_name)
    hh = household_text(household)
    pp = preferences_text(preferences)
    servings = household.present? ? household.size : 4
    pantry_list = pantry_items.map { |i| sanitize_input(i, max_length: 100) }.join(", ")

    prompt = <<~PROMPT
      You are a creative recipe assistant. Generate 3 unique recipe variations for: #{meal_name_clean}
      #{hh ? "\n      #{hh}" : ""}
      #{pp ? "\n      #{pp}" : ""}

      User's available pantry items: #{pantry_list.presence || "standard kitchen staples"}

      Return ONLY valid JSON (no markdown):
      [
        {
          "name": "Recipe Name",
          "description": "Brief description of this variation",
          "cook_time": "30 minutes",
          "difficulty": "easy|medium|hard",
          "servings": #{servings},
          "ingredients": [{"name": "ingredient", "amount": "1 cup", "have": true}],
          "steps": ["Step 1", "Step 2"],
          "nutrition": {"calories": 400, "protein": "25g", "carbs": "30g", "fat": "15g"}
        }
      ]

      CRITICAL RULES:
      - Mark ingredients the user has in their pantry (from the list above) as "have": true, others as "have": false
      - Create 3 different variations of #{meal_name_clean} (e.g., classic, healthy, quick versions)
      - Use pantry items when possible but don't force it
      - Include 5-8 ingredients per recipe
      - Include 4-8 clear, numbered steps
      - Provide realistic nutrition estimates per serving
      - Be creative and provide variety in the 3 recipes
    PROMPT

    response_text = call_api(build_request(prompt: prompt, temperature: 0.9))
    json_text = strip_markdown_fences(response_text)
    JSON.parse(json_text, symbolize_names: true)
  rescue JSON::ParserError
    raise Error, "Unable to generate recipe suggestions. Please try again."
  end

  private

  def sanitize_input(text, max_length: 500)
    return "" if text.blank?
    text = text.to_s
      .gsub(/[`]{3,}/, '')                    # strip markdown code fences
      .gsub(/\b(system|user|assistant):/i, '') # strip role markers
      .gsub(/[\x00-\x08\x0B\x0C\x0E-\x1F]/, '') # strip control chars (keep \n, \r, \t)
      .strip
    text.truncate(max_length)
  end

  def household_text(household)
    return nil if household.blank?
    members = household.map { |m|
      name = sanitize_input(m[:name] || m['name'], max_length: 50)
      age = (m[:age] || m['age']).to_i
      "#{name} (age #{age})"
    }.join(", ")
    "Household (#{household.size} people): #{members}. Adjust portions and consider age-appropriate meals (e.g., milder flavors and smaller portions for young children, larger portions for adults)."
  end

  def preferences_text(prefs)
    return nil if prefs.blank?
    lines = []

    dietary = prefs[:dietary_restrictions] || prefs["dietary_restrictions"] || []
    dietary_clean = dietary.map { |d| sanitize_input(d, max_length: 50) }
    lines << "Dietary restrictions: #{dietary_clean.join(', ')}" if dietary_clean.any?

    allergens = prefs[:allergens] || prefs["allergens"] || []
    allergens_clean = allergens.map { |a| sanitize_input(a, max_length: 50) }
    lines << "ALLERGENS (MUST AVOID): #{allergens_clean.join(', ')}" if allergens_clean.any?

    spice = sanitize_input(prefs[:spice_tolerance] || prefs["spice_tolerance"], max_length: 50)
    lines << "Spice tolerance: #{spice}" if spice.present? && spice != "medium"

    cuisines = prefs[:preferred_cuisines] || prefs["preferred_cuisines"] || []
    cuisines_clean = cuisines.map { |c| sanitize_input(c, max_length: 50) }
    lines << "Preferred cuisines: #{cuisines_clean.join(', ')}" if cuisines_clean.any?

    proteins = prefs[:preferred_proteins] || prefs["preferred_proteins"] || []
    proteins_clean = proteins.map { |p| sanitize_input(p, max_length: 50) }
    lines << "Preferred proteins: #{proteins_clean.join(', ')}" if proteins_clean.any?

    cal_pref = sanitize_input(prefs[:calorie_preference] || prefs["calorie_preference"], max_length: 50)
    lines << "Calorie preference: #{cal_pref}" if cal_pref.present? && cal_pref != "none"

    return nil if lines.empty?
    "User preferences:\n#{lines.join("\n")}"
  end

  def build_recipe_prompt(ingredients, filters, household: nil, preferences: nil)
    ingredients_clean = sanitize_input(ingredients)
    dietary = sanitize_input(filters[:dietary].presence || "none", max_length: 100)
    cuisine = sanitize_input(filters[:cuisine].presence || "any", max_length: 100)
    cook_time = sanitize_input(filters[:cook_time].presence || "any", max_length: 100)
    difficulty = sanitize_input(filters[:difficulty].presence || "any", max_length: 50)
    servings = household.present? ? household.size : (filters[:servings].to_i.presence || 4)
    hh = household_text(household)
    pp = preferences_text(preferences)

    <<~PROMPT
      You are a professional chef assistant. Generate exactly 3 creative, delicious recipes using the following ingredients: #{ingredients_clean}.
      #{hh ? "\n      #{hh}" : ""}
      #{pp ? "\n      #{pp}" : ""}

      Recipe requirements:
      - Dietary preference: #{dietary}
      - Cuisine type: #{cuisine}
      - Maximum cook time: #{cook_time}
      - Difficulty level: #{difficulty}
      - Servings: #{servings}

      Return ONLY a valid JSON array with NO markdown formatting (no ```json or ``` wrappers).

      Each recipe must have this exact structure:
      {
        "name": "Recipe Name",
        "description": "Brief 1-2 sentence description",
        "cook_time": "30 minutes" (include prep + cook time),
        "difficulty": "easy|medium|hard",
        "servings": 4,
        "ingredients": [
          {"name": "ingredient name", "amount": "quantity with unit", "have": true or false}
        ],
        "steps": [
          "Step 1 instructions",
          "Step 2 instructions"
        ],
        "nutrition": {
          "calories": 450,
          "protein": "35g",
          "carbs": "40g",
          "fat": "15g"
        },
        "substitutions": [
          {"missing": "ingredient user doesn't have", "substitute": "easy replacement"}
        ]
      }

      CRITICAL RULES:
      - Mark ingredients the user provided as "have": true, others as "have": false
      - Include 5-8 ingredients per recipe maximum
      - Include 4-8 clear, numbered steps
      - Provide realistic nutrition estimates per serving
      - Only suggest substitutions for ingredients where "have": false
      - Be creative but practical
      - Return ONLY the JSON array, nothing else
    PROMPT
  end

  def build_request(prompt:, image_base64: nil, media_type: nil, temperature: 0.7)
    parts = []

    if image_base64.present? && media_type.present?
      parts << {
        inline_data: {
          mime_type: media_type,
          data: image_base64
        }
      }
    end

    parts << { text: prompt }

    {
      contents: [
        {
          parts: parts
        }
      ],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 8192
      }
    }
  end

  def connection
    @connection ||= Faraday.new(url: GEMINI_URL) do |f|
      f.request :json
      f.response :json
      f.options.timeout = 90
      f.options.open_timeout = 10
      f.adapter Faraday.default_adapter
    end
  end

  def call_api(body)
    max_attempts = 3
    attempts = 0

    loop do
      attempts += 1

      begin
        response = connection.post do |req|
          req.params["key"] = @api_key
          req.body = body
        end
      rescue Faraday::Error => e
        Rails.logger.error("Faraday error calling Gemini API: #{e.message}")
        if attempts < max_attempts
          sleep(2 ** (attempts - 1))
          next
        end
        raise Error, "Network error connecting to AI service. Please check your connection and try again."
      end

      unless response.success?
        error_message = response.body.dig("error", "message") || "Unknown error"
        Rails.logger.error("Gemini API error: #{response.status} - #{error_message}")

        if (response.status == 429 || response.status == 503) && attempts < max_attempts
          sleep(2 ** (attempts - 1))
          next
        end

        if response.status == 429
          raise Error, "AI service is busy. Please wait a moment and try again."
        end
        raise Error, "AI service is temporarily unavailable. Please try again."
      end

      candidates = response.body["candidates"]
      unless candidates&.any?
        Rails.logger.error("Gemini API returned no candidates")
        raise Error, "Unable to generate a response. Please try again."
      end

      text = candidates.dig(0, "content", "parts", 0, "text")
      unless text.present?
        Rails.logger.error("Gemini API returned no text content")
        raise Error, "Unable to generate a response. Please try again."
      end

      return text
    end
  end

  def strip_markdown_fences(text)
    text.gsub(/```(?:json)?\s*\n?/, "").gsub(/```\s*$/, "").strip
  end
end
