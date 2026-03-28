export type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryBorder: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  error: string;
  success: string;
  cardBorder: string;
  inputBorder: string;
  inputBackground: string;
  orange50: string;
  orange100: string;
  orange600: string;
  orange700: string;
  blue500: string;
  red100: string;
  red600: string;
  red700: string;
  stone100: string;
  stone200: string;
  stone500: string;
  stone700: string;
  stone900: string;
  // Alias
  secondary: string;
};

export const lightColors: ThemeColors = {
  primary: '#EA580C',
  primaryLight: '#FFEDD5',
  primaryBorder: '#FED7AA',
  background: '#FFFBF5',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F4',
  text: '#1C1917',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  border: '#E7E5E4',
  borderLight: '#FFF7ED',
  error: '#DC2626',
  success: '#16A34A',
  cardBorder: '#FFEDD5',
  inputBorder: '#D6D3D1',
  inputBackground: '#FFFFFF',
  orange50: '#FFF7ED',
  orange100: '#FFEDD5',
  orange600: '#EA580C',
  orange700: '#C2410C',
  blue500: '#3B82F6',
  red100: '#FEE2E2',
  red600: '#DC2626',
  red700: '#B91C1C',
  stone100: '#F5F5F4',
  stone200: '#E7E5E4',
  stone500: '#78716C',
  stone700: '#44403C',
  stone900: '#1C1917',
  secondary: '#78716C',
};

export const darkColors: ThemeColors = {
  primary: '#EA580C',
  primaryLight: 'rgba(234,88,12,0.15)',
  primaryBorder: 'rgba(234,88,12,0.3)',
  background: '#1C1917',
  surface: '#292524',
  surfaceSecondary: '#44403C',
  text: '#FAFAF9',
  textSecondary: '#A8A29E',
  textMuted: '#78716C',
  border: '#44403C',
  borderLight: '#44403C',
  error: '#EF4444',
  success: '#22C55E',
  cardBorder: '#44403C',
  inputBorder: '#57534E',
  inputBackground: '#1C1917',
  orange50: 'rgba(234,88,12,0.1)',
  orange100: 'rgba(234,88,12,0.15)',
  orange600: '#EA580C',
  orange700: '#FB923C',
  blue500: '#60A5FA',
  red100: 'rgba(239,68,68,0.15)',
  red600: '#EF4444',
  red700: '#F87171',
  stone100: '#44403C',
  stone200: '#57534E',
  stone500: '#A8A29E',
  stone700: '#D6D3D1',
  stone900: '#FAFAF9',
  secondary: '#A8A29E',
};

// Static values that don't change with theme
export const theme = {
  colors: lightColors,
  borderRadius: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
};
