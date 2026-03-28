import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCartIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ArchiveBoxArrowDownIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { csrfToken } from "../utils/csrf";
import { fetchMealPlans } from "../utils/api";

export default function ShoppingListManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [mealPlanId, setMealPlanId] = useState(null);
  const [populating, setPopulating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, plans] = await Promise.all([
        fetch("/api/shopping_list").then(r => r.json()),
        fetchMealPlans()
      ]);
      setItems(listRes.items || []);
      if (plans.length > 0) setMealPlanId(plans[0].id);
    } catch (err) {
      toast.error("Failed to load shopping list");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const response = await fetch("/api/shopping_list", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), amount: newAmount.trim() || null })
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems([...items, data.item]);
      setNewName("");
      setNewAmount("");
    } catch {
      toast.error("Failed to add item (might be a duplicate)");
    }
  };

  const handleToggle = async (id) => {
    // Optimistic update
    setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    try {
      await fetch(`/api/shopping_list/${id}/toggle`, {
        method: "PATCH",
        headers: { "X-CSRF-Token": csrfToken() }
      });
    } catch {
      loadData(); // Revert on error
    }
  };

  const handleDelete = async (id) => {
    setItems(items.filter(i => i.id !== id));
    try {
      await fetch(`/api/shopping_list/${id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken() }
      });
    } catch {
      loadData();
    }
  };

  const handleClearChecked = async () => {
    const checkedCount = items.filter(i => i.checked).length;
    if (!checkedCount) return;
    try {
      await fetch("/api/shopping_list_clear_checked", {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken() }
      });
      setItems(items.filter(i => !i.checked));
      toast.success(`Cleared ${checkedCount} items`);
    } catch {
      toast.error("Failed to clear items");
    }
  };

  const handlePopulateFromPlan = async () => {
    if (!mealPlanId) {
      toast.error("No meal plan found");
      return;
    }
    setPopulating(true);
    try {
      const response = await fetch(`/api/shopping_list/populate/${mealPlanId}`, {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken() }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems(data.items || []);
      toast.success(`Added ${data.added} items from meal plan (excluding pantry items)`);
    } catch {
      toast.error("Failed to populate from meal plan");
    } finally {
      setPopulating(false);
    }
  };

  const handleAddToPantry = async () => {
    const checkedCount = items.filter(i => i.checked).length;
    if (!checkedCount) {
      toast.error("Check off items you've purchased first");
      return;
    }
    try {
      const response = await fetch("/api/shopping_list/add_to_pantry", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken() }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems(items.filter(i => !i.checked));
      toast.success(`Added ${data.added_to_pantry} items to pantry`);
    } catch {
      toast.error("Failed to add to pantry");
    }
  };

  const unchecked = useMemo(() => items.filter(i => !i.checked), [items]);
  const checked = useMemo(() => items.filter(i => i.checked), [items]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Shopping List</h2>
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-6 animate-pulse">
          <div className="space-y-3">
            {[0,1,2,3].map(i => <div key={i} className="h-10 bg-stone-200 dark:bg-stone-700 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Shopping List</h2>
        <span className="text-sm text-stone-600 dark:text-stone-400">{unchecked.length} items remaining</span>
      </motion.div>

      {/* Action bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-wrap gap-2">
        {mealPlanId && (
          <motion.button
            onClick={handlePopulateFromPlan}
            disabled={populating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${populating ? "animate-spin" : ""}`} />
            {populating ? "Loading..." : "Import from Meal Plan"}
          </motion.button>
        )}
        {checked.length > 0 && (
          <>
            <motion.button
              onClick={handleAddToPantry}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
            >
              <ArchiveBoxArrowDownIcon className="h-4 w-4" />
              Add Checked to Pantry
            </motion.button>
            <motion.button
              onClick={handleClearChecked}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              Clear Checked
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Add item form */}
      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={handleAdd}
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add an item..."
            className="flex-1 min-w-[160px] rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <input
            type="text"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Qty (e.g., 2 lbs)"
            className="w-36 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <motion.button type="submit"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors">
            <PlusIcon className="h-5 w-5" />
            Add
          </motion.button>
        </div>
      </motion.form>

      {/* Unchecked items */}
      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12">
          <ShoppingCartIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">Shopping list is empty</h3>
          <p className="text-stone-600 dark:text-stone-400">
            {mealPlanId ? "Import items from your meal plan or add them manually" : "Add items manually to get started"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {unchecked.length > 0 && (
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/30">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">To Buy ({unchecked.length})</h3>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-700">
                <AnimatePresence>
                  {unchecked.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-colors"
                    >
                      <button onClick={() => handleToggle(item.id)}
                        className="flex-shrink-0 h-5 w-5 rounded border-2 border-stone-300 dark:border-stone-600 hover:border-orange-500 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{item.name}</p>
                        {item.source && (
                          <p className="text-xs text-stone-500 dark:text-stone-400">from {item.source}</p>
                        )}
                      </div>
                      {item.amount && (
                        <span className="text-xs text-stone-400">{item.amount}</span>
                      )}
                      <button onClick={() => handleDelete(item.id)}
                        className="flex-shrink-0 text-stone-400 hover:text-red-600 transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {checked.length > 0 && (
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Purchased ({checked.length})</h3>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-700">
                <AnimatePresence>
                  {checked.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      <button onClick={() => handleToggle(item.id)}
                        className="flex-shrink-0 h-5 w-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center">
                        <CheckIcon className="h-3 w-3 text-white" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-400 line-through">{item.name}</p>
                      </div>
                      <button onClick={() => handleDelete(item.id)}
                        className="flex-shrink-0 text-stone-400 hover:text-red-600 transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
