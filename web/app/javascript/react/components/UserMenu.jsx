import React, { useState } from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import LoginModal from "./LoginModal";

export default function UserMenu({ onNavigate }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Menu as="div" className="relative">
        <MenuButton className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors">
          <UserCircleIcon className="h-4 w-4" />
          Sign In
        </MenuButton>
        <MenuItems className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-lg dark:shadow-none border border-orange-100 dark:border-stone-700 py-1 z-50 focus:outline-none">
          <MenuItem>
            <button onClick={() => setShowLogin(true)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-orange-50 dark:hover:bg-stone-700 transition-colors">
              <UserCircleIcon className="h-4 w-4" />
              Sign In / Sign Up
            </button>
          </MenuItem>
          <MenuItem>
            <button onClick={() => onNavigate?.("preferences")} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-orange-50 dark:hover:bg-stone-700 transition-colors">
              <Cog6ToothIcon className="h-4 w-4" />
              Preferences
            </button>
          </MenuItem>
        </MenuItems>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </Menu>
    );
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-stone-700 transition-colors">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-700 dark:text-orange-400 font-medium text-sm">
            {(user?.name || user?.email || "?")[0].toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-stone-700 dark:text-stone-200 max-w-[120px] truncate">
          {user?.name || user?.email}
        </span>
      </MenuButton>
      <MenuItems className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-lg dark:shadow-none border border-orange-100 dark:border-stone-700 py-1 z-50 focus:outline-none">
        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-700">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{user?.name}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user?.email}</p>
        </div>
        <MenuItem>
          <button onClick={() => onNavigate?.("preferences")} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-orange-50 dark:hover:bg-stone-700 transition-colors">
            <Cog6ToothIcon className="h-4 w-4" />
            Preferences
          </button>
        </MenuItem>
        <div className="border-t border-stone-100 dark:border-stone-700 mt-1 pt-1">
          <MenuItem>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-orange-50 dark:hover:bg-stone-700 transition-colors">
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Sign Out
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}
