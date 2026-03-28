import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClockIcon, FireIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchCookingLogs } from "../utils/api";

export default function CookingHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchCookingLogs();
      setLogs(data);
    } catch (err) {
      toast.error("Failed to load cooking history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Cooking History</h2>
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4 animate-pulse">
              <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/4" />
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
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Cooking History</h2>
        <span className="text-sm text-stone-600 dark:text-stone-400">{logs.length} entries</span>
      </motion.div>

      {logs.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12">
          <ClockIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">No cooking history yet</h3>
          <p className="text-stone-600 dark:text-stone-400">Use the "Cook" button on saved recipes to start tracking</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4 flex items-center justify-between hover:border-orange-200 dark:hover:border-orange-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2.5">
                  <FireIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                    {log.saved_recipe?.name || "Unknown Recipe"}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {log.saved_recipe?.difficulty && `${log.saved_recipe.difficulty} • `}
                    {log.saved_recipe?.cook_time || ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-orange-600">{formatDate(log.cooked_at)}</p>
                <p className="text-xs text-stone-400">
                  {new Date(log.cooked_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
