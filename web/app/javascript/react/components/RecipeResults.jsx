import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { generateRecipes } from "../utils/api";
import RecipeCard from "./RecipeCard";

const SkeletonCard = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white dark:bg-stone-800 rounded-xl shadow-sm dark:shadow-none border border-orange-100 dark:border-stone-700 p-6"
  >
    <div className="animate-pulse">
      <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-3/4 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-5/6" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-4/6" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded-full w-20" />
        <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded-full w-16" />
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded" />
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-5/6" />
      </div>
      <div className="mt-6 flex gap-2">
        <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg flex-1" />
        <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg flex-1" />
      </div>
    </div>
  </motion.div>
);

export default function RecipeResults({ recipes, ingredients, filters, onNewRecipes, loading }) {
  const [refinementText, setRefinementText] = useState("");
  const [fetching, setFetching] = useState(false);

  const fetchRecipes = async (ingredientsStr) => {
    setFetching(true);
    try {
      const results = await generateRecipes(ingredientsStr, filters);
      onNewRecipes(results);
      return true;
    } catch (err) {
      console.error("Error fetching recipes:", err);
      return false;
    } finally {
      setFetching(false);
    }
  };

  const handleRefine = async (e) => {
    e.preventDefault();
    if (!refinementText.trim()) return;

    const success = await fetchRecipes(`${ingredients}, ${refinementText}`);
    if (success) {
      setRefinementText("");
      toast.success("Recipes refined!");
    } else {
      toast.error("Failed to refine recipes");
    }
  };

  const handleRegenerate = async () => {
    const success = await fetchRecipes(ingredients);
    if (success) {
      toast.success("New recipes generated!");
    } else {
      toast.error("Failed to regenerate recipes");
    }
  };

  const isLoading = loading || fetching;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Recipe Suggestions</h2>

        {recipes.length > 0 && (
          <motion.button
            onClick={handleRegenerate}
            disabled={fetching}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            <motion.div
              animate={fetching ? { rotate: 360 } : {}}
              transition={fetching ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
            >
              <ArrowPathIcon className="h-5 w-5" />
            </motion.div>
            Regenerate
          </motion.button>
        )}
      </div>

      {recipes.length > 0 && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleRefine}
          className="bg-white dark:bg-stone-800 rounded-xl shadow-sm dark:shadow-none border border-orange-100 dark:border-stone-700 p-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
              placeholder="Refine results (e.g., make it spicier, kid friendly)"
              className="flex-1 rounded-lg border-stone-300 dark:border-stone-600 border px-4 py-2 text-sm text-stone-900 dark:text-stone-100 dark:bg-stone-900 placeholder-stone-400 focus:border-orange-500 focus:ring-orange-500 focus:ring-2 focus:outline-none"
            />
            <motion.button
              type="submit"
              disabled={fetching || !refinementText.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {fetching ? "Refining..." : "Refine"}
            </motion.button>
          </div>
        </motion.form>
      )}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6"
          >
            {[0, 1, 2].map((i) => <SkeletonCard key={i} index={i} />)}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6"
          >
            {recipes.map((recipe, index) => (
              <motion.div
                key={recipe.name + index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
              >
                <RecipeCard recipe={recipe} userIngredients={ingredients} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
