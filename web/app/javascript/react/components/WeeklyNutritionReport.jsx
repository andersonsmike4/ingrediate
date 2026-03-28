import React, { useState } from "react";
import { motion } from "framer-motion";
import { DocumentTextIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchWeeklyNutritionReport } from "../utils/api";
import { useAuth } from "./AuthContext";

export default function WeeklyNutritionReport() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error("Sign in to generate reports");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchWeeklyNutritionReport();
      setReport(data.report);
      toast.success("Report generated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <DocumentTextIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-900 mb-2">Sign in to view nutrition reports</h2>
        <p className="text-stone-600">Create an account to track your weekly nutrition</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Weekly Nutrition Report</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Analyze your nutrition and get personalized suggestions</p>
      </div>

      {/* Generate Button */}
      {!report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center"
        >
          <DocumentTextIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">Generate Your Weekly Report</h2>
          <p className="text-stone-600 mb-6">
            Get insights into your nutrition and personalized recipe suggestions
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                Generate Report
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center"
        >
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-stone-600">Analyzing your weekly nutrition...</p>
        </motion.div>
      )}

      {/* Report Display */}
      {report && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <button
            onClick={() => setReport(null)}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Generate new report
          </button>

          {/* Macro Rings */}
          {report.macros && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-6">Macro Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Object.entries(report.macros).map(([macro, data]) => {
                  const percentage = data.percentage || 0;
                  const color =
                    macro === "protein"
                      ? "text-blue-600"
                      : macro === "carbs"
                      ? "text-orange-600"
                      : "text-yellow-600";
                  const bgColor =
                    macro === "protein"
                      ? "text-blue-500"
                      : macro === "carbs"
                      ? "text-orange-500"
                      : "text-yellow-500";

                  return (
                    <div key={macro} className="text-center">
                      <div className="relative inline-flex items-center justify-center mb-3">
                        {/* Simple circular progress with CSS */}
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-stone-200"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className={bgColor}
                            strokeDasharray={`${(percentage / 100) * 351.86} 351.86`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute">
                          <div className={`text-3xl font-bold ${color}`}>{percentage}%</div>
                        </div>
                      </div>
                      <h3 className="font-bold text-stone-900 dark:text-stone-50 capitalize mb-1">{macro}</h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {data.grams}g / {data.target}g
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Goal Adherence */}
          {report.goal_adherence && Object.keys(report.goal_adherence).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-4">Goal Adherence</h2>
              <div className="space-y-4">
                {Object.entries(report.goal_adherence).map(([goal, percentage]) => (
                  <div key={goal}>
                    <div className="flex justify-between text-sm text-stone-700 dark:text-stone-200 mb-2">
                      <span className="font-medium capitalize">{goal.replace(/_/g, " ")}</span>
                      <span className="font-bold">{percentage}%</span>
                    </div>
                    <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          percentage >= 80
                            ? "bg-green-500"
                            : percentage >= 50
                            ? "bg-orange-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutritional Gaps */}
          {report.gaps && report.gaps.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-stone-900">Nutritional Gaps</h2>
              </div>
              <ul className="space-y-3">
                {report.gaps.map((gap, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-orange-500 flex-shrink-0 mt-1">•</span>
                    <div>
                      <p className="text-stone-900 font-medium">{gap.nutrient}</p>
                      {gap.suggestion && (
                        <p className="text-sm text-stone-600">{gap.suggestion}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Recipes */}
          {report.suggested_recipes && report.suggested_recipes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-bold text-stone-900">Suggested Recipes</h2>
              </div>
              <p className="text-sm text-stone-600 mb-4">
                These recipes can help fill your nutritional gaps
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.suggested_recipes.map((recipe, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border-2 border-orange-100 hover:border-orange-300 transition-colors"
                  >
                    <h3 className="font-bold text-stone-900 mb-2">{recipe.name}</h3>
                    <p className="text-sm text-stone-600 mb-3">{recipe.reason}</p>
                    {recipe.highlights && recipe.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {recipe.highlights.map((highlight, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Summary */}
          {report.summary && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200 p-6">
              <h2 className="text-xl font-bold text-stone-900 mb-3">Summary</h2>
              <p className="text-stone-700">{report.summary}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
