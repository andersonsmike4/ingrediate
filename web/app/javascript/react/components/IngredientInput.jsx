import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { generateRecipes } from "../utils/api";
import { DEFAULT_FILTERS, FILTER_OPTIONS } from "../utils/recipe";

export default function IngredientInput({ prefilled = "", onResults, onSearch }) {
  const [ingredients, setIngredients] = useState(prefilled);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    if (prefilled) {
      setIngredients(prefilled);
    }
  }, [prefilled]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ingredients.trim()) {
      toast.error("Please enter some ingredients");
      return;
    }

    setLoading(true);
    if (onSearch) onSearch(ingredients, filters);

    try {
      const recipes = await generateRecipes(ingredients, filters);
      onResults(recipes);
      toast.success("Found recipes for you!");
    } catch (err) {
      console.error("Error generating recipes:", err);
      toast.error("Failed to generate recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-800 rounded-xl shadow-sm dark:shadow-none border border-orange-100 dark:border-stone-700 overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="ingredients" className="block text-sm font-medium text-stone-900 dark:text-stone-50 mb-2">
            Your Ingredients
          </label>
          <textarea
            id="ingredients"
            rows={6}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="List your ingredients (e.g. chicken, garlic, olive oil, pasta)"
            className="w-full rounded-lg border-stone-300 dark:border-stone-600 border px-4 py-3 text-stone-900 dark:text-stone-100 dark:bg-stone-900 placeholder-stone-400 focus:border-orange-500 focus:ring-orange-500 focus:ring-2 focus:outline-none transition-shadow"
          />
        </div>

        <Disclosure>
          {({ open }) => (
            <>
              <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-900/30 px-4 py-3 text-left text-sm font-medium text-orange-900 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                <span>Filter Options</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDownIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
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
                    <div className="pt-4 space-y-4">
                      {FILTER_OPTIONS.map((filter) => (
                        <div key={filter.key}>
                          <label className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                            {filter.label}
                          </label>
                          <select
                            value={filters[filter.key]}
                            onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
                            className="w-full rounded-lg border-stone-300 dark:border-stone-600 border px-4 py-2 text-stone-900 dark:text-stone-100 dark:bg-stone-900 focus:border-orange-500 focus:ring-orange-500 focus:ring-2 focus:outline-none"
                          >
                            {filter.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </DisclosurePanel>
                )}
              </AnimatePresence>
            </>
          )}
        </Disclosure>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </motion.svg>
              Generating Recipes...
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="h-5 w-5" />
              Find Recipes
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
