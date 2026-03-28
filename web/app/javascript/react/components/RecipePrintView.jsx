import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogPanel } from "@headlessui/react";
import { XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline";

export default function RecipePrintView({ recipe, open, onClose }) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={onClose} className="relative z-50">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 print:hidden" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogPanel className="bg-white dark:bg-stone-800 rounded-xl shadow-xl print:shadow-none print:rounded-none print:dark:bg-white">
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-stone-700 print:hidden">
                  <button onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
                    <PrinterIcon className="h-5 w-5" />
                    Print
                  </button>
                  <button onClick={onClose} className="rounded-full bg-stone-100 p-2 hover:bg-stone-200">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-8 print:p-0">
                  <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 print:text-stone-900 mb-2">{recipe?.name}</h1>
                  <p className="text-stone-600 dark:text-stone-400 print:text-stone-600 mb-4">{recipe?.description}</p>

                  <div className="flex gap-4 text-sm text-stone-500 dark:text-stone-400 print:text-stone-500 mb-6 border-b dark:border-stone-700 print:border-stone-200 pb-4">
                    {recipe?.cook_time && <span>Cook Time: {recipe.cook_time}</span>}
                    {recipe?.difficulty && <span>Difficulty: {recipe.difficulty}</span>}
                    {recipe?.servings && <span>Servings: {recipe.servings}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-stone-900 mb-3">Ingredients</h2>
                      <ul className="space-y-1.5">
                        {(recipe?.ingredients || []).map((ing, i) => (
                          <li key={i} className="text-sm">
                            {ing.amount && <span className="font-medium">{ing.amount} </span>}
                            {ing.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {recipe?.nutrition && (
                      <div>
                        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50 print:text-stone-900 mb-3">Nutrition</h2>
                        <div className="text-sm space-y-1">
                          {recipe.nutrition.calories && <p>Calories: {recipe.nutrition.calories}</p>}
                          {recipe.nutrition.protein && <p>Protein: {recipe.nutrition.protein}</p>}
                          {recipe.nutrition.carbs && <p>Carbs: {recipe.nutrition.carbs}</p>}
                          {recipe.nutrition.fat && <p>Fat: {recipe.nutrition.fat}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-stone-900 mb-3">Instructions</h2>
                    <ol className="space-y-3">
                      {(recipe?.steps || []).map((step, i) => (
                        <li key={i} className="text-sm flex gap-3">
                          <span className="font-bold text-orange-600 flex-shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
