import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Cog6ToothIcon, XMarkIcon, PlusIcon, UserGroupIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchPreferences, updatePreferences } from "../utils/api";
import { useAuth } from "./AuthContext";

const DIETARY_OPTIONS = ["vegetarian", "vegan", "keto", "paleo", "gluten-free", "dairy-free", "nut-free", "halal", "kosher"];
const SPICE_LEVELS = ["mild", "medium", "spicy", "extra spicy"];
const CUISINES = ["Italian", "Mexican", "Asian", "Indian", "Mediterranean", "American", "French", "Japanese", "Thai", "Middle Eastern"];
const PROTEINS = ["chicken", "beef", "pork", "fish", "tofu", "beans", "eggs"];
const CALORIE_PREFS = [
  { value: "none", label: "No preference" },
  { value: "light", label: "Light (<500 cal)" },
  { value: "moderate", label: "Moderate (500-700 cal)" },
  { value: "hearty", label: "Hearty (700+ cal)" }
];

export default function PreferencesWizard() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dietary, setDietary] = useState([]);
  const [spiceTolerance, setSpiceTolerance] = useState("medium");
  const [cuisines, setCuisines] = useState([]);
  const [proteins, setProteins] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [caloriePreference, setCaloriePreference] = useState("none");
  const [allergenInput, setAllergenInput] = useState("");
  const [householdMembers, setHouseholdMembers] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadPrefs = async () => {
      try {
        const data = await fetchPreferences();
        const prefs = data.preferences || {};
        setDietary(prefs.dietary_restrictions || []);
        setSpiceTolerance(prefs.spice_tolerance || "medium");
        setCuisines(prefs.preferred_cuisines || []);
        setProteins(prefs.preferred_proteins || []);
        setAllergens(prefs.allergens || []);
        setCaloriePreference(prefs.calorie_preference || "none");
        setHouseholdMembers(prefs.household_members || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPrefs();
  }, [isAuthenticated]);

  const savePreferences = useCallback(async (prefs) => {
    if (!isAuthenticated) return;

    setSaving(true);
    try {
      await updatePreferences(prefs);
      toast.success("Preferences saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const timer = setTimeout(() => {
      savePreferences({
        dietary_restrictions: dietary,
        spice_tolerance: spiceTolerance,
        preferred_cuisines: cuisines,
        preferred_proteins: proteins,
        allergens,
        calorie_preference: caloriePreference,
        household_members: householdMembers
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [dietary, spiceTolerance, cuisines, proteins, allergens, caloriePreference, householdMembers, isAuthenticated, loading, savePreferences]);

  const toggleArray = (arr, setArr, value) => {
    if (arr.includes(value)) {
      setArr(arr.filter(v => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  const addAllergen = () => {
    if (!allergenInput.trim()) return;
    if (!allergens.includes(allergenInput.trim())) {
      setAllergens([...allergens, allergenInput.trim()]);
    }
    setAllergenInput("");
  };

  const removeAllergen = (allergen) => {
    setAllergens(allergens.filter(a => a !== allergen));
  };

  const addHouseholdMember = () => {
    setHouseholdMembers([...householdMembers, { name: "", age: "" }]);
  };

  const updateHouseholdMember = (index, field, value) => {
    const updated = householdMembers.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    );
    setHouseholdMembers(updated);
  };

  const removeHouseholdMember = (index) => {
    setHouseholdMembers(householdMembers.filter((_, i) => i !== index));
  };

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  const appearanceSection = (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <SunIcon className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Appearance</h2>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setDarkMode(false)}
          className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            !darkMode
              ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
              : "border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500"
          }`}
        >
          <SunIcon className={`h-6 w-6 ${!darkMode ? "text-orange-500" : "text-stone-400"}`} />
          <span className={`text-sm font-medium ${!darkMode ? "text-orange-700 dark:text-orange-400" : "text-stone-600 dark:text-stone-400"}`}>Light</span>
        </button>
        <button
          onClick={() => setDarkMode(true)}
          className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            darkMode
              ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
              : "border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500"
          }`}
        >
          <MoonIcon className={`h-6 w-6 ${darkMode ? "text-orange-500" : "text-stone-400"}`} />
          <span className={`text-sm font-medium ${darkMode ? "text-orange-700 dark:text-orange-400" : "text-stone-600 dark:text-stone-400"}`}>Dark</span>
        </button>
      </div>
    </motion.section>
  );

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Preferences</h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">Customize your experience</p>
        </div>
        {appearanceSection}
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
          <Cog6ToothIcon className="h-16 w-16 text-orange-200 dark:text-orange-800 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">Sign in to save more preferences</h2>
          <p className="text-stone-600 dark:text-stone-400">Create an account to customize your recipe recommendations</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-stone-600 dark:text-stone-400">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Preferences</h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">Customize your experience</p>
        </div>
        {saving && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400"
          >
            <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full" />
            Saving...
          </motion.div>
        )}
      </div>

      {/* Appearance */}
      {appearanceSection}

      {/* Household */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Household</h2>
          </div>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {householdMembers.length} {householdMembers.length === 1 ? "person" : "people"}
          </span>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
          Add the people you cook for so AI can suggest proper portions and age-appropriate meals.
        </p>

        <div className="space-y-3">
          {householdMembers.map((member, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="text"
                value={member.name}
                onChange={(e) => updateHouseholdMember(index, "name", e.target.value)}
                placeholder="Name (e.g., Dad, Toddler)"
                className="flex-1 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
              />
              <input
                type="number"
                value={member.age}
                onChange={(e) => updateHouseholdMember(index, "age", e.target.value)}
                placeholder="Age"
                min="0"
                max="120"
                className="w-20 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm text-center"
              />
              <button
                onClick={() => removeHouseholdMember(index)}
                className="p-2 text-stone-400 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addHouseholdMember}
          className="mt-3 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-stone-700 rounded-xl transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Person
        </button>
      </motion.section>

      {/* Dietary Restrictions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-4">Dietary Restrictions</h2>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => toggleArray(dietary, setDietary, option)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                dietary.includes(option)
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Spice Tolerance */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-4">Spice Tolerance</h2>
        <div className="flex flex-wrap gap-2">
          {SPICE_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setSpiceTolerance(level)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                spiceTolerance === level
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Preferred Cuisines */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-4">Preferred Cuisines</h2>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => toggleArray(cuisines, setCuisines, cuisine)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                cuisines.includes(cuisine)
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Preferred Proteins */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-4">Preferred Proteins</h2>
        <div className="flex flex-wrap gap-2">
          {PROTEINS.map(protein => (
            <button
              key={protein}
              onClick={() => toggleArray(proteins, setProteins, protein)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                proteins.includes(protein)
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {protein}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Allergens */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-4">Allergens</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={allergenInput}
            onChange={(e) => setAllergenInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAllergen()}
            placeholder="Add allergen (e.g., shellfish)"
            className="flex-1 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
          />
          <button
            onClick={addAllergen}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Add
          </button>
        </div>
        {allergens.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allergens.map(allergen => (
              <div
                key={allergen}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium"
              >
                {allergen}
                <button onClick={() => removeAllergen(allergen)} className="hover:text-red-900">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Calorie Preference */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-6"
      >
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-4">Calorie Preference</h2>
        <div className="flex flex-wrap gap-2">
          {CALORIE_PREFS.map(pref => (
            <button
              key={pref.value}
              onClick={() => setCaloriePreference(pref.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                caloriePreference === pref.value
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {pref.label}
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
