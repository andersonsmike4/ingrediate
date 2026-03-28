import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowsRightLeftIcon, MagnifyingGlassIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { fetchSubstitutionLogs, createSubstitutionLog } from "../utils/api";
import { useAuth } from "./AuthContext";

export default function SubstitutionHistory() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [original, setOriginal] = useState("");
  const [substitute, setSubstitute] = useState("");
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadLogs();
  }, [isAuthenticated]);

  const loadLogs = async () => {
    try {
      const data = await fetchSubstitutionLogs();
      setLogs(data.logs || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!original || !substitute) {
      toast.error("Original and substitute ingredients are required");
      return;
    }

    setSubmitting(true);
    try {
      await createSubstitutionLog({
        original_ingredient: original,
        substitute_ingredient: substitute,
        rating,
        notes
      });
      toast.success("Substitution logged!");
      setOriginal("");
      setSubstitute("");
      setRating(3);
      setNotes("");
      setShowForm(false);
      await loadLogs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <ArrowsRightLeftIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-900 mb-2">Sign in to track substitutions</h2>
        <p className="text-stone-600">Create an account to save your ingredient substitution knowledge</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-stone-600">Loading substitutions...</p>
      </div>
    );
  }

  const filteredLogs = search
    ? logs.filter(
        (log) =>
          log.original_ingredient?.toLowerCase().includes(search.toLowerCase()) ||
          log.substitute_ingredient?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Substitution History</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Your ingredient substitution knowledge base</p>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search substitutions..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors whitespace-nowrap"
        >
          {showForm ? "Cancel" : "Add Substitution"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Original Ingredient</label>
                <input
                  type="text"
                  value={original}
                  onChange={(e) => setOriginal(e.target.value)}
                  required
                  placeholder="e.g., butter"
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Substitute</label>
                <input
                  type="text"
                  value={substitute}
                  onChange={(e) => setSubstitute(e.target.value)}
                  required
                  placeholder="e.g., coconut oil"
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    {star <= rating ? (
                      <StarSolid className="h-8 w-8 text-yellow-500" />
                    ) : (
                      <StarIcon className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="How did it work? Any tips?"
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {submitting ? "Logging..." : "Log Substitution"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Substitutions List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
            <ArrowsRightLeftIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
            <p className="text-stone-600">
              {search ? "No substitutions found" : "No substitutions logged yet"}
            </p>
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <motion.div
              key={log.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-bold text-stone-900">{log.original_ingredient}</span>
                  <ArrowsRightLeftIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <span className="font-bold text-orange-600">{log.substitute_ingredient}</span>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, idx) => (
                    <StarSolid
                      key={idx}
                      className={`h-4 w-4 ${
                        idx < (log.rating || 0) ? "text-yellow-500" : "text-stone-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {log.notes && <p className="text-sm text-stone-600 mb-2">{log.notes}</p>}

              <div className="text-xs text-stone-500">
                {log.created_at && new Date(log.created_at).toLocaleDateString()}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
