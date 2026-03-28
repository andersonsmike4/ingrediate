import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { googleAuthUrl } from "../utils/auth";

export default function LoginModal({ isOpen, onClose }) {
  const { login, signup } = useAuth();
  const [loading, setLoading] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(signInEmail, signInPassword);
      toast.success("Welcome back!");
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (signUpPassword !== signUpConfirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await signup(signUpName, signUpEmail, signUpPassword, signUpConfirm);
      toast.success("Account created!");
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel as={motion.div}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white dark:bg-stone-800 rounded-2xl shadow-xl dark:shadow-none border dark:border-stone-700 p-6"
            >
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-stone-900 dark:text-stone-50 mb-4">
                <LockClosedIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                Welcome to Ingrediate
              </DialogTitle>

              {/* Google OAuth */}
              <a
                href={googleAuthUrl()}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border-2 border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors font-medium text-stone-700 dark:text-stone-200 mb-4"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </a>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200 dark:border-stone-700"></div></div>
                <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-stone-800 px-4 text-stone-500 dark:text-stone-400">or</span></div>
              </div>

              <TabGroup>
                <TabList className="flex gap-1 bg-stone-100 dark:bg-stone-900 rounded-xl p-1 mb-4">
                  <Tab className={({ selected }) => `flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${selected ? "bg-white dark:bg-stone-700 text-orange-700 dark:text-orange-400 shadow-sm" : "text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"}`}>
                    Sign In
                  </Tab>
                  <Tab className={({ selected }) => `flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${selected ? "bg-white dark:bg-stone-700 text-orange-700 dark:text-orange-400 shadow-sm" : "text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"}`}>
                    Sign Up
                  </Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <form onSubmit={handleSignIn} className="space-y-3">
                      <input type="email" placeholder="Email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm" />
                      <input type="password" placeholder="Password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm" />
                      <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50">
                        {loading ? "Signing in..." : "Sign In"}
                      </button>
                    </form>
                  </TabPanel>
                  <TabPanel>
                    <form onSubmit={handleSignUp} className="space-y-3">
                      <input type="text" placeholder="Name" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm" />
                      <input type="email" placeholder="Email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm" />
                      <input type="password" placeholder="Password (min 6 characters)" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm" />
                      <input type="password" placeholder="Confirm Password" value={signUpConfirm} onChange={(e) => setSignUpConfirm(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm" />
                      <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50">
                        {loading ? "Creating account..." : "Create Account"}
                      </button>
                    </form>
                  </TabPanel>
                </TabPanels>
              </TabGroup>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
