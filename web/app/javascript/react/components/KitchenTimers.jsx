import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClockIcon, PlayIcon, PauseIcon, ArrowPathIcon, XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchSavedRecipes, generateTimeline } from "../utils/api";

export default function KitchenTimers() {
  const [timers, setTimers] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [newTimerName, setNewTimerName] = useState("");
  const [newTimerMinutes, setNewTimerMinutes] = useState("");

  // Timeline state
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
  const [timeline, setTimeline] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const data = await fetchSavedRecipes();
        setRecipes(data);
      } catch (err) {
        console.error("Failed to load recipes:", err);
      }
    };
    loadRecipes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers =>
        prevTimers.map(timer => {
          if (!timer.running || timer.remaining <= 0) return timer;

          const newRemaining = timer.remaining - 1;

          if (newRemaining === 0) {
            // Timer complete
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Timer Complete!", {
                body: `${timer.name} is done!`,
                icon: "/favicon.ico"
              });
            }
            toast.success(`Timer "${timer.name}" completed!`);
            return { ...timer, remaining: 0, running: false };
          }

          return { ...timer, remaining: newRemaining };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const addTimer = (e) => {
    e.preventDefault();
    if (!newTimerName || !newTimerMinutes) {
      toast.error("Name and duration are required");
      return;
    }

    const minutes = parseInt(newTimerMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }

    requestNotificationPermission();

    setTimers([
      ...timers,
      {
        id: nextId,
        name: newTimerName,
        totalSeconds: minutes * 60,
        remaining: minutes * 60,
        running: false
      }
    ]);
    setNextId(nextId + 1);
    setNewTimerName("");
    setNewTimerMinutes("");
    toast.success("Timer added");
  };

  const startTimer = (id) => {
    setTimers(timers.map(t => t.id === id ? { ...t, running: true } : t));
  };

  const pauseTimer = (id) => {
    setTimers(timers.map(t => t.id === id ? { ...t, running: false } : t));
  };

  const resetTimer = (id) => {
    setTimers(timers.map(t => t.id === id ? { ...t, remaining: t.totalSeconds, running: false } : t));
  };

  const removeTimer = (id) => {
    setTimers(timers.filter(t => t.id !== id));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGenerateTimeline = async () => {
    if (selectedRecipeIds.length === 0) {
      toast.error("Select at least one recipe");
      return;
    }

    setLoadingTimeline(true);
    try {
      const data = await generateTimeline(selectedRecipeIds);
      setTimeline(data.timeline);
      toast.success("Timeline generated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const toggleRecipeSelection = (id) => {
    if (selectedRecipeIds.includes(id)) {
      setSelectedRecipeIds(selectedRecipeIds.filter(rid => rid !== id));
    } else {
      setSelectedRecipeIds([...selectedRecipeIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Kitchen Timers</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Manage multiple timers and optimize your cooking timeline</p>
      </div>

      {/* Add Timer Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <h2 className="font-bold text-stone-900 dark:text-stone-50 mb-4">Add Timer</h2>
        <form onSubmit={addTimer} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newTimerName}
            onChange={(e) => setNewTimerName(e.target.value)}
            placeholder="Timer name (e.g., Pasta)"
            className="flex-1 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          />
          <input
            type="number"
            value={newTimerMinutes}
            onChange={(e) => setNewTimerMinutes(e.target.value)}
            placeholder="Minutes"
            min="1"
            className="w-full sm:w-32 px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors whitespace-nowrap"
          >
            Add Timer
          </button>
        </form>
      </motion.div>

      {/* Active Timers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {timers.map((timer) => {
            const percentage = (timer.remaining / timer.totalSeconds) * 100;
            const isComplete = timer.remaining === 0;

            return (
              <motion.div
                key={timer.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white dark:bg-stone-800 rounded-2xl shadow-sm border p-6 ${
                  isComplete ? "border-green-500 ring-2 ring-green-200" : "border-orange-100 dark:border-stone-700"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-stone-900 dark:text-stone-50">{timer.name}</h3>
                  <button
                    onClick={() => removeTimer(timer.id)}
                    className="text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Circular Timer Display */}
                <div className="relative mx-auto w-32 h-32 mb-4">
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
                      className={isComplete ? "text-green-500" : "text-orange-500"}
                      strokeDasharray={`${(percentage / 100) * 351.86} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-2xl font-bold ${isComplete ? "text-green-600" : "text-stone-900 dark:text-stone-50"}`}>
                      {formatTime(timer.remaining)}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  {!timer.running ? (
                    <button
                      onClick={() => startTimer(timer.id)}
                      disabled={isComplete}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      <PlayIcon className="h-4 w-4" />
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={() => pauseTimer(timer.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                    >
                      <PauseIcon className="h-4 w-4" />
                      Pause
                    </button>
                  )}
                  <button
                    onClick={() => resetTimer(timer.id)}
                    className="px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {timers.length === 0 && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
          <ClockIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
          <p className="text-stone-600 dark:text-stone-400">No active timers</p>
        </div>
      )}

      {/* AI Timeline Generator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50">AI Cooking Timeline</h2>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          Select recipes to generate an optimized cooking timeline
        </p>

        {recipes.length === 0 ? (
          <p className="text-stone-500 dark:text-stone-400 text-center py-4">No saved recipes to generate timeline</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {recipes.slice(0, 6).map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => toggleRecipeSelection(recipe.id)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    selectedRecipeIds.includes(recipe.id)
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30"
                      : "border-stone-200 dark:border-stone-700 hover:border-orange-200"
                  }`}
                >
                  <h4 className="font-medium text-stone-900 dark:text-stone-50 text-sm">{recipe.name}</h4>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateTimeline}
              disabled={loadingTimeline || selectedRecipeIds.length === 0}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {loadingTimeline ? "Generating..." : "Generate Timeline"}
            </button>
          </>
        )}

        {/* Timeline Display */}
        {timeline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-6 border-t border-stone-200"
          >
            <h3 className="font-bold text-stone-900 dark:text-stone-50 mb-4">Your Optimized Timeline</h3>
            <div className="space-y-4">
              {timeline.steps?.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-20 font-mono text-sm text-orange-600 font-medium">
                    {step.time || `Step ${i + 1}`}
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-900 dark:text-stone-100 font-medium">{step.action}</p>
                    {step.recipe && (
                      <p className="text-sm text-stone-500 dark:text-stone-400">{step.recipe}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {timeline.tips && timeline.tips.length > 0 && (
              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <h4 className="font-bold text-stone-900 dark:text-stone-50 mb-2">Pro Tips</h4>
                <ul className="space-y-1">
                  {timeline.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-stone-700 dark:text-stone-200 flex gap-2">
                      <span className="text-orange-500">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
