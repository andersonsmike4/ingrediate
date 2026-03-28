export const DEFAULT_FILTERS = {
  dietary: "none",
  cuisine: "any",
  cookTime: "any",
  difficulty: "any",
  servings: "4"
};

export function getDifficultyColor(difficulty) {
  const lower = difficulty?.toLowerCase() || "";
  if (lower === "easy") return "text-green-700 bg-green-100";
  if (lower === "medium") return "text-orange-700 bg-orange-100";
  if (lower === "hard") return "text-red-700 bg-red-100";
  return "text-stone-700 bg-stone-100";
}

export const NUTRITION_FIELDS = [
  { key: "calories", label: "Cal", color: "bg-red-50 text-red-700" },
  { key: "protein", label: "Protein", color: "bg-blue-50 text-blue-700" },
  { key: "carbs", label: "Carbs", color: "bg-orange-50 text-orange-700" },
  { key: "fat", label: "Fat", color: "bg-purple-50 text-purple-700" },
];

export const FILTER_OPTIONS = [
  { label: "Dietary Preference", key: "dietary", options: [
    { value: "none", label: "No Restriction" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "gluten-free", label: "Gluten-Free" },
  ]},
  { label: "Cuisine Type", key: "cuisine", options: [
    { value: "any", label: "Any" },
    { value: "italian", label: "Italian" },
    { value: "asian", label: "Asian" },
    { value: "mexican", label: "Mexican" },
    { value: "american", label: "American" },
  ]},
  { label: "Cook Time", key: "cookTime", options: [
    { value: "any", label: "Any" },
    { value: "under-30", label: "Under 30 min" },
    { value: "under-60", label: "Under 1 hour" },
  ]},
  { label: "Difficulty", key: "difficulty", options: [
    { value: "any", label: "Any" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ]},
  { label: "Servings", key: "servings", options: [
    { value: "2", label: "2 servings" },
    { value: "4", label: "4 servings" },
    { value: "6", label: "6+ servings" },
  ]},
];
