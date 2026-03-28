import { Recipe } from '../types';

export function parseRecipeJson(recipe: any): Recipe {
  return {
    ...recipe,
    ingredients: recipe.ingredients_json ? JSON.parse(recipe.ingredients_json) : [],
    steps: recipe.steps_json ? JSON.parse(recipe.steps_json) : [],
    nutrition: recipe.nutrition_json ? JSON.parse(recipe.nutrition_json) : null,
    substitutions: recipe.substitutions_json ? JSON.parse(recipe.substitutions_json) : [],
  };
}
