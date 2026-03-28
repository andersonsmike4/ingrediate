import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  SparklesIcon,
  BookmarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  FireIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { searchByMealName, saveRecipe } from "../utils/api";
import { getDifficultyColor, NUTRITION_FIELDS } from "../utils/recipe";

const SUGGESTIONS = [
  "Blueberry Muffins",
  "Chicken Tikka Masala",
  "Pasta Carbonara",
  "Banana Bread",
  "Beef Stir Fry",
  "French Onion Soup",
];

function RecipeCardCompact({ recipe, onSave, isSaved }) {
  const [saving, setSaving] = useState(false);
  const [localSaved, setLocalSaved] = useState(isSaved);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRecipe(recipe);
      setLocalSaved(true);
      onSave(recipe);
      toast.success(`"${recipe.name}" saved!`);
    } catch (err) {
      console.error("Error saving recipe:", err);
      toast.error("Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(234, 88, 12, 0.1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 overflow-hidden flex flex-col"
    >
      <div className="p-6 flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">{recipe.name}</h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{recipe.description}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.cook_time && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-400">
              <ClockIcon className="h-4 w-4" />
              {recipe.cook_time}
            </span>
          )}
          {recipe.difficulty && (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
              <FireIcon className="h-4 w-4" />
              {recipe.difficulty}
            </span>
          )}
          {recipe.servings && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
              <UsersIcon className="h-4 w-4" />
              {recipe.servings} servings
            </span>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Ingredients</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recipe.ingredients?.map((ingredient, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                {ingredient.have ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                <span className={ingredient.have ? "text-green-700" : "text-orange-700"}>
                  {ingredient.amount && `${ingredient.amount} `}
                  {ingredient.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Disclosure>
          {({ open }) => (
            <>
              <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-stone-50 dark:bg-stone-900 px-4 py-2 text-left text-sm font-medium text-stone-900 dark:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                <span>Instructions</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDownIcon className="h-5 w-5 text-stone-600" />
                </motion.div>
              </DisclosureButton>
              <AnimatePresence>
                {open && (
                  <DisclosurePanel
                    static
                    as={motion.div}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-2 text-sm text-stone-700 dark:text-stone-200">
                      {recipe.steps?.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <span className="font-semibold text-orange-600 flex-shrink-0">{index + 1}.</span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </DisclosurePanel>
                )}
              </AnimatePresence>
            </>
          )}
        </Disclosure>

        {recipe.nutrition && (
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
            <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">Nutrition (per serving)</h4>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {NUTRITION_FIELDS.map(({ key, label, color }) => (
                recipe.nutrition[key] && (
                  <div key={key} className={`rounded-lg px-2 py-2 text-center ${color}`}>
                    <div className="font-bold">{recipe.nutrition[key]}</div>
                    <div className="opacity-75">{label}</div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-700">
        <motion.button
          onClick={handleSave}
          disabled={saving || localSaved}
          whileHover={{ scale: saving || localSaved ? 1 : 1.02 }}
          whileTap={{ scale: saving || localSaved ? 1 : 0.98 }}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
            localSaved
              ? "bg-green-600 text-white focus:ring-green-500"
              : "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 disabled:opacity-50"
          }`}
        >
          <BookmarkIcon className="h-5 w-5" />
          {localSaved ? "Saved!" : saving ? "Saving..." : "Save Recipe"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function RecipeSearch() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await searchByMealName(trimmedQuery);
      setRecipes(results);
      if (results.length === 0) {
        toast.info("No recipes found. Try a different search.");
      }
    } catch (err) {
      console.error("Error searching recipes:", err);
      setError(err.message || "Failed to search recipes");
      toast.error(err.message || "Failed to search recipes");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleSaveRecipe = (recipe) => {
    setSavedIds(new Set([...savedIds, recipe.name]));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <SparklesIcon className="h-8 w-8 text-orange-600" />
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50">Recipe Search</h2>
        </div>
        <p className="text-lg text-stone-600 dark:text-stone-400">
          Search for recipes by meal name and get AI-powered suggestions
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., blueberry muffins, chicken tikka masala..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border-stone-300 dark:border-stone-600 border text-stone-900 dark:text-stone-100 dark:bg-stone-900 placeholder-stone-400 focus:border-orange-500 focus:ring-orange-500 focus:ring-2 focus:outline-none"
                disabled={loading}
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading || !query.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-lg bg-orange-600 text-white font-semibold shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </motion.button>
          </div>

          {!hasSearched && (
            <div className="space-y-3">
              <p className="text-sm text-stone-600 dark:text-stone-400 font-medium">Try these popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <motion.button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </form>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="inline-block"
            >
              <SparklesIcon className="h-12 w-12 text-orange-600" />
            </motion.div>
            <p className="mt-4 text-lg font-medium text-stone-700 dark:text-stone-200">Searching for recipes...</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">This may take a moment</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
          >
            <p className="text-red-700 font-medium">{error}</p>
            <motion.button
              onClick={() => handleSearch(query)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
            >
              Try Again
            </motion.button>
          </motion.div>
        ) : recipes.length > 0 ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50">
                Found {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {recipes.map((recipe, index) => (
                <motion.div
                  key={recipe.name + index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                >
                  <RecipeCardCompact
                    recipe={recipe}
                    onSave={handleSaveRecipe}
                    isSaved={savedIds.has(recipe.name)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : hasSearched ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-sm border border-orange-100 p-12 text-center"
          >
            <MagnifyingGlassIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
            <p className="text-stone-500 dark:text-stone-400 text-lg">No recipes found</p>
            <p className="text-stone-400 dark:text-stone-500 text-sm mt-2">Try a different search term</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
