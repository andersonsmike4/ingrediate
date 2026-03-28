import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function ShoppingList({ recipe, open, onClose }) {
  const missingIngredients = useMemo(
    () => recipe?.ingredients?.filter(ingredient => !ingredient.have) || [],
    [recipe?.ingredients]
  );

  const handleCopy = async () => {
    const text = missingIngredients
      .map(ingredient => `${ingredient.amount ? ingredient.amount + ' ' : ''}${ingredient.name}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Shopping list copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={onClose} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30"
          />

          <div className="fixed inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="pointer-events-auto w-screen max-w-md"
              >
                <DialogPanel className="flex h-full flex-col bg-white dark:bg-stone-800 shadow-xl">
                  <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-6">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-xl font-bold text-white">
                        Shopping List
                      </DialogTitle>
                      <motion.button
                        type="button"
                        onClick={onClose}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </motion.button>
                    </div>
                    {recipe?.name && (
                      <p className="mt-2 text-orange-100 text-sm">
                        For: {recipe.name}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    {missingIngredients.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <CheckIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-stone-900 dark:text-stone-50 mb-2">
                          You have everything!
                        </p>
                        <p className="text-stone-600 dark:text-stone-400">
                          No ingredients to buy for this recipe
                        </p>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                            Items to buy ({missingIngredients.length})
                          </h3>
                          <motion.button
                            onClick={handleCopy}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                            Copy All
                          </motion.button>
                        </div>

                        <div className="space-y-2">
                          {missingIngredients.map((ingredient, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="h-5 w-5 rounded-full border-2 border-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-stone-900">
                                    {ingredient.name}
                                  </p>
                                  {ingredient.amount && (
                                    <p className="text-sm text-orange-700 mt-0.5">
                                      {ingredient.amount}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-stone-200 px-6 py-4 bg-stone-50">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                    >
                      Done
                    </motion.button>
                  </div>
                </DialogPanel>
              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
