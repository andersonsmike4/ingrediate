import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import {
  FireIcon, BookmarkIcon, CalendarDaysIcon, ArchiveBoxIcon, ClockIcon,
  FolderIcon, ChartBarIcon, Bars3Icon, SparklesIcon, ShoppingCartIcon,
  TrophyIcon, HeartIcon, BeakerIcon, ScaleIcon, CurrencyDollarIcon,
  ArrowsRightLeftIcon, DocumentTextIcon, BoltIcon,
  ChevronDownIcon, MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { ClockIcon as TimerIcon } from "@heroicons/react/24/outline";
import { DEFAULT_FILTERS } from "./utils/recipe";
import { AuthProvider } from "./components/AuthContext";
import UserMenu from "./components/UserMenu";
import IngredientInput from "./components/IngredientInput";
import PhotoUpload from "./components/PhotoUpload";
import RecipeResults from "./components/RecipeResults";
import SavedRecipes from "./components/SavedRecipes";
import MealPlanner from "./components/MealPlanner";
import PantryManager from "./components/PantryManager";
import CookingHistory from "./components/CookingHistory";
import RecipeCollections from "./components/RecipeCollections";
import NutritionDashboard from "./components/NutritionDashboard";
import RecipeImport from "./components/RecipeImport";

import SmartSuggestions from "./components/SmartSuggestions";
import ShoppingListManager from "./components/ShoppingListManager";
import PreferencesWizard from "./components/PreferencesWizard";
import CommunityFeed from "./components/CommunityFeed";
import AchievementsDashboard from "./components/AchievementsDashboard";
import MealPrepAssistant from "./components/MealPrepAssistant";
import RecipeCompare from "./components/RecipeCompare";
import BudgetTracker from "./components/BudgetTracker";
import SubstitutionHistory from "./components/SubstitutionHistory";
import WeeklyNutritionReport from "./components/WeeklyNutritionReport";
import DailyChallenge from "./components/DailyChallenge";
import KitchenTimers from "./components/KitchenTimers";
import RecipeSearch from "./components/RecipeSearch";

const TOAST_OPTIONS = {
  style: { borderRadius: "12px", fontSize: "14px" },
};

// Grouped navigation structure
const NAV_GROUPS = [
  {
    label: "Cook",
    icon: FireIcon,
    items: [
      { key: "home", label: "Find Recipes", icon: FireIcon },
      { key: "recipesearch", label: "Recipe Search", icon: MagnifyingGlassIcon },
      { key: "suggest", label: "Smart Suggest", icon: SparklesIcon },
      { key: "challenges", label: "Daily Challenge", icon: BoltIcon },
    ],
  },
  {
    label: "Plan",
    icon: CalendarDaysIcon,
    items: [
      { key: "planner", label: "Meal Plan", icon: CalendarDaysIcon },
      { key: "mealprep", label: "Meal Prep", icon: BeakerIcon },
      { key: "shopping", label: "Shopping List", icon: ShoppingCartIcon },
    ],
  },
  {
    label: "Kitchen",
    icon: ArchiveBoxIcon,
    items: [
      { key: "pantry", label: "My Pantry", icon: ArchiveBoxIcon },
      { key: "timers", label: "Kitchen Timers", icon: TimerIcon },
      { key: "substitutions", label: "Substitutions", icon: ArrowsRightLeftIcon },
      { key: "compare", label: "Compare Recipes", icon: ScaleIcon },
    ],
  },
  {
    label: "Track",
    icon: ChartBarIcon,
    items: [
      { key: "saved", label: "Saved Recipes", icon: BookmarkIcon },
      { key: "history", label: "Cooking History", icon: ClockIcon },
      { key: "collections", label: "Collections", icon: FolderIcon },
      { key: "nutrition", label: "Nutrition Goals", icon: ChartBarIcon },
      { key: "report", label: "Weekly Report", icon: DocumentTextIcon },
      { key: "budget", label: "Budget Tracker", icon: CurrencyDollarIcon },
      { key: "achievements", label: "Achievements", icon: TrophyIcon },
    ],
  },
];

// Derive flat mobile items from NAV_GROUPS (single source of truth)
const ALL_MOBILE_ITEMS = [
  ...NAV_GROUPS.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.label }))
  ),
  { key: "community", label: "Community", icon: HeartIcon, group: "Social" },
];

const MOBILE_GROUPS = [...new Set(ALL_MOBILE_ITEMS.map((i) => i.group))];

function NavDropdown({ group, currentView, setCurrentView }) {
  const isActive = group.items.some((i) => i.key === currentView);
  const GroupIcon = group.icon;

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={`relative flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-stone-800" : "text-stone-700 hover:bg-orange-50 dark:text-stone-300 dark:hover:bg-stone-800"
        }`}
      >
        <GroupIcon className="h-4 w-4" />
        <span>{group.label}</span>
        <ChevronDownIcon className="h-3 w-3 ml-0.5" />
      </MenuButton>
      <MenuItems className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-orange-100 py-1 z-50 focus:outline-none dark:bg-stone-800 dark:border-stone-700 dark:shadow-none">
        {group.items.map(({ key, label, icon: Icon }) => (
          <MenuItem key={key}>
            <button
              onClick={() => setCurrentView(key)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                currentView === key
                  ? "text-orange-700 bg-orange-50 font-medium dark:text-orange-400 dark:bg-stone-700"
                  : "text-stone-700 hover:bg-orange-50 dark:text-stone-300 dark:hover:bg-stone-700"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}

const VIEW_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

// Simple views that don't need props from App
const SIMPLE_VIEWS = {
  recipesearch: RecipeSearch,
  suggest: SmartSuggestions,
  planner: MealPlanner,
  shopping: ShoppingListManager,
  history: CookingHistory,
  collections: RecipeCollections,
  nutrition: NutritionDashboard,
  community: CommunityFeed,
  achievements: AchievementsDashboard,
  mealprep: MealPrepAssistant,
  compare: RecipeCompare,
  budget: BudgetTracker,
  substitutions: SubstitutionHistory,
  report: WeeklyNutritionReport,
  challenges: DailyChallenge,
  timers: KitchenTimers,
  preferences: PreferencesWizard,
};

// Valid view keys for URL hash routing
const VALID_VIEWS = new Set([
  ...ALL_MOBILE_ITEMS.map((i) => i.key),
  "preferences",
]);

function getInitialView() {
  const hash = window.location.hash.replace("#", "");
  return VALID_VIEWS.has(hash) ? hash : "home";
}

export default function App() {
  const [currentView, setCurrentViewRaw] = useState(getInitialView);
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);

  // Sync view changes to URL hash
  const setCurrentView = (view) => {
    setCurrentViewRaw(view);
    window.history.replaceState(null, "", view === "home" ? window.location.pathname : `#${view}`);
  };

  // Handle browser back/forward
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      setCurrentViewRaw(VALID_VIEWS.has(hash) ? hash : "home");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Handle OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      toast.success("Successfully signed in!");
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    } else if (params.get("auth") === "failure") {
      toast.error("Authentication failed");
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    }
  }, []);

  const handleRecipeResults = (newRecipes) => {
    setRecipes(newRecipes);
    setLoading(false);
  };

  const handleNewSearch = (newIngredients, newFilters) => {
    setIngredients(newIngredients);
    setFilters(newFilters);
    setLoading(true);
  };

  // Render view - handles special cases that need App callbacks
  const renderView = (view) => {
    // Special views with callbacks
    if (view === "pantry") {
      return (
        <PantryManager onUseIngredients={(ingredientList) => {
          setIngredients(ingredientList);
          setCurrentView("home");
        }} />
      );
    }
    if (view === "saved") {
      return <SavedRecipes onBackToHome={() => setCurrentView("home")} />;
    }

    // Simple views without props
    const Component = SIMPLE_VIEWS[view];
    return Component ? <Component /> : null;
  };

  return (
    <AuthProvider>
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-50 to-orange-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900">
      <Toaster position="top-right" toastOptions={TOAST_OPTIONS} richColors />

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-sm border-b border-orange-100 dark:bg-stone-900 dark:border-stone-700 dark:shadow-none"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <button
              onClick={() => setCurrentView("home")}
              className="flex items-center gap-2 group"
            >
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FireIcon className="h-8 w-8 text-orange-600" />
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-orange-300">
                Ingrediate
              </h1>
            </button>

            <div className="flex items-center gap-2">
              {/* Desktop nav — grouped dropdowns */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_GROUPS.map((group) => (
                  <NavDropdown
                    key={group.label}
                    group={group}
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                  />
                ))}

                {/* Community — standalone */}
                <button
                  onClick={() => setCurrentView("community")}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === "community" ? "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-stone-800" : "text-stone-700 hover:bg-orange-50 dark:text-stone-300 dark:hover:bg-stone-800"
                  }`}
                >
                  <HeartIcon className="h-4 w-4" />
                  <span>Community</span>
                </button>
              </nav>

              <div className="flex items-center gap-1.5 ml-1">
                <UserMenu onNavigate={setCurrentView} />

                {/* Mobile hamburger */}
                <Menu as="div" className="relative md:hidden">
                  <MenuButton className="rounded-lg p-2 text-stone-700 hover:bg-orange-50 transition-colors dark:text-stone-300 dark:hover:bg-stone-800">
                    <Bars3Icon className="h-6 w-6" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-orange-100 py-2 z-50 focus:outline-none max-h-[80vh] overflow-y-auto dark:bg-stone-800 dark:border-stone-700">
                    {MOBILE_GROUPS.map((groupName) => (
                      <div key={groupName}>
                        <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider dark:text-stone-500">
                          {groupName}
                        </div>
                        {ALL_MOBILE_ITEMS.filter((i) => i.group === groupName).map(({ key, label, icon: Icon }) => (
                          <MenuItem key={key}>
                            <button
                              onClick={() => setCurrentView(key)}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                                currentView === key
                                  ? "text-orange-700 bg-orange-50 font-medium dark:text-orange-400 dark:bg-stone-700"
                                  : "text-stone-700 hover:bg-orange-50 dark:text-stone-300 dark:hover:bg-stone-700"
                              }`}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              {label}
                            </button>
                          </MenuItem>
                        ))}
                      </div>
                    ))}
                  </MenuItems>
                </Menu>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentView === "home" ? (
            <motion.div key="home" {...VIEW_ANIMATION} className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center space-y-2"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50">
                  What can you make today?
                </h2>
                <p className="text-lg text-stone-600 dark:text-stone-400">
                  Enter your ingredients or upload a photo to discover delicious recipes
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <PhotoUpload onUseIngredients={setIngredients} />
                  <IngredientInput
                    prefilled={ingredients}
                    onResults={handleRecipeResults}
                    onSearch={handleNewSearch}
                  />
                  <RecipeImport onImported={() => {
                    toast.success("Recipe imported and saved!");
                  }} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    {(recipes.length > 0 || loading) ? (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <RecipeResults
                          recipes={recipes}
                          ingredients={ingredients}
                          filters={filters}
                          onNewRecipes={handleRecipeResults}
                          loading={loading}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-xl shadow-sm border border-orange-100 p-12 text-center dark:bg-stone-800 dark:border-stone-700"
                      >
                        <FireIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
                        <p className="text-stone-500 text-lg dark:text-stone-400">
                          Your recipe suggestions will appear here
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div key={currentView} {...VIEW_ANIMATION}>
              {renderView(currentView)}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-16 py-8 border-t border-orange-100 bg-white dark:bg-stone-900 dark:border-stone-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-stone-500 text-sm dark:text-stone-400">
          <p>Ingrediate - Discover recipes from your ingredients</p>
        </div>
      </footer>
    </div>
    </AuthProvider>
  );
}
