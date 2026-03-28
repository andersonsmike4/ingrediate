import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function RecipeScaler({ recipe, open, onClose }) {
  const originalServings = recipe?.servings || 4;
  const [targetServings, setTargetServings] = useState(originalServings);

  const scaleFactor = targetServings / originalServings;

  const scaledIngredients = useMemo(() => {
    if (!recipe?.ingredients) return [];
    return recipe.ingredients.map(ingredient => {
      const amount = ingredient.amount || "";
      // Try to extract number from amount string
      const match = amount.match(/^([\d.\/]+)\s*(.*)/);
      if (!match) return { ...ingredient, scaledAmount: amount };

      let num = match[1];
      const unit = match[2];

      // Handle fractions
      if (num.includes("/")) {
        const parts = num.split("/");
        num = parseFloat(parts[0]) / parseFloat(parts[1]);
      } else {
        num = parseFloat(num);
      }

      if (isNaN(num)) return { ...ingredient, scaledAmount: amount };

      const scaled = num * scaleFactor;
      const rounded = Math.round(scaled * 100) / 100;
      // Format nicely
      const display = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
      return { ...ingredient, scaledAmount: `${display} ${unit}`.trim() };
    });
  }, [recipe?.ingredients, scaleFactor]);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={onClose} className="relative z-50">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}>
              <DialogPanel className="w-full max-w-md bg-white dark:bg-stone-800 rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold text-white">Scale Recipe</DialogTitle>
                  <button onClick={onClose} className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-4">{recipe?.name}</h3>

                  <div className="flex items-center justify-center gap-4 mb-6">
                    <motion.button
                      onClick={() => setTargetServings(Math.max(1, targetServings - 1))}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="rounded-full bg-orange-100 p-2 text-orange-700 hover:bg-orange-200"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </motion.button>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{targetServings}</div>
                      <div className="text-sm text-stone-500 dark:text-stone-400">servings</div>
                    </div>
                    <motion.button
                      onClick={() => setTargetServings(targetServings + 1)}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="rounded-full bg-orange-100 p-2 text-orange-700 hover:bg-orange-200"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </motion.button>
                  </div>

                  {scaleFactor !== 1 && (
                    <p className="text-center text-sm text-stone-500 dark:text-stone-400 mb-4">
                      {scaleFactor > 1 ? `${scaleFactor.toFixed(1)}x` : `${scaleFactor.toFixed(1)}x`} original recipe
                    </p>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {scaledIngredients.map((ingredient, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg px-3 py-2">
                        <span className="text-sm font-medium text-orange-700 min-w-[80px]">
                          {ingredient.scaledAmount}
                        </span>
                        <span className="text-sm text-stone-700 dark:text-stone-200">{ingredient.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-4 bg-stone-50 dark:bg-stone-900 border-t dark:border-stone-700">
                  <button onClick={onClose}
                    className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors">
                    Done
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
