import React, { useState } from "react";
import { motion } from "framer-motion";
import { LinkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { importRecipeFromUrl } from "../utils/api";

export default function RecipeImport({ onImported }) {
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setImporting(true);
    try {
      const recipe = await importRecipeFromUrl(url.trim());
      toast.success(`Imported "${recipe.name}"!`);
      setUrl("");
      if (onImported) onImported(recipe);
    } catch (err) {
      toast.error(err.message || "Failed to import recipe");
    } finally {
      setImporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
    >
      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-3">Import Recipe from URL</h3>
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
        Paste a recipe URL from any website and we'll extract it for you
      </p>
      <form onSubmit={handleImport} className="flex gap-3">
        <div className="flex-1 relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/recipe..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={importing}
          />
        </div>
        <motion.button
          type="submit"
          disabled={importing || !url.trim()}
          whileHover={{ scale: importing ? 1 : 1.02 }}
          whileTap={{ scale: importing ? 1 : 0.98 }}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {importing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Importing...
            </>
          ) : "Import"}
        </motion.button>
      </form>
    </motion.div>
  );
}
