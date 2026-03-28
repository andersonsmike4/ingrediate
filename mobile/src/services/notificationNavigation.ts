import { NavigationContainerRef } from '@react-navigation/native';

export function handleNotificationNavigation(
  data: Record<string, any>,
  navigationRef: NavigationContainerRef<any>
): void {
  if (!navigationRef.isReady()) return;

  const { category } = data;

  switch (category) {
    case 'pantry-expiry':
      (navigationRef as any).navigate('KitchenTab', { screen: 'PantryMain' });
      break;
    case 'meal-plan':
      (navigationRef as any).navigate('PlanTrackTab', {
        screen: 'MealPlanDetail',
        params: { planId: data.mealPlanId },
      });
      break;
    case 'daily-challenge':
      (navigationRef as any).navigate('PlanTrackTab', { screen: 'Challenges' });
      break;
  }
}
