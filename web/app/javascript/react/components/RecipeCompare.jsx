import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScaleIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchSavedRecipes, compareRecipes } from "../utils/api";

export default function RecipeCompare() {
  const [recipes, setRecipes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const data = await fetchSavedRecipes();
        setRecipes(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadRecipes();
  }, []);

  const toggleRecipe = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(rid => rid !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    } else {
      toast.error("You can compare up to 3 recipes");
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 recipes to compare");
      return;
    }

    setComparing(true);
    try {
      const data = await compareRecipes(selectedIds);
      setComparison(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-stone-600">Loading recipes...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <ScaleIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-900 mb-2">No saved recipes</h2>
        <p className="text-stone-600">Save some recipes first to compare them</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Compare Recipes</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Compare nutrition, cost, and difficulty side-by-side</p>
      </div>

      {/* Recipe Selection */}
      {!comparison && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-4">
              Select 2-3 recipes to compare ({selectedIds.length}/3)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => toggleRecipe(recipe.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedIds.includes(recipe.id)
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30"
                      : "border-stone-200 dark:border-stone-700 hover:border-orange-200"
                  }`}
                >
                  <h3 className="font-bold text-stone-900 dark:text-stone-50 mb-1">{recipe.name}</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{recipe.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || comparing}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
          >
            {comparing ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Comparing...
              </>
            ) : (
              <>
                <ScaleIcon className="h-5 w-5" />
                Compare
              </>
            )}
          </button>
        </>
      )}

      {/* Comparison Results */}
      {comparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <button
            onClick={() => setComparison(null)}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Select different recipes
          </button>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparison.recipes?.map((recipe) => {
              const isWinner = recipe.id === comparison.winner_id;

              return (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white dark:bg-stone-800 rounded-2xl shadow-sm border p-6 ${
                    isWinner ? "border-orange-500 ring-2 ring-orange-200" : "border-orange-100 dark:border-stone-700"
                  }`}
                >
                  {isWinner && (
                    <div className="flex items-center gap-2 mb-4 text-orange-600">
                      <TrophyIcon className="h-5 w-5" />
                      <span className="font-bold text-sm">Best Overall</span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-4">{recipe.name}</h3>

                  {/* Metrics */}
                  <div className="space-y-4">
                    {/* Nutrition Bars */}
                    {recipe.metrics?.nutrition && (
                      <div>
                        <h4 className="text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">Nutrition</h4>
                        {Object.entries(recipe.metrics.nutrition).map(([key, value]) => {
                          const score = recipe.scores?.[key] || 0;
                          const color =
                            score >= 80 ? "bg-green-500" : score >= 50 ? "bg-orange-500" : "bg-red-500";

                          return (
                            <div key={key} className="mb-2">
                              <div className="flex justify-between text-xs text-stone-600 mb-1">
                                <span className="capitalize">{key}</span>
                                <span>{value}</span>
                              </div>
                              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${color} transition-all`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Other Metrics */}
                    <div className="space-y-2 pt-4 border-t border-stone-100 dark:border-stone-700">
                      {recipe.metrics?.cost && (
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-600 dark:text-stone-400">Estimated Cost</span>
                          <span className="text-sm font-medium text-stone-900 dark:text-stone-100">${recipe.metrics.cost}</span>
                        </div>
                      )}
                      {recipe.metrics?.difficulty && (
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-600 dark:text-stone-400">Difficulty</span>
                          <span className="text-sm font-medium text-stone-900 capitalize">
                            {recipe.metrics.difficulty}
                          </span>
                        </div>
                      )}
                      {recipe.metrics?.cook_time && (
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-600 dark:text-stone-400">Cook Time</span>
                          <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{recipe.metrics.cook_time}</span>
                        </div>
                      )}
                      {recipe.metrics?.pantry_match !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-600 dark:text-stone-400">Pantry Match</span>
                          <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{recipe.metrics.pantry_match}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          {comparison.summary && (
            <div className="bg-orange-50 dark:bg-orange-900/30 rounded-2xl border border-orange-200 dark:border-stone-700 p-6">
              <h3 className="font-bold text-stone-900 dark:text-stone-50 mb-2">Summary</h3>
              <p className="text-stone-700 dark:text-stone-200">{comparison.summary}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
