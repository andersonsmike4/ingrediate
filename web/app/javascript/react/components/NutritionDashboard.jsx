import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  fetchNutritionGoal,
  updateNutritionGoal,
  fetchMealPlans
} from "../utils/api";

const NUTRIENTS = [
  { key: "calories", label: "Calories", unit: "kcal", color: "bg-red-500", bgLight: "bg-red-100", text: "text-red-700" },
  { key: "protein", label: "Protein", unit: "g", color: "bg-blue-500", bgLight: "bg-blue-100", text: "text-blue-700" },
  { key: "carbs", label: "Carbs", unit: "g", color: "bg-orange-500", bgLight: "bg-orange-100", text: "text-orange-700" },
  { key: "fat", label: "Fat", unit: "g", color: "bg-purple-500", bgLight: "bg-purple-100", text: "text-purple-700" },
];

export default function NutritionDashboard() {
  const [goal, setGoal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ daily_calories: 2000, daily_protein: 50, daily_carbs: 250, daily_fat: 65 });
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalData, plans] = await Promise.all([
        fetchNutritionGoal(),
        fetchMealPlans()
      ]);
      if (goalData.nutrition_goal) {
        setGoal(goalData.nutrition_goal);
        setDraft({
          daily_calories: goalData.nutrition_goal.daily_calories || 2000,
          daily_protein: goalData.nutrition_goal.daily_protein || 50,
          daily_carbs: goalData.nutrition_goal.daily_carbs || 250,
          daily_fat: goalData.nutrition_goal.daily_fat || 65,
        });
      }
      if (plans.length > 0) setMealPlan(plans[0]);
    } catch (err) {
      toast.error("Failed to load nutrition data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    try {
      const data = await updateNutritionGoal(draft);
      setGoal(data.nutrition_goal);
      setEditing(false);
      toast.success("Nutrition goals saved!");
    } catch (err) {
      toast.error("Failed to save goals");
    }
  };

  const weeklyTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (!mealPlan?.meal_plan_entries) return totals;

    mealPlan.meal_plan_entries.forEach(entry => {
      const nutrition = entry.saved_recipe?.nutrition;
      if (!nutrition) return;
      totals.calories += parseFloat(nutrition.calories) || 0;
      totals.protein += parseFloat(String(nutrition.protein).replace(/[^\d.]/g, "")) || 0;
      totals.carbs += parseFloat(String(nutrition.carbs).replace(/[^\d.]/g, "")) || 0;
      totals.fat += parseFloat(String(nutrition.fat).replace(/[^\d.]/g, "")) || 0;
    });

    return totals;
  }, [mealPlan]);

  const dailyAvg = useMemo(() => ({
    calories: Math.round(weeklyTotals.calories / 7),
    protein: Math.round(weeklyTotals.protein / 7),
    carbs: Math.round(weeklyTotals.carbs / 7),
    fat: Math.round(weeklyTotals.fat / 7),
  }), [weeklyTotals]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Nutrition Dashboard</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4 animate-pulse">
              <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/2 mb-3" />
              <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded mb-2" />
              <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Nutrition Dashboard</h2>
        <motion.button
          onClick={() => setEditing(!editing)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          {editing ? "Cancel" : "Edit Goals"}
        </motion.button>
      </motion.div>

      {editing && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Daily Goals</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {NUTRIENTS.map(n => (
              <div key={n.key}>
                <label className="text-xs text-stone-500 dark:text-stone-400">{n.label} ({n.unit})</label>
                <input type="number" value={draft[`daily_${n.key}`]}
                  onChange={(e) => setDraft({ ...draft, [`daily_${n.key}`]: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
          </div>
          <button onClick={handleSaveGoals}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
            Save Goals
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {NUTRIENTS.map((n, idx) => {
          const goalVal = goal ? goal[`daily_${n.key}`] : draft[`daily_${n.key}`];
          const actual = dailyAvg[n.key];
          const pct = goalVal > 0 ? Math.min(100, Math.round((actual / goalVal) * 100)) : 0;
          return (
            <motion.div key={n.key}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4"
            >
              <p className={`text-xs font-semibold ${n.text} mb-1`}>{n.label}</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">{actual}<span className="text-sm text-stone-400 ml-1">{n.unit}</span></p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">of {goalVal} {n.unit} goal</p>
              <div className="h-2 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`h-full ${n.color} rounded-full`}
                />
              </div>
              <p className={`text-xs mt-1 ${pct > 100 ? 'text-red-600 font-semibold' : 'text-stone-400'}`}>{pct}%</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">Weekly Totals (from meal plan)</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          {NUTRIENTS.map(n => (
            <div key={n.key}>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-50">{Math.round(weeklyTotals[n.key])}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{n.label}</p>
            </div>
          ))}
        </div>
        {!mealPlan && (
          <p className="text-sm text-stone-400 text-center mt-3">Create a meal plan to see weekly nutrition data</p>
        )}
      </motion.div>
    </div>
  );
}
