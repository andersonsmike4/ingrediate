import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FireIcon, BookmarkIcon, StarIcon, TrophyIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchAchievements } from "../utils/api";
import { useAuth } from "./AuthContext";

const ICON_MAP = {
  bookmark: BookmarkIcon,
  fire: FireIcon,
  star: StarIcon,
  flame: FireIcon,
  trophy: TrophyIcon,
};

export default function AchievementsDashboard() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const result = await fetchAchievements();
        setData(result);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <TrophyIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-900 mb-2">Sign in to track achievements</h2>
        <p className="text-stone-600">Create an account to unlock cooking achievements and track your progress</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-stone-600">Loading achievements...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const achievements = data?.achievements || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Achievements</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Track your cooking journey</p>
      </div>

      {/* Streak Counter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-8 text-white text-center"
      >
        <FireIcon className="h-16 w-16 mx-auto mb-4" />
        <div className="text-5xl font-bold mb-2">{stats.current_streak || 0}</div>
        <div className="text-lg opacity-90">Day Cooking Streak</div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-orange-100 p-6"
        >
          <div className="text-3xl font-bold text-orange-600 mb-1">{stats.total_cooked || 0}</div>
          <div className="text-sm text-stone-600">Recipes Cooked</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-orange-100 p-6"
        >
          <div className="text-3xl font-bold text-orange-600 mb-1">{stats.total_saved || 0}</div>
          <div className="text-sm text-stone-600">Recipes Saved</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-orange-100 p-6"
        >
          <div className="text-3xl font-bold text-orange-600 mb-1">{stats.total_points || 0}</div>
          <div className="text-sm text-stone-600">Total Points</div>
        </motion.div>
      </div>

      {/* Achievements Grid */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-4">Your Achievements</h2>
        {achievements.length === 0 ? (
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 p-12 text-center">
            <TrophyIcon className="h-16 w-16 text-orange-200 mx-auto mb-4" />
            <p className="text-stone-600">Start cooking to unlock achievements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, i) => {
              const IconComponent = ICON_MAP[achievement.icon] || StarIcon;
              const isUnlocked = achievement.unlocked;

              return (
                <motion.div
                  key={achievement.id || i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl shadow-sm border p-6 ${
                    isUnlocked
                      ? "bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200"
                      : "bg-stone-50 border-stone-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-xl ${
                        isUnlocked ? "bg-orange-500 text-white" : "bg-stone-300 text-stone-500"
                      }`}
                    >
                      {isUnlocked ? (
                        <IconComponent className="h-6 w-6" />
                      ) : (
                        <LockClosedIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-bold mb-1 ${
                          isUnlocked ? "text-stone-900" : "text-stone-500"
                        }`}
                      >
                        {achievement.name}
                      </h3>
                      <p
                        className={`text-sm mb-2 ${
                          isUnlocked ? "text-stone-600" : "text-stone-400"
                        }`}
                      >
                        {achievement.description}
                      </p>
                      {isUnlocked && achievement.unlocked_at && (
                        <div className="text-xs text-orange-600 font-medium">
                          Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </div>
                      )}
                      {!isUnlocked && achievement.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-400 transition-all"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
