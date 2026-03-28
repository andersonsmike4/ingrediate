import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  BellAlertIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

function parseTimerFromStep(stepText) {
  if (!stepText) return null;
  // Match patterns like "25 minutes", "10 min", "2 hours", "1.5 hours", "30 seconds"
  const patterns = [
    /(\d+\.?\d*)\s*(?:hours?|hrs?)/i,
    /(\d+\.?\d*)\s*(?:minutes?|mins?)/i,
    /(\d+\.?\d*)\s*(?:seconds?|secs?)/i,
  ];

  for (const pattern of patterns) {
    const match = stepText.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (pattern.source.includes("hour")) return { seconds: Math.round(value * 3600), label: `${value}h` };
      if (pattern.source.includes("minute") || pattern.source.includes("min")) return { seconds: Math.round(value * 60), label: `${value}m` };
      if (pattern.source.includes("second") || pattern.source.includes("sec")) return { seconds: Math.round(value), label: `${value}s` };
    }
  }
  return null;
}

function playAlertSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Play 3 beeps
    [0, 0.3, 0.6].forEach(delay => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;
      oscillator.start(audioCtx.currentTime + delay);
      oscillator.stop(audioCtx.currentTime + delay + 0.2);
    });
  } catch (e) {
    // Fallback silent
  }
}

let timerIdCounter = 0;

export default function CookingMode({ recipe, open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timers, setTimers] = useState([]);
  const intervalRef = useRef(null);

  const steps = recipe?.steps || [];
  const totalSteps = steps.length;

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setTimers([]);
      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [open]);

  // Tick all running timers every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers(prev => {
        let updated = false;
        const next = prev.map(t => {
          if (!t.running || t.remaining <= 0) return t;
          updated = true;
          const newRemaining = t.remaining - 1;
          if (newRemaining <= 0) {
            // Timer done
            playAlertSound();
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Timer Done!", { body: `${t.stepLabel} timer is complete`, icon: "/favicon.ico" });
            }
            return { ...t, remaining: 0, running: false, done: true };
          }
          return { ...t, remaining: newRemaining };
        });
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentStep(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, totalSteps, onClose]);

  const addTimer = (seconds, label) => {
    timerIdCounter++;
    setTimers(prev => [...prev, {
      id: timerIdCounter,
      total: seconds,
      remaining: seconds,
      running: true,
      done: false,
      stepLabel: label
    }]);
  };

  const toggleTimer = (id) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, running: !t.running } : t));
  };

  const removeTimer = (id) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const currentStepTimer = currentStep < totalSteps ? parseTimerFromStep(steps[currentStep]) : null;
  const activeTimers = timers.filter(t => !t.done);
  const doneTimers = timers.filter(t => t.done);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={onClose} className="relative z-50">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900" />
          <div className="fixed inset-0">
            <DialogPanel className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-stone-800">
                <div>
                  <h2 className="text-lg font-bold text-white">{recipe?.name}</h2>
                  <p className="text-sm text-stone-400">Cooking Mode</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Active timers */}
                  {activeTimers.map(t => (
                    <motion.div key={t.id}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
                        t.remaining <= 10 ? "bg-red-600 text-white animate-pulse" : "bg-orange-600 text-white"
                      }`}
                    >
                      <ClockIcon className="h-4 w-4" />
                      <span className="text-xs opacity-70 mr-1">{t.stepLabel}</span>
                      {formatTime(t.remaining)}
                      <button onClick={() => toggleTimer(t.id)} className="ml-1 hover:text-orange-200">
                        {t.running ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => removeTimer(t.id)} className="hover:text-red-300">
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                  {doneTimers.map(t => (
                    <motion.div key={t.id}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="flex items-center gap-2 rounded-full bg-green-600 px-3 py-1.5 text-sm font-bold text-white animate-pulse"
                    >
                      <BellAlertIcon className="h-4 w-4" />
                      <span className="text-xs">{t.stepLabel} done!</span>
                      <button onClick={() => removeTimer(t.id)} className="hover:text-green-200">
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                  <motion.button onClick={onClose}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="rounded-full bg-stone-700 p-2 text-stone-300 hover:bg-stone-600 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </motion.button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-stone-800">
                <motion.div className="h-full bg-orange-500" initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>

              {/* Main content */}
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-stone-900">
                <AnimatePresence mode="wait">
                  {currentStep < totalSteps ? (
                    <motion.div key={currentStep}
                      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.2 }}
                      className="max-w-3xl w-full text-center">
                      <p className="text-orange-500 font-semibold text-lg mb-4">
                        Step {currentStep + 1} of {totalSteps}
                      </p>
                      <p className="text-white text-2xl sm:text-3xl lg:text-4xl leading-relaxed font-medium">
                        {steps[currentStep]}
                      </p>

                      {/* Smart timer suggestion */}
                      {currentStepTimer && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="mt-8">
                          <motion.button
                            onClick={() => addTimer(currentStepTimer.seconds, `Step ${currentStep + 1}`)}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 transition-colors"
                          >
                            <ClockIcon className="h-5 w-5" />
                            Start {currentStepTimer.label} Timer
                          </motion.button>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }} className="text-center">
                      <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />
                      <p className="text-white text-3xl font-bold mb-2">All Done!</p>
                      <p className="text-stone-400 dark:text-stone-500 text-lg">Enjoy your {recipe?.name}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual timer buttons (only when no smart timer detected) */}
                {!currentStepTimer && activeTimers.length === 0 && doneTimers.length === 0 && (
                  <div className="mt-12 flex gap-3">
                    <p className="text-stone-500 text-sm self-center mr-2">Set timer:</p>
                    {[1, 5, 10, 15, 20, 30, 45, 60].map(min => (
                      <motion.button key={min}
                        onClick={() => addTimer(min * 60, `${min}m`)}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="rounded-full bg-stone-800 border border-stone-700 px-4 py-2 text-sm text-stone-300 hover:bg-stone-700 hover:text-white transition-colors">
                        {min}m
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation footer */}
              <div className="flex items-center justify-between px-8 py-6 bg-stone-800">
                <motion.button
                  onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
                  disabled={currentStep === 0}
                  whileHover={{ scale: currentStep === 0 ? 1 : 1.05 }}
                  whileTap={{ scale: currentStep === 0 ? 1 : 0.95 }}
                  className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${
                    currentStep === 0
                      ? "bg-stone-700 text-stone-500 cursor-not-allowed"
                      : "bg-stone-700 text-white hover:bg-stone-600"
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  Previous
                </motion.button>

                <div className="flex gap-1.5">
                  {steps.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentStep(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === currentStep ? "w-8 bg-orange-500"
                          : idx < currentStep ? "w-2.5 bg-orange-700" : "w-2.5 bg-stone-600"
                      }`} />
                  ))}
                </div>

                <motion.button
                  onClick={() => {
                    if (currentStep >= totalSteps - 1) onClose();
                    else setCurrentStep(prev => prev + 1);
                  }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
                >
                  {currentStep >= totalSteps - 1 ? "Finish" : "Next"}
                  {currentStep < totalSteps - 1 && <ChevronRightIcon className="h-5 w-5" />}
                </motion.button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
