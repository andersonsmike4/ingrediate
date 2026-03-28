import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrashIcon, BookmarkIcon, ClockIcon, FireIcon, UsersIcon, StarIcon, PencilSquareIcon, ShareIcon, MagnifyingGlassIcon, FunnelIcon, TagIcon, XMarkIcon, PlayIcon, ArrowsPointingOutIcon, PrinterIcon, CurrencyDollarIcon, ArrowPathIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchSavedRecipes, deleteSavedRecipe, updateSavedRecipe, shareRecipe, logCooking, suggestSubstitutions, estimateRecipeCost } from "../utils/api";
import { getDifficultyColor, NUTRITION_FIELDS } from "../utils/recipe";
import CookingMode from "./CookingMode";
import RecipeScaler from "./RecipeScaler";
import RecipePrintView from "./RecipePrintView";
import RecipeVariations from "./RecipeVariations";

export default function SavedRecipes({ onBackToHome }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [draftNote, setDraftNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState(0); // 0 = all
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [scalingRecipe, setScalingRecipe] = useState(null);
  const [printingRecipe, setPrintingRecipe] = useState(null);
  const [variationRecipe, setVariationRecipe] = useState(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const data = await fetchSavedRecipes();
      setRecipes(data);
    } catch (err) {
      console.error("Error fetching saved recipes:", err);
      toast.error("Failed to load saved recipes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;

    try {
      await deleteSavedRecipe(id);
      setRecipes(recipes.filter(recipe => recipe.id !== id));
      toast.success(`"${name}" deleted`);
    } catch (err) {
      console.error("Error deleting recipe:", err);
      toast.error("Failed to delete recipe");
    }
  };

  const handleRate = async (id, rating) => {
    // Optimistically update local state
    setRecipes(recipes.map(r => r.id === id ? { ...r, rating } : r));

    try {
      await updateSavedRecipe(id, { rating });
      toast.success("Rating saved");
    } catch (err) {
      console.error("Error updating rating:", err);
      toast.error("Failed to save rating");
      // Revert on error
      loadRecipes();
    }
  };

  const handleStartEditNote = (recipe) => {
    setEditingNoteId(recipe.id);
    setDraftNote(recipe.notes || "");
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setDraftNote("");
  };

  const handleSaveNote = async (id) => {
    try {
      await updateSavedRecipe(id, { notes: draftNote });
      setRecipes(recipes.map(r => r.id === id ? { ...r, notes: draftNote } : r));
      setEditingNoteId(null);
      setDraftNote("");
      toast.success("Note saved");
    } catch (err) {
      console.error("Error saving note:", err);
      toast.error("Failed to save note");
    }
  };

  const handleLogCooking = async (recipeId) => {
    try {
      const data = await logCooking(recipeId);
      const deducted = data.deducted_pantry_items || [];
      if (deducted.length > 0) {
        toast.success(`Cooking logged! Removed ${deducted.length} item${deducted.length === 1 ? "" : "s"} from pantry: ${deducted.join(", ")}`);
      } else {
        toast.success("Cooking logged!");
      }
    } catch (err) {
      toast.error("Failed to log cooking");
    }
  };

  const handleEstimateCost = async (recipe) => {
    try {
      const data = await estimateRecipeCost(recipe.id);
      setRecipes(recipes.map(r => r.id === recipe.id ? { ...r, estimated_cost_cents: data.estimated_cost_cents } : r));
      toast.success(`Estimated cost: $${(data.estimated_cost_cents / 100).toFixed(2)}`);
    } catch (err) {
      toast.error("Failed to estimate cost");
    }
  };

  const handleSuggestSubstitutions = async (recipe, ingredient) => {
    try {
      const data = await suggestSubstitutions(recipe.id, ingredient);
      toast.success(`Substitutions for ${ingredient}: ${(data.substitutions || []).join(", ") || "None found"}`);
    } catch (err) {
      toast.error("Failed to get substitutions");
    }
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = recipe.name?.toLowerCase().includes(q);
        const matchesDesc = recipe.description?.toLowerCase().includes(q);
        const matchesTags = (recipe.tags_json ? JSON.parse(recipe.tags_json) : []).some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }
      if (filterRating > 0 && (recipe.rating || 0) < filterRating) return false;
      if (filterDifficulty !== "all" && recipe.difficulty?.toLowerCase() !== filterDifficulty) return false;
      return true;
    });
  }, [recipes, searchQuery, filterRating, filterDifficulty]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Saved Recipes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
            >
              <div className="animate-pulse">
                <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-3/4 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded" />
                  <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-5/6" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded-full w-20" />
                  <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded-full w-16" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <BookmarkIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-2">No saved recipes yet</h2>
        <p className="text-stone-600 dark:text-stone-400 mb-6">
          Start finding recipes and save your favorites!
        </p>
        <motion.button
          onClick={onBackToHome}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
        >
          Find Recipes
        </motion.button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Saved Recipes</h2>
          <span className="text-sm text-stone-600 dark:text-stone-400">
            {filteredRecipes.length} {filteredRecipes.length === 1 ? "recipe" : "recipes"}
          </span>
        </div>

      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes by name, description, or tag..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))}
            className="rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value={0}>All Ratings</option>
            <option value={5}>5 Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={3}>3+ Stars</option>
          </select>
          <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
            className="rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {(searchQuery || filterRating > 0 || filterDifficulty !== "all") && (
            <button onClick={() => { setSearchQuery(""); setFilterRating(0); setFilterDifficulty("all"); }}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">{recipe.name}</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3">{recipe.description}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {recipe.cook_time && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      <UsersIcon className="h-4 w-4" />
                      {recipe.servings} servings
                    </span>
                  )}
                </div>

                <Disclosure>
                  {({ open }) => (
                    <>
                      <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-stone-50 dark:bg-stone-900 px-4 py-2 text-left text-sm font-medium text-stone-900 dark:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors mb-2">
                        <span>Ingredients ({(recipe.ingredients || []).length})</span>
                        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDownIcon className="h-5 w-5 text-stone-600 dark:text-stone-400" />
                        </motion.div>
                      </DisclosureButton>
                      <AnimatePresence>
                        {open && (
                          <DisclosurePanel static as={motion.div}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mb-2 space-y-1 text-sm text-stone-700 dark:text-stone-200 max-h-48 overflow-y-auto">
                              {(recipe.ingredients || []).map((ingredient, idx) => (
                                <div key={idx} className="flex items-start gap-2 group/ing">
                                  <span className="text-orange-600">•</span>
                                  <span className="flex-1">
                                    {ingredient.amount && `${ingredient.amount} `}
                                    {ingredient.name}
                                  </span>
                                  <button
                                    onClick={() => handleSuggestSubstitutions(recipe, ingredient.name)}
                                    className="opacity-0 group-hover/ing:opacity-100 text-xs text-orange-500 hover:text-orange-700 transition-opacity flex-shrink-0"
                                    title="Find substitutions"
                                  >
                                    <ArrowPathIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </DisclosurePanel>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </Disclosure>

                <Disclosure>
                  {({ open }) => (
                    <>
                      <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-stone-50 dark:bg-stone-900 px-4 py-2 text-left text-sm font-medium text-stone-900 dark:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                        <span>Instructions</span>
                        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDownIcon className="h-5 w-5 text-stone-600 dark:text-stone-400" />
                        </motion.div>
                      </DisclosureButton>
                      <AnimatePresence>
                        {open && (
                          <DisclosurePanel static as={motion.div}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-2 text-sm text-stone-700 dark:text-stone-200">
                              {(recipe.steps || []).map((step, idx) => (
                                <div key={idx} className="flex gap-3">
                                  <span className="font-semibold text-orange-600 flex-shrink-0">{idx + 1}.</span>
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
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">Nutrition</h4>
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

                {/* Rating Section */}
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">Rating</h4>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        onClick={() => handleRate(recipe.id, star)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
                      >
                        {star <= (recipe.rating || 0) ? (
                          <StarIconSolid className="h-6 w-6 text-orange-500" />
                        ) : (
                          <StarIcon className="h-6 w-6 text-stone-300 hover:text-orange-300 transition-colors" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Notes</h4>
                    {recipe.notes && editingNoteId !== recipe.id && (
                      <motion.button
                        onClick={() => handleStartEditNote(recipe)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-orange-600 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded p-1"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>

                  {editingNoteId === recipe.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        placeholder="Add your notes about this recipe..."
                        rows={3}
                        className="w-full rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      />
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => handleSaveNote(recipe.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                        >
                          Save
                        </motion.button>
                        <motion.button
                          onClick={handleCancelEditNote}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 rounded-lg bg-stone-200 dark:bg-stone-700 px-3 py-2 text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 transition-colors"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  ) : recipe.notes ? (
                    <p className="text-sm text-stone-700 dark:text-stone-200 whitespace-pre-wrap">{recipe.notes}</p>
                  ) : (
                    <motion.button
                      onClick={() => handleStartEditNote(recipe)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-2 py-1"
                    >
                      Add note
                    </motion.button>
                  )}
                </div>

                {/* Tags Section */}
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(recipe.tags_json ? JSON.parse(recipe.tags_json) : []).map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                        <TagIcon className="h-3 w-3" />
                        {tag}
                        <button
                          onClick={() => {
                            const currentTags = recipe.tags_json ? JSON.parse(recipe.tags_json) : [];
                            const newTags = currentTags.filter(t => t !== tag);
                            updateSavedRecipe(recipe.id, { tags_json: JSON.stringify(newTags) });
                            setRecipes(recipes.map(r => r.id === recipe.id ? { ...r, tags_json: JSON.stringify(newTags) } : r));
                          }}
                          className="hover:text-orange-900"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {["Weeknight", "Meal Prep", "Date Night", "Quick", "Comfort Food", "Healthy", "Budget", "Special Occasion"]
                      .filter(tag => !(recipe.tags_json ? JSON.parse(recipe.tags_json) : []).includes(tag))
                      .map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            const currentTags = recipe.tags_json ? JSON.parse(recipe.tags_json) : [];
                            const newTags = [...currentTags, tag];
                            updateSavedRecipe(recipe.id, { tags_json: JSON.stringify(newTags) });
                            setRecipes(recipes.map(r => r.id === recipe.id ? { ...r, tags_json: JSON.stringify(newTags) } : r));
                          }}
                          className="rounded-full border border-dashed border-stone-300 dark:border-stone-600 px-2.5 py-1 text-xs text-stone-500 dark:text-stone-400 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-700 space-y-2">
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setCookingRecipe(recipe)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    <PlayIcon className="h-5 w-5" />
                    Cook
                  </motion.button>
                  <motion.button
                    onClick={async () => {
                      try {
                        const data = await shareRecipe(recipe.id);
                        await navigator.clipboard.writeText(window.location.origin + data.share_url);
                        toast.success("Share link copied to clipboard!");
                      } catch (err) {
                        toast.error("Failed to share recipe");
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <ShareIcon className="h-5 w-5" />
                    Share
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(recipe.id, recipe.name)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                    Delete
                  </motion.button>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setScalingRecipe(recipe)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                  >
                    <ArrowsPointingOutIcon className="h-4 w-4" />
                    Scale
                  </motion.button>
                  <motion.button
                    onClick={() => setPrintingRecipe(recipe)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                  >
                    <PrinterIcon className="h-4 w-4" />
                    Print
                  </motion.button>
                  <motion.button
                    onClick={() => handleEstimateCost(recipe)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                  >
                    <CurrencyDollarIcon className="h-4 w-4" />
                    {recipe.estimated_cost_cents ? `$${(recipe.estimated_cost_cents / 100).toFixed(2)}` : "Cost"}
                  </motion.button>
                  <motion.button
                    onClick={() => setVariationRecipe(recipe)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-200 transition-colors"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    Vary
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      </div>

      <CookingMode
        recipe={cookingRecipe}
        open={cookingRecipe !== null}
        onClose={() => {
          if (cookingRecipe) {
            handleLogCooking(cookingRecipe.id);
          }
          setCookingRecipe(null);
        }}
      />
      <RecipeScaler
        recipe={scalingRecipe}
        open={scalingRecipe !== null}
        onClose={() => setScalingRecipe(null)}
      />
      <RecipePrintView
        recipe={printingRecipe}
        open={printingRecipe !== null}
        onClose={() => setPrintingRecipe(null)}
      />
      <RecipeVariations
        recipe={variationRecipe}
        open={variationRecipe !== null}
        onClose={() => setVariationRecipe(null)}
        onVariationCreated={() => loadRecipes()}
      />
    </>
  );
}
