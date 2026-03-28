import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import AnimatedListItem from './AnimatedListItem';

interface Tile {
  label: string;
  subtitle: string;
  icon: string;
  screen: string;
}

interface TileHubScreenProps {
  title: string;
  subtitle: string;
  tiles: Tile[];
}

export default function TileHubScreen({ title, subtitle, tiles }: TileHubScreenProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const tileWidth = (width - 16 * 2 - 16) / 2;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.grid}>
        {tiles.map((tile, index) => (
          <AnimatedListItem key={tile.screen} index={index}>
            <TouchableOpacity
              style={[
                styles.tile,
                {
                  width: tileWidth,
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={() => (navigation as any).navigate(tile.screen)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${tile.label}: ${tile.subtitle}`}
            >
              <View style={[styles.tileIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name={tile.icon as any} size={28} color={colors.primary} />
              </View>
              <Text style={[styles.tileLabel, { color: colors.text }]}>{tile.label}</Text>
              <Text style={[styles.tileSubtitle, { color: colors.textSecondary }]}>{tile.subtitle}</Text>
            </TouchableOpacity>
          </AnimatedListItem>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  tileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  tileLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  tileSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
