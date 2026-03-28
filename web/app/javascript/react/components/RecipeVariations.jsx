import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { csrfToken } from "../utils/csrf";

const PRESETS = [
  { label: "Make it healthier", modifier: "Make this recipe healthier - reduce calories, increase vegetables, use whole grains where possible" },
  { label: "Make it faster", modifier: "Make this recipe faster - simplify steps, reduce cook time to under 20 minutes, use shortcuts" },
  { label: "Make it cheaper", modifier: "Make this recipe cheaper - substitute expensive ingredients with budget-friendly alternatives" },
  { label: "Make it vegan", modifier: "Make this recipe completely vegan - replace all animal products with plant-based alternatives" },
  { label: "Make it low-carb", modifier: "Make this recipe low-carb/keto - reduce carbs to under 20g per serving" },
  { label: "Make it kid-friendly", modifier: "Make this recipe kid-friendly - milder flavors, fun presentation, familiar textures" },
];

export default function RecipeVariations({ recipe, open, onClose, onVariationCreated }) {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customModifier, setCustomModifier] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const modifier = selectedPreset || customModifier;
    if (!modifier.trim()) {
      toast.error("Please select a preset or enter a custom modification");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/recipes/saved/${recipe.id}/variation`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ modifier })
      });
      if (!response.ok) throw new Error("Failed to create variation");
      const data = await response.json();
      toast.success(`Created "${data.recipe.name}"!`);
      if (onVariationCreated) onVariationCreated(data.recipe);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create variation");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPreset(null);
    setCustomModifier("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={handleClose} className="relative z-50">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}>
              <DialogPanel className="w-full max-w-lg bg-white dark:bg-stone-800 rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5" />
                    Create Variation
                  </DialogTitle>
                  <button onClick={handleClose} className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Modifying:</p>
                    <p className="font-semibold text-stone-900 dark:text-stone-50">{recipe?.name}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">Quick presets</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESETS.map((preset) => (
                        <motion.button
                          key={preset.label}
                          onClick={() => {
                            setSelectedPreset(selectedPreset === preset.modifier ? null : preset.modifier);
                            setCustomModifier("");
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                            selectedPreset === preset.modifier
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium"
                              : "border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-stone-700"
                          }`}
                        >
                          {preset.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">Or describe your own</p>
                    <textarea
                      value={customModifier}
                      onChange={(e) => {
                        setCustomModifier(e.target.value);
                        setSelectedPreset(null);
                      }}
                      placeholder="e.g., Make it spicier with Thai flavors, or double the protein..."
                      rows={2}
                      className="w-full rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-stone-50 dark:bg-stone-900 border-t dark:border-stone-700 flex gap-3">
                  <motion.button
                    onClick={handleGenerate}
                    disabled={loading || (!selectedPreset && !customModifier.trim())}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4" />
                        Generate Variation
                      </>
                    )}
                  </motion.button>
                  <button onClick={handleClose}
                    className="rounded-lg bg-stone-200 dark:bg-stone-700 px-4 py-2.5 text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors">
                    Cancel
                  </button>
                </div>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
