import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  StopIcon,
  DocumentTextIcon,
  PhotoIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  fetchPantryItems,
  addPantryItem,
  deletePantryItem,
  clearPantry,
  voiceAddPantryItems,
  scanReceipt,
} from "../utils/api";

const CATEGORIES = [
  { value: "produce", label: "Produce" },
  { value: "dairy", label: "Dairy" },
  { value: "protein", label: "Protein" },
  { value: "grains", label: "Grains" },
  { value: "spices", label: "Spices" },
  { value: "condiments", label: "Condiments" },
  { value: "canned", label: "Canned" },
  { value: "frozen", label: "Frozen" },
  { value: "other", label: "Other" },
];

const SPEECH_SUPPORTED =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export default function PantryManager({ onUseIngredients }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [newQuantity, setNewQuantity] = useState("");

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const recognitionRef = useRef(null);

  // Receipt scan state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptScanning, setReceiptScanning] = useState(false);
  const [receiptResults, setReceiptResults] = useState(null);
  const receiptInputRef = useRef(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    return () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    };
  }, [receiptPreview]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchPantryItems();
      setItems(data.pantry_items || []);
    } catch (err) {
      console.error("Error loading pantry:", err);
      toast.error("Failed to load pantry");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const data = await addPantryItem(newName.trim(), newCategory, newExpiresAt || null, newQuantity.trim() || null);
      setItems([...items, data.pantry_item]);
      setNewName("");
      setNewExpiresAt("");
      setNewQuantity("");
      toast.success(`Added "${newName.trim()}" to pantry`);
    } catch (err) {
      toast.error("Failed to add item (might be a duplicate)");
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await deletePantryItem(id);
      setItems(items.filter((item) => item.id !== id));
      toast.success(`Removed "${name}"`);
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Remove all items from your pantry?")) return;
    try {
      await clearPantry();
      setItems([]);
      toast.success("Pantry cleared");
    } catch (err) {
      toast.error("Failed to clear pantry");
    }
  };

  const handleUseInSearch = () => {
    const ingredientList = items.map((item) => item.name).join(", ");
    onUseIngredients(ingredientList);
    toast.success("Pantry items loaded into recipe search!");
  };

  // --- Voice input ---
  const startListening = useCallback(() => {
    if (!SPEECH_SUPPORTED) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + " ";
        } else {
          interim = t;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        toast.error(`Microphone error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
    toast.info("Listening... say your pantry items");
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const handleVoiceSubmit = async () => {
    const text = transcript.trim();
    if (!text) {
      toast.error("No items detected. Try speaking again.");
      return;
    }

    setVoiceProcessing(true);
    try {
      const data = await voiceAddPantryItems(text);
      const newItems = data.pantry_items || [];
      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
        toast.success(`Added ${newItems.length} item${newItems.length === 1 ? "" : "s"} to pantry`);
      } else {
        toast.info("No new items to add (may already be in pantry)");
      }
      setTranscript("");
    } catch (err) {
      toast.error("Failed to process voice input");
    } finally {
      setVoiceProcessing(false);
    }
  };

  const handleReceiptSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setReceiptResults(null);
  };

  const handleReceiptScan = async () => {
    if (!receiptFile) return;

    setReceiptScanning(true);
    try {
      const data = await scanReceipt(receiptFile);
      setReceiptResults(data);

      const newItems = data.pantry_items || [];
      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
        toast.success(`Added ${newItems.length} item${newItems.length === 1 ? "" : "s"} from receipt`);
      } else {
        toast.info("No food items found on this receipt");
      }
    } catch (err) {
      console.error("Receipt scan error:", err);
      toast.error("Failed to scan receipt. Try a clearer photo.");
    } finally {
      setReceiptScanning(false);
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(null);
    setReceiptResults(null);
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  };

  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const cat = item.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items]);

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">My Pantry</h2>
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-stone-200 dark:bg-stone-700 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">My Pantry</h2>
        <span className="text-sm text-stone-600 dark:text-stone-400">{items.length} items</span>
      </motion.div>

      {/* Voice input section */}
      {SPEECH_SUPPORTED && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-orange-50 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800 p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <MicrophoneIcon className="h-5 w-5 text-orange-600" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Voice Add</h3>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Quickly add items by speaking
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isListening ? (
              <motion.button
                onClick={startListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
              >
                <MicrophoneIcon className="h-4 w-4" />
                Start Talking
              </motion.button>
            ) : (
              <motion.button
                onClick={stopListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0.4)", "0 0 0 12px rgba(239,68,68,0)", "0 0 0 0 rgba(239,68,68,0.4)"] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <StopIcon className="h-4 w-4" />
                Stop
              </motion.button>
            )}

            {transcript && !isListening && (
              <motion.button
                onClick={handleVoiceSubmit}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={voiceProcessing}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                {voiceProcessing ? "Adding..." : "Add to Pantry"}
              </motion.button>
            )}
          </div>

          {/* Live transcript */}
          {(isListening || transcript) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3"
            >
              <div className="bg-white dark:bg-stone-900 rounded-lg border border-orange-100 dark:border-stone-700 px-4 py-3 text-sm text-stone-700 dark:text-stone-200 min-h-[44px]">
                {transcript || (
                  <span className="text-stone-400 italic">
                    Listening... say items like "chicken, rice, tomatoes, olive oil, garlic"
                  </span>
                )}
                {isListening && (
                  <span className="inline-block w-1.5 h-4 bg-orange-500 ml-0.5 animate-pulse rounded-full align-middle" />
                )}
              </div>
              {transcript && !isListening && (
                <button
                  onClick={() => setTranscript("")}
                  className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                >
                  Clear transcript
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Receipt scan section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.075 }}
        className="bg-gradient-to-r from-orange-50 to-orange-50 dark:from-orange-900/20 dark:to-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <DocumentTextIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Scan Receipt</h3>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Upload a grocery receipt to auto-add items
          </span>
        </div>

        <input
          ref={receiptInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleReceiptSelect}
          className="hidden"
        />

        {!receiptFile && !receiptResults && (
          <motion.button
            onClick={() => receiptInputRef.current?.click()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
          >
            <PhotoIcon className="h-4 w-4" />
            Upload Receipt Photo
          </motion.button>
        )}

        {receiptFile && !receiptResults && (
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <img
                src={receiptPreview}
                alt="Receipt"
                className="w-32 h-44 object-cover rounded-lg border border-orange-200 dark:border-orange-700"
              />
              <div className="flex-1 space-y-2">
                <p className="text-sm text-stone-600 dark:text-stone-300">{receiptFile.name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {(receiptFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleReceiptScan}
                    disabled={receiptScanning}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {receiptScanning ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="h-4 w-4" />
                        Scan Receipt
                      </>
                    )}
                  </motion.button>
                  <button
                    onClick={clearReceipt}
                    className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors px-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {receiptResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Added {receiptResults.added_count} of {receiptResults.parsed_count} items to pantry
              {receiptResults.purchases?.length > 0 && ` · ${receiptResults.purchases.length} purchase${receiptResults.purchases.length !== 1 ? "s" : ""} logged`}
            </div>

            {receiptResults.pantry_items?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {receiptResults.pantry_items.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  >
                    {item.name}
                    {item.quantity && <span className="opacity-60">({item.quantity})</span>}
                  </span>
                ))}
              </div>
            )}

            {receiptResults.purchases?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {receiptResults.purchases.map((purchase, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                  >
                    {purchase.item_name}
                    {purchase.actual_price_cents && (
                      <span className="font-semibold">${(purchase.actual_price_cents / 100).toFixed(2)}</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={clearReceipt}
              className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 font-medium transition-colors"
            >
              Scan Another Receipt
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Manual add item form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleAdd}
        className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4"
      >
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add an ingredient..."
            className="flex-1 min-w-[160px] rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <input
            type="text"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            placeholder="Qty (e.g., 2 lbs)"
            className="w-32 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <div className="flex flex-col">
            <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-0.5 ml-1">
              Expiration Date
            </label>
            <input
              type="date"
              value={newExpiresAt}
              onChange={(e) => setNewExpiresAt(e.target.value)}
              className="rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors self-end"
          >
            <PlusIcon className="h-5 w-5" />
            Add
          </motion.button>
        </div>
      </motion.form>

      {/* Action buttons */}
      {items.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
          <motion.button
            onClick={handleUseInSearch}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            Find Recipes with My Pantry
          </motion.button>
          <motion.button
            onClick={handleClearAll}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <TrashIcon className="h-5 w-5" />
            Clear All
          </motion.button>
        </motion.div>
      )}

      {/* Items grouped by category */}
      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <ArchiveBoxIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">Your pantry is empty</h3>
          <p className="text-stone-600 dark:text-stone-400">
            Add ingredients manually or use the microphone to quickly add items by voice
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {CATEGORIES.filter((cat) => groupedItems[cat.value]).map((cat) => (
            <div
              key={cat.value}
              className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 overflow-hidden"
            >
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 capitalize">{cat.label}</h3>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {groupedItems[cat.value].length} item{groupedItems[cat.value].length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                <AnimatePresence>
                  {groupedItems[cat.value].map((item) => (
                    <motion.span
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                        isExpiringSoon(item.expires_at)
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                      }`}
                    >
                      {isExpiringSoon(item.expires_at) && (
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                      )}
                      {item.name}
                      {item.quantity && (
                        <span className="text-xs font-normal opacity-75">· {item.quantity}</span>
                      )}
                      {item.expires_at && (
                        <span className="text-xs opacity-60">
                          exp{" "}
                          {new Date(item.expires_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="rounded-full hover:bg-orange-200 p-0.5 transition-colors"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
