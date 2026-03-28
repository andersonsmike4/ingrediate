import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderIcon,
  PlusIcon,
  TrashIcon,
  ShareIcon,
  XMarkIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { toast } from "sonner";
import {
  fetchCollections,
  createCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  shareCollection,
  fetchSavedRecipes
} from "../utils/api";

export default function RecipeCollections() {
  const [collections, setCollections] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cols, recipes] = await Promise.all([
        fetchCollections(),
        fetchSavedRecipes()
      ]);
      setCollections(cols);
      setSavedRecipes(recipes);
    } catch (err) {
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const data = await createCollection(newName.trim(), newDesc.trim());
      setCollections([{ ...(data.collection || data), collection_recipes: [] }, ...collections]);
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      toast.success("Collection created!");
    } catch (err) {
      toast.error("Failed to create collection");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteCollection(id);
      setCollections(collections.filter(c => c.id !== id));
      toast.success(`"${name}" deleted`);
    } catch (err) {
      toast.error("Failed to delete collection");
    }
  };

  const handleAddRecipe = async (collectionId, recipeId) => {
    try {
      await addRecipeToCollection(collectionId, recipeId);
      loadData();
      toast.success("Recipe added to collection!");
    } catch (err) {
      toast.error("Already in collection or error");
    }
  };

  const handleRemoveRecipe = async (collectionId, recipeId) => {
    try {
      await removeRecipeFromCollection(collectionId, recipeId);
      loadData();
      toast.success("Recipe removed");
    } catch (err) {
      toast.error("Failed to remove recipe");
    }
  };

  const handleShare = async (id) => {
    try {
      const data = await shareCollection(id);
      await navigator.clipboard.writeText(window.location.origin + data.share_url);
      toast.success("Share link copied!");
    } catch (err) {
      toast.error("Failed to share");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Collections</h2>
        <div className="space-y-4">
          {[0,1].map(i => (
            <div key={i} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-6 animate-pulse">
              <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Collections</h2>
        <motion.button
          onClick={() => setShowCreate(!showCreate)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Collection
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 p-4 space-y-3 overflow-hidden"
          >
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name..." className="w-full rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)..." className="w-full rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg bg-stone-200 dark:bg-stone-700 px-4 py-2 text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {collections.length === 0 && !showCreate ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
          <FolderIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">No collections yet</h3>
          <p className="text-stone-600 dark:text-stone-400">Create a collection to organize your recipes</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {collections.map((collection, idx) => {
            const recipes = (collection.collection_recipes || []).map(cr => cr.saved_recipe).filter(Boolean);
            const availableRecipes = savedRecipes.filter(r => !recipes.some(cr => cr.id === r.id));
            return (
              <motion.div key={collection.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-orange-100 dark:border-stone-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">{collection.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleShare(collection.id)}
                        className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                        <ShareIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(collection.id, collection.name)}
                        className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {collection.description && (
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">{collection.description}</p>
                  )}
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">{recipes.length} recipes</p>

                  {recipes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {recipes.map(recipe => (
                        <span key={recipe.id} className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700">
                          {recipe.name}
                          <button onClick={() => handleRemoveRecipe(collection.id, recipe.id)}
                            className="hover:text-orange-900">
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {availableRecipes.length > 0 && (
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <DisclosureButton className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium">
                            <PlusIcon className="h-4 w-4" />
                            Add recipe
                            <motion.div animate={{ rotate: open ? 180 : 0 }}>
                              <ChevronDownIcon className="h-4 w-4" />
                            </motion.div>
                          </DisclosureButton>
                          <AnimatePresence>
                            {open && (
                              <DisclosurePanel static as={motion.div}
                                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                  {availableRecipes.map(recipe => (
                                    <button key={recipe.id}
                                      onClick={() => handleAddRecipe(collection.id, recipe.id)}
                                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 text-sm transition-colors">
                                      {recipe.name}
                                    </button>
                                  ))}
                                </div>
                              </DisclosurePanel>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </Disclosure>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
