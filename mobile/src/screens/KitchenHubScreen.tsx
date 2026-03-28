import React from 'react';
import TileHubScreen from '../components/TileHubScreen';

const TILES = [
  { label: 'My Pantry', subtitle: 'Track your ingredients', icon: 'cube-outline', screen: 'PantryMain' },
  { label: 'Scan Receipt', subtitle: 'Auto-add from photo', icon: 'receipt-outline', screen: 'ReceiptScan' },
  { label: 'Kitchen Timers', subtitle: 'Multiple timers', icon: 'timer-outline', screen: 'KitchenTimers' },
  { label: 'Substitutions', subtitle: 'Find alternatives', icon: 'swap-horizontal-outline', screen: 'Substitutions' },
  { label: 'Smart Suggestions', subtitle: 'Based on your pantry', icon: 'sparkles-outline', screen: 'SmartSuggestions' },
];

export default function KitchenHubScreen() {
  return (
    <TileHubScreen
      title="Kitchen"
      subtitle="Your cooking tools and pantry"
      tiles={TILES}
    />
  );
}
