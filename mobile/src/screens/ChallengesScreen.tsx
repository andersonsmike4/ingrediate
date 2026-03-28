import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchTodayChallenge, submitChallenge, fetchChallengeHistory } from '../api/challenges';
import { CookingChallenge } from '../types';
import { scheduleDailyChallengeNotification } from '../services/notifications';
import useAsyncData from '../hooks/useAsyncData';
import SkeletonLoader from '../components/SkeletonLoader';
import { sharedStyles } from '../styles/shared';
import { formatDate } from '../utils/formatters';

interface ChallengeData {
  todayChallenge: CookingChallenge | null;
  history: CookingChallenge[];
}

export default function ChallengesScreen() {
  const { colors } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async (): Promise<ChallengeData> => {
    const [challengeData, historyData]: any[] = await Promise.all([
      fetchTodayChallenge(),
      fetchChallengeHistory(),
    ]);
    scheduleDailyChallengeNotification().catch(() => {});
    return {
      todayChallenge: challengeData.challenge || challengeData,
      history: challengeData.submissions || historyData.submissions || historyData || [],
    };
  }, []);

  const { data, loading, reload } = useAsyncData<ChallengeData>({
    fetchFn: fetchData,
    errorMessage: 'Failed to load challenges',
  });

  const todayChallenge = data?.todayChallenge ?? null;
  const history = data?.history ?? [];

  const handleSubmit = async () => {
    if (!todayChallenge) return;

    try {
      setSubmitting(true);
      await submitChallenge(todayChallenge.id, notes);
      Alert.alert('Success', 'Challenge completed!');
      setNotes('');
      await reload();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[sharedStyles.flex1, { backgroundColor: colors.background, padding: 16 }]}>
        <SkeletonLoader lines={4} style={{ marginBottom: 16 }} />
        <SkeletonLoader lines={3} />
      </View>
    );
  }

  return (
    <ScrollView style={[sharedStyles.flex1, { backgroundColor: colors.background }]}>
      {todayChallenge && (
        <View style={[sharedStyles.section, { borderBottomColor: colors.border }]}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.text }]}>Today's Challenge</Text>

          <View style={[sharedStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.challengeHeader}>
              <Text style={[styles.challengeText, { color: colors.text }]}>{todayChallenge.challenge_text}</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(todayChallenge.difficulty) }]}>
                <Text style={styles.difficultyText}>{todayChallenge.difficulty}</Text>
              </View>
            </View>

            {todayChallenge.tips && todayChallenge.tips.length > 0 && (
              <View style={styles.tipsSection}>
                <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips:</Text>
                {todayChallenge.tips.map((tip, index) => (
                  <Text key={index} style={[styles.tipText, { color: colors.textSecondary }]}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}

            {todayChallenge.submitted ? (
              <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.completedText}>Completed!</Text>
              </View>
            ) : (
              <View style={styles.submitSection}>
                <TextInput
                  style={[sharedStyles.input, { borderColor: colors.border, color: colors.text, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes (optional)"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
                <TouchableOpacity
                  style={[sharedStyles.primaryButton, { backgroundColor: colors.primary }, submitting && sharedStyles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <Text style={sharedStyles.primaryButtonText}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {history.length > 0 && (
        <View style={{ padding: 16 }}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.text }]}>Past Challenges</Text>
          {history.map((challenge) => (
            <View key={challenge.id} style={[sharedStyles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{formatDate(challenge.challenge_date)}</Text>
              <Text style={[styles.historyText, { color: colors.text }]}>{challenge.challenge_text}</Text>
              <View style={[styles.historyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}>
                <Text style={styles.historyBadgeText}>{challenge.difficulty}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  challengeHeader: {
    marginBottom: 16,
  },
  challengeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 24,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  tipsSection: {
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  completedBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitSection: {
    marginTop: 8,
  },
  historyDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  historyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
});
