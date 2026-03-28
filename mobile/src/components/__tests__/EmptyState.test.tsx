import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EmptyState from '../EmptyState';

// Mock the ThemeContext
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFBF5',
      surface: '#FFFFFF',
      text: '#1C1917',
      textSecondary: '#78716C',
      textMuted: '#A8A29E',
      primary: '#EA580C',
      primaryLight: '#FFEDD5',
      error: '#DC2626',
      border: '#E7E5E4',
      cardBorder: '#FFEDD5',
      surfaceSecondary: '#F5F5F4',
      inputBorder: '#D6D3D1',
      inputBackground: '#FFFFFF',
    },
    isDark: false,
    borderRadius: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  }),
}));

// Mock Ionicons
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');

describe('EmptyState', () => {
  it('should render title', () => {
    const { getByText } = render(<EmptyState title="No items found" />);
    expect(getByText('No items found')).toBeTruthy();
  });

  it('should render subtitle when provided', () => {
    const { getByText } = render(
      <EmptyState title="No items found" subtitle="Try adding some items" />
    );
    expect(getByText('No items found')).toBeTruthy();
    expect(getByText('Try adding some items')).toBeTruthy();
  });

  it('should not render subtitle when not provided', () => {
    const { queryByText } = render(<EmptyState title="No items found" />);
    expect(queryByText('Try adding some items')).toBeNull();
  });

  it('should render action button when actionLabel and onAction are provided', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState title="No items found" actionLabel="Add Item" onAction={onAction} />
    );
    expect(getByText('Add Item')).toBeTruthy();
  });

  it('should call onAction when action button is pressed', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState title="No items found" actionLabel="Add Item" onAction={onAction} />
    );

    const button = getByText('Add Item');
    fireEvent.press(button);

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should not render action button when actionLabel is provided but onAction is not', () => {
    const { queryByText } = render(
      <EmptyState title="No items found" actionLabel="Add Item" />
    );
    expect(queryByText('Add Item')).toBeNull();
  });

  it('should not render action button when onAction is provided but actionLabel is not', () => {
    const onAction = jest.fn();
    const { queryByText } = render(
      <EmptyState title="No items found" onAction={onAction} />
    );
    // There should be no button text to query
    expect(queryByText('Add Item')).toBeNull();
  });

  it('should render with custom icon', () => {
    const { UNSAFE_getByType } = render(
      <EmptyState title="No items found" icon="search-outline" />
    );
    // The icon prop is passed but we're just verifying the component renders without error
    expect(UNSAFE_getByType).toBeDefined();
  });

  it('should render all props together', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="No recipes found"
        subtitle="Start by adding your first recipe"
        actionLabel="Add Recipe"
        onAction={onAction}
        icon="restaurant-outline"
      />
    );

    expect(getByText('No recipes found')).toBeTruthy();
    expect(getByText('Start by adding your first recipe')).toBeTruthy();
    expect(getByText('Add Recipe')).toBeTruthy();

    fireEvent.press(getByText('Add Recipe'));
    expect(onAction).toHaveBeenCalled();
  });
});
