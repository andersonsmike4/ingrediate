import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CameraIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { analyzePhoto } from "../utils/api";

export default function PhotoUpload({ onUseIngredients }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (file) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    handleAnalyze(file);
  };

  const handleAnalyze = async (file) => {
    setLoading(true);
    setIngredients([]);

    try {
      const result = await analyzePhoto(file);
      const names = result.map((i) => (typeof i === "string" ? i : i.name));
      setIngredients(names);
      toast.success(`Found ${names.length} ingredients!`);
    } catch (err) {
      console.error("Error analyzing photo:", err);
      toast.error("Failed to analyze photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setIngredients(ingredients.filter((_, index) => index !== indexToRemove));
  };

  const handleUseIngredients = () => {
    onUseIngredients(ingredients.join(", "));
    toast.success("Ingredients added to search");
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIngredients([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 overflow-hidden"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <CameraIcon className="h-5 w-5 text-orange-600" />
            Upload a Photo
          </h3>
          {previewUrl && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleReset}
              className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            >
              Clear
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!previewUrl ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.01 }}
              className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30"
                  : "border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-700"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <motion.div
                animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <CameraIcon className="h-12 w-12 text-stone-400 mx-auto mb-3" />
              </motion.div>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                Drop a photo here or click to upload
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                JPG, PNG, or WebP up to 10MB
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="relative rounded-lg overflow-hidden bg-stone-100">
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={previewUrl}
                  alt="Uploaded preview"
                  className="w-full h-48 object-cover"
                />
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center"
                    >
                      <div className="text-center text-white">
                        <motion.svg
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </motion.svg>
                        <p className="text-sm font-medium">Analyzing photo...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {ingredients.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="block text-sm font-medium text-stone-900 dark:text-stone-50 mb-2">
                      Detected Ingredients
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {ingredients.map((ingredient, index) => (
                          <motion.span
                            key={ingredient + index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: index * 0.05 }}
                            layout
                            className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
                          >
                            {ingredient}
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(index)}
                              className="rounded-full hover:bg-green-200 p-0.5 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUseIngredients}
                      className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      Use These Ingredients
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
