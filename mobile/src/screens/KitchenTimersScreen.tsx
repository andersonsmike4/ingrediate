import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

interface Timer {
  id: string;
  name: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isComplete: boolean;
}

const PRESET_TIMERS = [
  { label: '1 min', seconds: 60 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
];

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function KitchenTimersScreen() {
  const { colors, borderRadius } = useTheme();
  const [timers, setTimers] = useState<Timer[]>([]);
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerMinutes, setNewTimerMinutes] = useState('');
  const [newTimerSeconds, setNewTimerSeconds] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setTimers(prev => prev.map(timer => {
      if (!timer.isRunning || timer.isComplete) return timer;
      const newRemaining = timer.remainingSeconds - 1;
      if (newRemaining <= 0) {
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
        return { ...timer, remainingSeconds: 0, isRunning: false, isComplete: true };
      }
      return { ...timer, remainingSeconds: newRemaining };
    }));
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick]);

  const addTimer = (presetSeconds?: number) => {
    let totalSeconds = presetSeconds || 0;
    let name = newTimerName.trim() || 'Timer';

    if (!presetSeconds) {
      const mins = parseInt(newTimerMinutes) || 0;
      const secs = parseInt(newTimerSeconds) || 0;
      totalSeconds = mins * 60 + secs;
      if (totalSeconds <= 0) {
        Alert.alert('Invalid Time', 'Please enter a valid duration');
        return;
      }
    } else {
      name = `${presetSeconds >= 60 ? Math.floor(presetSeconds / 60) + ' min' : presetSeconds + ' sec'} timer`;
    }

    const timer: Timer = {
      id: Date.now().toString(),
      name,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: true,
      isComplete: false,
    };

    setTimers(prev => [timer, ...prev]);
    setNewTimerName('');
    setNewTimerMinutes('');
    setNewTimerSeconds('');
  };

  const toggleTimer = (id: string) => {
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, isRunning: !t.isRunning } : t
    ));
  };

  const resetTimer = (id: string) => {
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, remainingSeconds: t.totalSeconds, isRunning: false, isComplete: false } : t
    ));
  };

  const removeTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const getProgress = (timer: Timer): number => {
    if (timer.totalSeconds === 0) return 0;
    return ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Quick Presets */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Start</Text>
        <View style={styles.presetRow}>
          {PRESET_TIMERS.map((preset) => (
            <TouchableOpacity
              key={preset.seconds}
              style={[styles.presetButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.full }]}
              onPress={() => addTimer(preset.seconds)}
            >
              <Ionicons name="timer-outline" size={16} color={colors.primary} />
              <Text style={[styles.presetText, { color: colors.text }]}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Timer */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Custom Timer</Text>
        <View style={[styles.customTimerCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.xl }]}>
          <TextInput
            style={[styles.nameInput, { borderColor: colors.inputBorder, color: colors.text, borderRadius: borderRadius.md }]}
            placeholder="Timer name (optional)"
            placeholderTextColor={colors.textMuted}
            value={newTimerName}
            onChangeText={setNewTimerName}
          />
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputGroup}>
              <TextInput
                style={[styles.timeInput, { borderColor: colors.inputBorder, color: colors.text, borderRadius: borderRadius.md }]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={newTimerMinutes}
                onChangeText={setNewTimerMinutes}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>min</Text>
            </View>
            <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>
            <View style={styles.timeInputGroup}>
              <TextInput
                style={[styles.timeInput, { borderColor: colors.inputBorder, color: colors.text, borderRadius: borderRadius.md }]}
                placeholder="00"
                placeholderTextColor={colors.textMuted}
                value={newTimerSeconds}
                onChangeText={setNewTimerSeconds}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>sec</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]} onPress={() => addTimer()}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Start Timer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Timers */}
      {timers.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Timers ({timers.length})</Text>
          {timers.map((timer) => (
            <View
              key={timer.id}
              style={[
                styles.timerCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: borderRadius.xl },
                timer.isComplete && [styles.timerCardComplete, { borderColor: colors.success }],
              ]}
            >
              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${getProgress(timer)}%`, backgroundColor: colors.primary },
                    timer.isComplete && [styles.progressBarComplete, { backgroundColor: colors.success }],
                  ]}
                />
              </View>

              <View style={styles.timerContent}>
                <View style={styles.timerInfo}>
                  <Text style={[styles.timerName, { color: colors.textSecondary }]}>{timer.name}</Text>
                  <Text
                    style={[
                      styles.timerDisplay,
                      { color: colors.text },
                      timer.isComplete && [styles.timerDisplayComplete, { color: colors.success }],
                    ]}
                  >
                    {timer.isComplete ? 'Done!' : formatTime(timer.remainingSeconds)}
                  </Text>
                  <Text style={[styles.timerTotal, { color: colors.textMuted }]}>
                    of {formatTime(timer.totalSeconds)}
                  </Text>
                </View>

                <View style={styles.timerActions}>
                  {!timer.isComplete && (
                    <TouchableOpacity
                      style={[styles.timerActionButton, { backgroundColor: colors.background }]}
                      onPress={() => toggleTimer(timer.id)}
                    >
                      <Ionicons
                        name={timer.isRunning ? 'pause' : 'play'}
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.timerActionButton, { backgroundColor: colors.background }]}
                    onPress={() => resetTimer(timer.id)}
                  >
                    <Ionicons name="refresh" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timerActionButton, { backgroundColor: colors.background }]}
                    onPress={() => removeTimer(timer.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {timers.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="timer-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No timers running</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Use quick presets above or create a custom timer
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  customTimerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
  },
  timerCardComplete: {
    borderColor: theme.colors.success,
    backgroundColor: '#F0FDF4',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: theme.colors.border,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: theme.colors.primary,
  },
  progressBarComplete: {
    backgroundColor: theme.colors.success,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  timerInfo: {
    flex: 1,
  },
  timerName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  timerDisplay: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  timerDisplayComplete: {
    color: theme.colors.success,
  },
  timerTotal: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  timerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  timerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
