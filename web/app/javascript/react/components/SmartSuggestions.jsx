import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, ClockIcon, FireIcon, UsersIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { csrfToken } from "../utils/csrf";
import { saveRecipe } from "../utils/api";

export default function SmartSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setHasAsked(true);
    try {
      const response = await fetch("/api/suggestions/smart", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken(),
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) throw new Error("Failed to get suggestions");
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      toast.error("Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (suggestion) => {
    try {
      await saveRecipe({
        name: suggestion.name,
        description: suggestion.description,
        cook_time: suggestion.cook_time,
        difficulty: suggestion.difficulty,
        servings: suggestion.servings,
        ingredients: suggestion.ingredients,
        steps: suggestion.steps,
        nutrition: suggestion.nutrition,
        substitutions: []
      });
      toast.success(`"${suggestion.name}" saved!`);
    } catch (err) {
      toast.error("Failed to save recipe");
    }
  };

  const getDifficultyColor = (d) => {
    if (!d) return "bg-stone-100 text-stone-700";
    const dl = d.toLowerCase();
    if (dl === "easy") return "bg-green-100 text-green-700";
    if (dl === "medium") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <SparklesIcon className="h-12 w-12 text-orange-400 mx-auto" />
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">What should I cook?</h2>
        <p className="text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
          Get personalized suggestions based on your pantry, cooking history, nutrition goals, and expiring ingredients.
        </p>
        <motion.button
          onClick={handleGetSuggestions}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.05 }}
          whileTap={{ scale: loading ? 1 : 0.95 }}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-orange-700 hover:to-orange-600 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Thinking...
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              {hasAsked ? "Get New Suggestions" : "Suggest Recipes"}
            </>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {suggestions.map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1">
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-1">{s.name}</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">{s.description}</p>

                  {s.reasoning && (
                    <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-orange-800 dark:text-orange-400">
                        <SparklesIcon className="h-3 w-3 inline mr-1" />
                        {s.reasoning}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {s.cook_time && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {s.cook_time}
                      </span>
                    )}
                    {s.difficulty && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getDifficultyColor(s.difficulty)}`}>
                        <FireIcon className="h-3.5 w-3.5" />
                        {s.difficulty}
                      </span>
                    )}
                    {s.servings && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <UsersIcon className="h-3.5 w-3.5" />
                        {s.servings} servings
                      </span>
                    )}
                  </div>

                  {s.ingredients && (
                    <div className="text-xs text-stone-600 dark:text-stone-200 space-y-0.5 max-h-32 overflow-y-auto">
                      {s.ingredients.map((ing, i) => (
                        <div key={i} className="flex gap-1">
                          <span className={ing.have ? "text-green-600" : "text-orange-600"}>
                            {ing.have ? "✓" : "•"}
                          </span>
                          <span className={ing.have ? "" : "font-medium"}>
                            {ing.amount && `${ing.amount} `}{ing.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-700">
                  <motion.button
                    onClick={() => handleSave(s)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
                  >
                    Save Recipe
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
