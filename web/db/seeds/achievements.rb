achievements = [
  { name: "First Recipe", description: "Save your first recipe", icon: "bookmark", category: "milestones", points: 10, criteria_json: { type: "first_save" }.to_json },
  { name: "Home Chef", description: "Cook your first recipe", icon: "fire", category: "milestones", points: 10, criteria_json: { type: "first_cook" }.to_json },
  { name: "Recipe Collector", description: "Save 10 recipes", icon: "collection", category: "milestones", points: 25, criteria_json: { type: "total_saved", count: 10 }.to_json },
  { name: "Prolific Chef", description: "Save 50 recipes", icon: "star", category: "milestones", points: 50, criteria_json: { type: "total_saved", count: 50 }.to_json },
  { name: "Cooking Streak: 3 Days", description: "Cook 3 days in a row", icon: "flame", category: "streaks", points: 15, criteria_json: { type: "streak", count: 3 }.to_json },
  { name: "Cooking Streak: 7 Days", description: "Cook 7 days in a row", icon: "flame", category: "streaks", points: 30, criteria_json: { type: "streak", count: 7 }.to_json },
  { name: "Cooking Streak: 30 Days", description: "Cook 30 days in a row", icon: "flame", category: "streaks", points: 100, criteria_json: { type: "streak", count: 30 }.to_json },
  { name: "Kitchen Rookie", description: "Cook 5 recipes", icon: "chef-hat", category: "cooking", points: 15, criteria_json: { type: "total_cooked", count: 5 }.to_json },
  { name: "Seasoned Cook", description: "Cook 25 recipes", icon: "chef-hat", category: "cooking", points: 40, criteria_json: { type: "total_cooked", count: 25 }.to_json },
  { name: "Master Chef", description: "Cook 100 recipes", icon: "trophy", category: "cooking", points: 100, criteria_json: { type: "total_cooked", count: 100 }.to_json },
  { name: "Recipe Librarian", description: "Save 25 recipes", icon: "book-open", category: "milestones", points: 35, criteria_json: { type: "total_saved", count: 25 }.to_json },
  { name: "Century Chef", description: "Save 100 recipes", icon: "sparkles", category: "milestones", points: 75, criteria_json: { type: "total_saved", count: 100 }.to_json },
  { name: "Getting Started", description: "Cook 3 recipes", icon: "play", category: "cooking", points: 10, criteria_json: { type: "total_cooked", count: 3 }.to_json },
  { name: "Dedicated Cook", description: "Cook 50 recipes", icon: "heart", category: "cooking", points: 60, criteria_json: { type: "total_cooked", count: 50 }.to_json },
  { name: "Iron Chef", description: "Maintain a 14-day cooking streak", icon: "shield", category: "streaks", points: 50, criteria_json: { type: "streak", count: 14 }.to_json },
]

achievements.each do |attrs|
  Achievement.find_or_create_by!(name: attrs[:name]) do |a|
    a.assign_attributes(attrs.except(:name))
  end
end

puts "Seeded #{Achievement.count} achievements"
