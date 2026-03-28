import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  PlusIcon,
  XMarkIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  fetchMealPlans,
  createMealPlan,
  fetchSavedRecipes,
  addMealPlanEntry,
  removeMealPlanEntry,
} from "../utils/api";
import { csrfToken } from "../utils/csrf";

const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function isToday(dateStr) {
  return dateStr === toISODate(new Date());
}

export default function MealPlanner() {
  const [mealPlan, setMealPlan] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [numDays, setNumDays] = useState(7);
  const [eatingOutSlot, setEatingOutSlot] = useState(null);
  const [eatingOutNote, setEatingOutNote] = useState("Eating out");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plans, recipes] = await Promise.all([
        fetchMealPlans(),
        fetchSavedRecipes(),
      ]);
      setSavedRecipes(recipes);
      setMealPlan(plans.length > 0 ? plans[0] : null);
    } catch (err) {
      toast.error("Failed to load meal planner");
    } finally {
      setLoading(false);
    }
  };

  const dates = useMemo(() => {
    if (!mealPlan?.start_date) return [];
    const result = [];
    const start = mealPlan.start_date;
    const end = mealPlan.end_date;
    let current = start;
    while (current <= end) {
      result.push(current);
      current = addDays(current, 1);
    }
    return result;
  }, [mealPlan?.start_date, mealPlan?.end_date]);

  const handleCreateMealPlan = async () => {
    try {
      const startDate = toISODate(getMondayOf(new Date()));
      const data = await createMealPlan(null, startDate, numDays);
      setMealPlan({ ...(data.meal_plan || data), meal_plan_entries: [] });
      toast.success("Meal plan created!");
    } catch (err) {
      toast.error("Failed to create meal plan");
    }
  };

  const handleAddRecipe = async (date, mealType, recipeId) => {
    if (!mealPlan) return;
    try {
      const data = await addMealPlanEntry(mealPlan.id, {
        date,
        mealType,
        savedRecipeId: recipeId,
      });
      const entry = data.entry || data;
      setMealPlan((prev) => {
        const filtered = (prev.meal_plan_entries || []).filter(
          (e) => !(e.date === date && e.meal_type === mealType)
        );
        return { ...prev, meal_plan_entries: [...filtered, entry] };
      });
      toast.success("Recipe added!");
    } catch (err) {
      toast.error("Failed to add recipe");
    }
  };

  const handleEatingOut = async (date, mealType, note) => {
    if (!mealPlan) return;
    try {
      const data = await addMealPlanEntry(mealPlan.id, {
        date,
        mealType,
        eatingOut: true,
        note: note || "Eating out",
      });
      const entry = data.entry || data;
      setMealPlan((prev) => {
        const filtered = (prev.meal_plan_entries || []).filter(
          (e) => !(e.date === date && e.meal_type === mealType)
        );
        return { ...prev, meal_plan_entries: [...filtered, entry] };
      });
      setEatingOutSlot(null);
      setEatingOutNote("Eating out");
      toast.success("Marked as eating out");
    } catch (err) {
      toast.error("Failed to mark as eating out");
    }
  };

  const handleRemoveEntry = async (entryId) => {
    if (!mealPlan) return;
    try {
      await removeMealPlanEntry(mealPlan.id, entryId);
      setMealPlan((prev) => ({
        ...prev,
        meal_plan_entries: prev.meal_plan_entries.filter((e) => e.id !== entryId),
      }));
      toast.success("Removed");
    } catch (err) {
      toast.error("Failed to remove");
    }
  };

  const handleAutoGenerate = async () => {
    setAutoGenerating(true);
    try {
      const response = await fetch("/api/meal_plans/auto_generate", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to auto-generate");
      }
      const data = await response.json();
      const plan = data.meal_plan;
      if (plan.meal_plan_entries) {
        plan.meal_plan_entries = plan.meal_plan_entries.map((entry) => ({
          ...entry,
          saved_recipe: entry.saved_recipe
            ? {
                ...entry.saved_recipe,
                ingredients: entry.saved_recipe.ingredients_json
                  ? JSON.parse(entry.saved_recipe.ingredients_json)
                  : [],
              }
            : null,
        }));
      }
      setMealPlan(plan);
      toast.success(`Meal plan generated! ${data.entries_created} meals added.`);
    } catch (err) {
      toast.error(err.message || "Failed to auto-generate");
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleShiftWeek = (direction) => {
    if (!mealPlan) return;
    const shift = direction * 7;
    const newStart = addDays(mealPlan.start_date, shift);
    const newEnd = addDays(mealPlan.end_date, shift);
    setMealPlan((prev) => ({ ...prev, start_date: newStart, end_date: newEnd }));
  };

  const handleExtendPlan = async (days) => {
    if (!mealPlan) return;
    const newEnd = addDays(mealPlan.end_date, days);
    setMealPlan((prev) => ({ ...prev, end_date: newEnd }));
    toast.success(`Extended plan by ${days} days`);
  };

  const getEntryForSlot = (date, mealType) => {
    if (!mealPlan?.meal_plan_entries) return null;
    return mealPlan.meal_plan_entries.find(
      (e) => e.date === date && e.meal_type === mealType
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Meal Planner</h2>
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded w-1/4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-stone-200 dark:bg-stone-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
        <CalendarDaysIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-2">No meal plan yet</h2>
        <p className="text-stone-600 dark:text-stone-400 mb-6">Create a meal plan to organize your meals</p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <label className="text-sm text-stone-700 dark:text-stone-200 font-medium">Plan duration:</label>
          <select
            value={numDays}
            onChange={(e) => setNumDays(Number(e.target.value))}
            className="rounded-lg border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          >
            <option value={7}>1 Week</option>
            <option value={14}>2 Weeks</option>
            <option value={21}>3 Weeks</option>
            <option value={28}>4 Weeks</option>
          </select>
        </div>

        <motion.button
          onClick={handleCreateMealPlan}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Meal Plan
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Meal Planner</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {formatDateShort(mealPlan.start_date)} — {formatDateShort(mealPlan.end_date)}
            <span className="ml-2 text-stone-400">({dates.length} days)</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center rounded-lg border border-stone-200 dark:border-stone-600">
            <button onClick={() => handleShiftWeek(-1)} className="p-2 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-l-lg transition-colors">
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const monday = toISODate(getMondayOf(new Date()));
                const diff = dates.length - 1;
                setMealPlan((prev) => ({ ...prev, start_date: monday, end_date: addDays(monday, diff) }));
              }}
              className="px-3 py-1.5 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
            >
              This Week
            </button>
            <button onClick={() => handleShiftWeek(1)} className="p-2 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-r-lg transition-colors">
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => handleExtendPlan(7)}
            className="px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            + Week
          </button>

          <motion.button
            onClick={handleAutoGenerate}
            disabled={autoGenerating || savedRecipes.length === 0}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
          >
            <SparklesIcon className={`h-4 w-4 ${autoGenerating ? "animate-spin" : ""}`} />
            {autoGenerating ? "Generating..." : "Auto-Fill"}
          </motion.button>
        </div>
      </div>

      {savedRecipes.length === 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-800">
            Save some recipes first to add them to your meal plan.
          </p>
        </div>
      )}

      {/* Eating out modal */}
      <AnimatePresence>
        {eatingOutSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setEatingOutSlot(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-1">Eating Out</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                {formatDate(eatingOutSlot.date)} — {eatingOutSlot.mealType}
              </p>
              <input
                type="text"
                value={eatingOutNote}
                onChange={(e) => setEatingOutNote(e.target.value)}
                placeholder="e.g., Pizza night, Birthday dinner"
                className="w-full px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEatingOut(eatingOutSlot.date, eatingOutSlot.mealType, eatingOutNote);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEatingOutSlot(null)}
                  className="flex-1 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-600 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEatingOut(eatingOutSlot.date, eatingOutSlot.mealType, eatingOutNote)}
                  className="flex-1 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day cards */}
      <div className="space-y-4">
        {dates.map((date, i) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className={`bg-white dark:bg-stone-800 rounded-xl shadow-sm border ${
              isToday(date) ? "border-orange-400 ring-2 ring-orange-100" : "border-orange-100 dark:border-stone-700"
            } overflow-hidden`}
          >
            <div className={`px-4 py-2.5 flex items-center justify-between ${
              isToday(date) ? "bg-orange-50 dark:bg-orange-900/30" : "bg-stone-50 dark:bg-stone-900"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-stone-900 dark:text-stone-50">{getDayName(date)}</span>
                <span className="text-sm text-stone-500 dark:text-stone-400">{formatDateShort(date)}</span>
                {isToday(date) && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-medium">Today</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100 dark:divide-stone-700">
              {MEAL_TYPES.map((mealType) => {
                const entry = getEntryForSlot(date, mealType);
                return (
                  <div key={mealType} className="p-3">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{mealType}</p>
                    <MealSlot
                      entry={entry}
                      savedRecipes={savedRecipes}
                      onAddRecipe={(recipeId) => handleAddRecipe(date, mealType, recipeId)}
                      onEatingOut={() => setEatingOutSlot({ date, mealType })}
                      onRemove={() => entry && handleRemoveEntry(entry.id)}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MealSlot({ entry, savedRecipes, onAddRecipe, onEatingOut, onRemove }) {
  // Eating out entry
  if (entry && !entry.saved_recipe_id && entry.note) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <BuildingStorefrontIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm font-medium text-blue-800 truncate">{entry.note}</p>
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    );
  }

  // Recipe entry
  if (entry?.saved_recipe) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-center justify-between group"
      >
        <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate pr-2">{entry.saved_recipe.name}</p>
        <button
          onClick={onRemove}
          className="flex-shrink-0 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    );
  }

  // Empty slot — always show eating out button, recipe picker only if recipes exist
  return (
    <div className="flex flex-col gap-2">
      {savedRecipes.length > 0 ? (
        <Popover className="relative">
          <PopoverButton className="w-full border-2 border-dashed border-orange-300 rounded-lg p-2.5 flex items-center justify-center hover:bg-orange-50 hover:border-orange-400 transition-colors">
            <PlusIcon className="h-4 w-4 text-orange-600" />
            <span className="text-xs text-orange-700 ml-1 font-medium">Add Recipe</span>
          </PopoverButton>
          <PopoverPanel className="absolute z-10 mt-2 w-72 max-h-64 overflow-y-auto bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-orange-100 dark:border-stone-700">
            {({ close }) => (
              <div className="p-2">
                <p className="px-3 py-1.5 text-xs font-semibold text-stone-400 uppercase">Select a recipe</p>
                {savedRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => { onAddRecipe(recipe.id); close(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{recipe.name}</p>
                    {recipe.description && <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{recipe.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </PopoverPanel>
        </Popover>
      ) : (
        <div className="border-2 border-dashed border-stone-200 dark:border-stone-600 rounded-lg p-2.5 text-center">
          <p className="text-xs text-stone-400">No recipes saved</p>
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onEatingOut(); }}
        className="w-full border-2 border-dashed border-blue-300 rounded-lg p-2 flex items-center justify-center gap-1.5 hover:bg-blue-50 hover:border-blue-400 transition-colors"
        title="Eating out"
      >
        <BuildingStorefrontIcon className="h-4 w-4 text-blue-500" />
        <span className="text-xs text-blue-600 font-medium">Eating Out</span>
      </button>
    </div>
  );
}
