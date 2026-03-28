import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BoltIcon, TrophyIcon, FireIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchTodayChallenge, submitChallenge, fetchChallengeHistory } from "../utils/api";
import { useAuth } from "./AuthContext";

export default function DailyChallenge() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [todayData, historyData] = await Promise.all([
        fetchTodayChallenge(),
        fetchChallengeHistory()
      ]);
      setToday({ ...todayData.challenge, completed: todayData.submitted, submission: todayData.submission });
      setHistory(historyData.history || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!today?.id) return;

    setSubmitting(true);
    try {
      await submitChallenge(today.id, notes);
      toast.success("Challenge completed!");
      setNotes("");
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <BoltIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-900 mb-2">Sign in to take challenges</h2>
        <p className="text-stone-600">Create an account to participate in daily cooking challenges</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-stone-600">Loading challenge...</p>
      </div>
    );
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-orange-100 text-orange-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-stone-100 text-stone-700";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Daily Challenge</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Test your cooking skills with today's challenge</p>
      </div>

      {/* Today's Challenge */}
      {today && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BoltIcon className="h-8 w-8" />
              </div>
              <div>
                <div className="text-sm opacity-90">Today's Challenge</div>
                <div className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
            {today.difficulty && (
              <span className={`px-4 py-2 rounded-xl font-medium text-sm ${getDifficultyColor(today.difficulty)} bg-white/90`}>
                {today.difficulty}
              </span>
            )}
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-4"
          >
            {today.title || today.challenge_text}
          </motion.h2>

          {today.description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg opacity-90"
            >
              {today.description}
            </motion.p>
          )}

          {today.completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 flex items-center gap-2 text-green-300"
            >
              <TrophyIcon className="h-5 w-5" />
              <span className="font-medium">Completed!</span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Tips */}
      {today?.tips && today.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6"
        >
          <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
            <FireIcon className="h-5 w-5 text-orange-600" />
            Tips
          </h3>
          <ul className="space-y-2">
            {today.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-stone-700">
                <span className="text-orange-500 flex-shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Submit Form */}
      {today && !today.completed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6"
        >
          <h3 className="font-bold text-stone-900 mb-4">Complete Challenge</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Tell us about what you cooked
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Share your experience, what you learned, or any modifications you made..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Complete Challenge"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Challenge History */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-900">Challenge History</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            {showHistory ? "Hide" : "Show"}
          </button>
        </div>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {history.length === 0 ? (
                <p className="text-stone-500 text-center py-4">No completed challenges yet</p>
              ) : (
                history.map((entry, i) => (
                  <motion.div
                    key={entry.challenge?.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl border border-stone-200 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-stone-900">{entry.challenge?.challenge_text}</h4>
                        {entry.submission?.completed_at && (
                          <p className="text-xs text-stone-500 mt-1">
                            Completed {new Date(entry.submission.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {entry.submission?.notes && (
                      <p className="text-sm text-stone-600 mt-2">{entry.submission.notes}</p>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
