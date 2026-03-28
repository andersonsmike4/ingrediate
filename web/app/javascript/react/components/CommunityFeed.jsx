import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlassIcon, HeartIcon as HeartOutline, ClockIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { fetchFeed, likeRecipe, unlikeRecipe } from "../utils/api";
import { useAuth } from "./AuthContext";

export default function CommunityFeed() {
  const { isAuthenticated } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  useEffect(() => {
    loadFeed();
  }, [search]);

  const loadFeed = async (append = false) => {
    setLoading(true);
    try {
      const currentPage = append ? page + 1 : 1;
      const data = await fetchFeed({ search, page: currentPage, per_page: 12 });
      if (append) {
        setRecipes([...recipes, ...data.recipes]);
      } else {
        setRecipes(data.recipes);
      }
      setHasMore(data.recipes.length === 12);
      setPage(currentPage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (recipeId, isLiked) => {
    if (!isAuthenticated) {
      toast.error("Sign in to like recipes");
      return;
    }

    try {
      if (isLiked) {
        await unlikeRecipe(recipeId);
      } else {
        await likeRecipe(recipeId);
      }
      setRecipes(recipes.map(r =>
        r.id === recipeId
          ? { ...r, liked_by_user: !isLiked, likes_count: r.likes_count + (isLiked ? -1 : 1) }
          : r
      ));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Community Feed</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Discover recipes shared by the community</p>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
        />
      </div>

      {/* Loading State */}
      {loading && recipes.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6 animate-pulse">
              <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-full mb-2" />
              <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-2/3 mb-4" />
              <div className="flex gap-4">
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-20" />
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && recipes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center"
        >
          <HeartOutline className="h-16 w-16 text-orange-200 dark:text-orange-800 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">No recipes yet</h2>
          <p className="text-stone-600 dark:text-stone-400">Be the first to share a recipe with the community!</p>
        </motion.div>
      )}

      {/* Recipe Grid */}
      {recipes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {recipes.map((recipe, i) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 flex-1">{recipe.name}</h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(recipe.id, recipe.liked_by_user);
                  }}
                  className="flex items-center gap-1 text-sm"
                >
                  {recipe.liked_by_user ? (
                    <HeartSolid className="h-5 w-5 text-red-500" />
                  ) : (
                    <HeartOutline className="h-5 w-5 text-stone-400 hover:text-red-500 transition-colors" />
                  )}
                  <span className="text-stone-600 dark:text-stone-400">{recipe.likes_count || 0}</span>
                </motion.button>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-2">{recipe.description}</p>

              <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 mb-3">
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {recipe.cook_time}
                </div>
                <div className="flex items-center gap-1">
                  <ChartBarIcon className="h-4 w-4" />
                  {recipe.difficulty}
                </div>
              </div>

              <div className="text-xs text-stone-500 dark:text-stone-400">
                by <span className="font-medium text-orange-600 dark:text-orange-400">{recipe.author_name || "Anonymous"}</span>
              </div>

              <AnimatePresence>
                {expandedRecipe === recipe.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700"
                  >
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-50 mb-2">Ingredients:</h4>
                    <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1 mb-4">
                      {(recipe.ingredients || []).slice(0, 5).map((ing, idx) => (
                        <li key={idx}>• {ing.name || ing}</li>
                      ))}
                      {recipe.ingredients?.length > 5 && (
                        <li className="text-stone-400">+ {recipe.ingredients.length - 5} more...</li>
                      )}
                    </ul>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-50 mb-2">Steps:</h4>
                    <ol className="text-sm text-stone-600 dark:text-stone-400 space-y-1">
                      {(recipe.steps || []).slice(0, 3).map((step, idx) => (
                        <li key={idx}>{idx + 1}. {step.instruction || step}</li>
                      ))}
                      {recipe.steps?.length > 3 && (
                        <li className="text-stone-400">+ {recipe.steps.length - 3} more steps...</li>
                      )}
                    </ol>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Load More */}
      {hasMore && recipes.length > 0 && !loading && (
        <div className="text-center">
          <button
            onClick={() => loadFeed(true)}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {loading && recipes.length > 0 && (
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
