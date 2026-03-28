import React, { useState } from "react";
import { motion } from "framer-motion";
import { SparklesIcon, CalendarDaysIcon, ArchiveBoxIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { generateMealPrep } from "../utils/api";

export default function MealPrepAssistant() {
  const [schedule, setSchedule] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const handleGenerate = async () => {
    if (!schedule.trim()) {
      toast.error("Please describe your schedule");
      return;
    }

    setLoading(true);
    try {
      const data = await generateMealPrep(schedule);
      setPlan(data.plan);
      toast.success("Meal prep plan generated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Meal Prep Assistant</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Get a personalized meal prep plan for your week</p>
      </div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Describe your week
        </label>
        <textarea
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          placeholder="E.g., Busy week with work, dinner party on Friday, want to meal prep on Sunday for the week ahead..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              Generate Plan
            </>
          )}
        </button>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center"
        >
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-stone-600">Creating your personalized meal prep plan...</p>
        </motion.div>
      )}

      {/* Plan Display */}
      {plan && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Prep Day Timeline */}
          {plan.prep_timeline && plan.prep_timeline.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDaysIcon className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-stone-900">Prep Day Timeline</h2>
              </div>
              <ol className="space-y-3">
                {plan.prep_timeline.map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-shrink-0 font-mono text-sm text-orange-600 font-medium">
                      {item.time || `${i + 1}.`}
                    </span>
                    <span className="text-stone-700">{item.task || item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Storage Instructions */}
          {plan.storage_instructions && plan.storage_instructions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArchiveBoxIcon className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-stone-900">Storage Instructions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-stone-700">Item</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-stone-700">Container</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-stone-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.storage_instructions.map((item, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="py-2 px-3 text-sm text-stone-700">{item.item || item.name}</td>
                        <td className="py-2 px-3 text-sm text-stone-600">{item.container}</td>
                        <td className="py-2 px-3 text-sm text-stone-600">{item.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weekly Schedule */}
          {plan.weekly_schedule && Object.keys(plan.weekly_schedule).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <h2 className="text-xl font-bold text-stone-900 mb-4">Weekly Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(plan.weekly_schedule).map(([day, meals]) => (
                  <div key={day} className="bg-orange-50 rounded-xl p-4">
                    <h3 className="font-bold text-orange-900 mb-2">{day}</h3>
                    <ul className="text-sm text-stone-700 space-y-1">
                      {Array.isArray(meals) ? (
                        meals.map((meal, i) => (
                          <li key={i}>• {meal}</li>
                        ))
                      ) : (
                        <li>{meals}</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {plan.tips && plan.tips.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <LightBulbIcon className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-stone-900">Pro Tips</h2>
              </div>
              <ul className="space-y-2">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-stone-700">
                    <span className="text-orange-500 flex-shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!plan && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center"
        >
          <SparklesIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Your meal prep plan will appear here</h2>
          <p className="text-stone-600">Describe your schedule above and click generate to get started</p>
        </motion.div>
      )}
    </div>
  );
}
