import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CurrencyDollarIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchBudgetSummary, logPurchase } from "../utils/api";
import { useAuth } from "./AuthContext";

export default function BudgetTracker() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadSummary();
  }, [isAuthenticated]);

  const loadSummary = async () => {
    try {
      const data = await fetchBudgetSummary();
      setSummary(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !price) {
      toast.error("Item name and price are required");
      return;
    }

    setSubmitting(true);
    try {
      const priceCents = Math.round(parseFloat(price) * 100);
      await logPurchase(itemName, priceCents, date, store);
      toast.success("Purchase logged");
      setItemName("");
      setPrice("");
      setStore("");
      setDate(new Date().toISOString().split("T")[0]);
      setShowForm(false);
      await loadSummary();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <CurrencyDollarIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-900 mb-2">Sign in to track your budget</h2>
        <p className="text-stone-600">Create an account to monitor your grocery spending</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-stone-600">Loading budget...</p>
      </div>
    );
  }

  const monthlyTotal = (summary?.monthly_total_cents || 0) / 100;
  const purchases = summary?.recent_purchases || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Budget Tracker</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Monitor your grocery spending</p>
      </div>

      {/* Monthly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium opacity-90">This Month</h2>
          <CurrencyDollarIcon className="h-8 w-8 opacity-80" />
        </div>
        <div className="text-5xl font-bold mb-2">${monthlyTotal.toFixed(2)}</div>
        <div className="text-sm opacity-90">{summary?.item_count || 0} items purchased</div>
      </motion.div>

      {/* Add Purchase Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6"
      >
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors mb-4"
        >
          <ShoppingCartIcon className="h-5 w-5" />
          {showForm ? "Cancel" : "Log Purchase"}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Item Name</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Store (optional)</label>
              <input
                type="text"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {submitting ? "Logging..." : "Log Purchase"}
            </button>
          </form>
        )}
      </motion.div>

      {/* Recent Purchases */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6"
      >
        <h2 className="text-lg font-bold text-stone-900 mb-4">Recent Purchases</h2>
        {purchases.length === 0 ? (
          <p className="text-stone-500 text-center py-8">No purchases logged yet</p>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0"
              >
                <div>
                  <div className="font-medium text-stone-900">{purchase.item_name}</div>
                  <div className="text-sm text-stone-500">
                    {purchase.store && `${purchase.store} • `}
                    {new Date(purchase.purchased_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-lg font-bold text-stone-900">
                  ${((purchase.actual_price_cents || 0) / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Simple Bar Visualization */}
      {summary?.daily_spending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6"
        >
          <h2 className="text-lg font-bold text-stone-900 mb-4">Daily Spending (Last 7 Days)</h2>
          <div className="space-y-3">
            {Object.entries(summary.daily_spending).map(([date, cents]) => {
              const amount = cents / 100;
              const maxAmount = Math.max(...Object.values(summary.daily_spending)) / 100;
              const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

              return (
                <div key={date}>
                  <div className="flex justify-between text-sm text-stone-600 mb-1">
                    <span>{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="font-medium">${amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
