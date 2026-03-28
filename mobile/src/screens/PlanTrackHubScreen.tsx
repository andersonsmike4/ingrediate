import React from 'react';
import TileHubScreen from '../components/TileHubScreen';

const TILES = [
  { label: 'Meal Plans', subtitle: 'Plan your week', icon: 'calendar-outline', screen: 'MealPlanner' },
  { label: 'Community', subtitle: 'Shared recipes', icon: 'people-outline', screen: 'CommunityFeed' },
  { label: 'Cooking History', subtitle: 'Past meals', icon: 'time-outline', screen: 'CookingHistory' },
  { label: 'Nutrition Goals', subtitle: 'Track intake', icon: 'bar-chart-outline', screen: 'Nutrition' },
  { label: 'Budget Tracker', subtitle: 'Spending trends', icon: 'wallet-outline', screen: 'Budget' },
  { label: 'Achievements', subtitle: 'Your badges', icon: 'trophy-outline', screen: 'Achievements' },
  { label: 'Daily Challenges', subtitle: 'Stay motivated', icon: 'flash-outline', screen: 'Challenges' },
];

export default function PlanTrackHubScreen() {
  return (
    <TileHubScreen
      title="Plan & Track"
      subtitle="Meal planning, goals, and progress"
      tiles={TILES}
    />
  );
}
