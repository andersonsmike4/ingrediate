import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import {
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BookmarkIcon,
  ShoppingCartIcon,
  ClockIcon,
  FireIcon,
  UsersIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { saveRecipe } from "../utils/api";
import { getDifficultyColor, NUTRITION_FIELDS } from "../utils/recipe";
import ShoppingList from "./ShoppingList";

export default function RecipeCard({ recipe, userIngredients }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);

  const missingCount = useMemo(
    () => recipe.ingredients?.filter(i => !i.have).length || 0,
    [recipe.ingredients]
  );

  const handleCloseShoppingList = useCallback(() => setShoppingListOpen(false), []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRecipe(recipe);
      setSaved(true);
      toast.success(`"${recipe.name}" saved!`);
    } catch (err) {
      console.error("Error saving recipe:", err);
      toast.error("Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  const substitutions = recipe.substitutions;
  const hasSubstitutions = Array.isArray(substitutions)
    ? substitutions.length > 0
    : substitutions && Object.keys(substitutions).length > 0;

  return (
    <>
      <motion.div
        layout
        whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(234, 88, 12, 0.1)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm dark:shadow-none border border-orange-100 dark:border-stone-700 overflow-hidden flex flex-col"
      >
        <div className="p-6 flex-1">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">{recipe.name}</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{recipe.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.cook_time && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-400">
                <ClockIcon className="h-4 w-4" />
                {recipe.cook_time}
              </span>
            )}
            {recipe.difficulty && (
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                <FireIcon className="h-4 w-4" />
                {recipe.difficulty}
              </span>
            )}
            {recipe.servings && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                <UsersIcon className="h-4 w-4" />
                {recipe.servings} servings
              </span>
            )}
          </div>

          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              Ingredients
              {missingCount > 0 && (
                <span className="ml-2 text-xs font-normal text-orange-600 dark:text-orange-400">
                  ({missingCount} to buy)
                </span>
              )}
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recipe.ingredients?.map((ingredient, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {ingredient.have ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={ingredient.have ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400"}>
                    {ingredient.amount && `${ingredient.amount} `}
                    {ingredient.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Disclosure>
            {({ open }) => (
              <>
                <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-stone-50 dark:bg-stone-900 px-4 py-2 text-left text-sm font-medium text-stone-900 dark:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                  <span>Instructions</span>
                  <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDownIcon className="h-5 w-5 text-stone-600 dark:text-stone-400" />
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
                      <div className="mt-2 space-y-2 text-sm text-stone-700 dark:text-stone-200">
                        {recipe.steps?.map((step, index) => (
                          <div key={index} className="flex gap-3">
                            <span className="font-semibold text-orange-600 dark:text-orange-400 flex-shrink-0">{index + 1}.</span>
                            <p>{step}</p>
                          </div>
                        ))}
                      </div>
                    </DisclosurePanel>
                  )}
                </AnimatePresence>
              </>
            )}
          </Disclosure>

          {recipe.nutrition && (
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">Nutrition (per serving)</h4>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {NUTRITION_FIELDS.map(({ key, label, color }) => (
                  recipe.nutrition[key] && (
                    <div key={key} className={`rounded-lg px-2 py-2 text-center ${color}`}>
                      <div className="font-bold">{recipe.nutrition[key]}</div>
                      <div className="opacity-75">{label}</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {hasSubstitutions && (
            <Disclosure as="div" className="mt-4">
              {({ open }) => (
                <>
                  <DisclosureButton className="flex w-full items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-900/30 px-4 py-2 text-left text-sm font-medium text-orange-900 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                    <span>Substitution Suggestions</span>
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
                        <div className="mt-2 space-y-2 text-sm">
                          {(Array.isArray(substitutions)
                            ? substitutions.map((sub, i) => (
                                <div key={i} className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3">
                                  <span className="font-medium text-orange-900 dark:text-orange-400">{sub.missing}:</span>{" "}
                                  <span className="text-orange-700 dark:text-orange-400">{sub.substitute}</span>
                                </div>
                              ))
                            : Object.entries(substitutions).map(([ingredient, subs], i) => (
                                <div key={i} className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3">
                                  <span className="font-medium text-orange-900 dark:text-orange-400">{ingredient}:</span>{" "}
                                  <span className="text-orange-700 dark:text-orange-400">{subs}</span>
                                </div>
                              ))
                          )}
                        </div>
                      </DisclosurePanel>
                    )}
                  </AnimatePresence>
                </>
              )}
            </Disclosure>
          )}
        </div>

        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-700 flex gap-2">
          <motion.button
            onClick={handleSave}
            disabled={saving || saved}
            whileHover={{ scale: saving || saved ? 1 : 1.02 }}
            whileTap={{ scale: saving || saved ? 1 : 0.98 }}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
              saved
                ? "bg-green-600 text-white focus:ring-green-500"
                : "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 disabled:opacity-50"
            }`}
          >
            <BookmarkIcon className="h-5 w-5" />
            {saved ? "Saved!" : saving ? "Saving..." : "Save Recipe"}
          </motion.button>
          <motion.button
            onClick={() => setShoppingListOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            Shopping List
          </motion.button>
        </div>
      </motion.div>

      <ShoppingList
        recipe={recipe}
        open={shoppingListOpen}
        onClose={handleCloseShoppingList}
      />
    </>
  );
}
