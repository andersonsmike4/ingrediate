import React, { useState } from "react";
import { motion } from "framer-motion";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

function getNextMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = ((1 - day) + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

const MEAL_TIMES = {
  breakfast: { hour: 8, duration: 1 },
  lunch: { hour: 12, duration: 1 },
  dinner: { hour: 18, duration: 1.5 },
};

export default function CalendarExport({ mealPlan }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!mealPlan?.meal_plan_entries?.length) {
      toast.error("No meals to export");
      return;
    }

    setExporting(true);

    try {
      const monday = getNextMonday();
      let icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Ingrediate//Meal Plan//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
      ];

      mealPlan.meal_plan_entries.forEach(entry => {
        if (!entry.saved_recipe) return;

        const dayDate = new Date(monday);
        dayDate.setDate(dayDate.getDate() + entry.day_of_week);

        const mealTime = MEAL_TIMES[entry.meal_type] || MEAL_TIMES.dinner;
        const start = new Date(dayDate);
        start.setHours(mealTime.hour, 0, 0, 0);

        const end = new Date(start);
        end.setHours(start.getHours() + mealTime.duration, start.getMinutes() + (mealTime.duration % 1) * 60);

        const recipe = entry.saved_recipe;
        const ingredients = (recipe.ingredients || []).map(i =>
          `${i.amount ? i.amount + " " : ""}${i.name}`
        ).join("\\n");

        icsContent.push(
          "BEGIN:VEVENT",
          `DTSTART:${formatICSDate(start)}`,
          `DTEND:${formatICSDate(end)}`,
          `SUMMARY:${entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)}: ${recipe.name}`,
          `DESCRIPTION:${recipe.description || ""}\\n\\nIngredients:\\n${ingredients}`,
          `UID:${Date.now()}-${entry.id}@ingrediate`,
          "END:VEVENT"
        );
      });

      icsContent.push("END:VCALENDAR");

      const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meal-plan.ics";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Meal plan exported to calendar!");
    } catch (err) {
      toast.error("Failed to export calendar");
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.button
      onClick={handleExport}
      disabled={exporting}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 rounded-lg bg-white border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-50"
    >
      <CalendarIcon className="h-5 w-5" />
      {exporting ? "Exporting..." : "Export to Calendar"}
    </motion.button>
  );
}
