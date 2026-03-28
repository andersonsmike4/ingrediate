import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import { PantryItem, MealPlan, MealPlanEntry } from '../types';

// Notification identifier constants
const NOTIFICATION_CATEGORIES = {
  PANTRY_EXPIRY: 'pantry-expiry',
  MEAL_PLAN: 'meal-plan',
  DAILY_CHALLENGE: 'daily-challenge',
};

/**
 * Convert a Date to a local date string (YYYY-MM-DD)
 * Avoids timezone issues from using .toISOString()
 */
function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Configure how notifications appear when app is foregrounded
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request permissions and register for push notifications
 * Returns the Expo push token if successful, null otherwise
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Only works on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('No project ID found for push notifications');
      return null;
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Store the token on the backend
    const platform = Platform.OS as 'ios' | 'android';
    await apiClient.post('/api/push_tokens', {
      token: pushToken.data,
      platform,
    });

    return pushToken.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Schedule local notifications for pantry items expiring within 2 days
 */
export async function schedulePantryExpiryReminders(
  pantryItems: PantryItem[]
): Promise<void> {
  // Cancel existing pantry expiry notifications
  await cancelNotificationsByCategory(NOTIFICATION_CATEGORIES.PANTRY_EXPIRY);

  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  for (const item of pantryItems) {
    if (!item.expires_at) {
      continue;
    }

    const expiryDate = new Date(item.expires_at);

    // Skip if expiry is more than 2 days away or already expired
    if (expiryDate > twoDaysFromNow || expiryDate < now) {
      continue;
    }

    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let notificationBody: string;
    if (daysUntilExpiry === 0) {
      notificationBody = `${item.name} expires today!`;
    } else if (daysUntilExpiry === 1) {
      notificationBody = `${item.name} expires tomorrow`;
    } else {
      notificationBody = `${item.name} expires in ${daysUntilExpiry} days`;
    }

    // Schedule notification for 8 AM on the expiry day
    const notificationTime = new Date(expiryDate);
    notificationTime.setHours(8, 0, 0, 0);

    // Only schedule if notification time is in the future
    if (notificationTime > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Pantry Item Expiring',
          body: notificationBody,
          data: {
            category: NOTIFICATION_CATEGORIES.PANTRY_EXPIRY,
            itemId: item.id,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationTime,
        },
      });
    }
  }
}

/**
 * Schedule morning notifications for today's meal plan entries
 */
export async function scheduleMealPlanReminders(
  mealPlan: MealPlan
): Promise<void> {
  // Cancel existing meal plan notifications
  await cancelNotificationsByCategory(NOTIFICATION_CATEGORIES.MEAL_PLAN);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateString(today);

  // Filter entries for today
  const todayEntries = mealPlan.meal_plan_entries.filter(
    (entry) => entry.date === todayStr
  );

  if (todayEntries.length === 0) {
    return;
  }

  // Group entries by meal type
  const mealsByType: { [key: string]: MealPlanEntry[] } = {};
  for (const entry of todayEntries) {
    if (!mealsByType[entry.meal_type]) {
      mealsByType[entry.meal_type] = [];
    }
    mealsByType[entry.meal_type].push(entry);
  }

  // Schedule notifications based on meal type
  for (const [mealType, entries] of Object.entries(mealsByType)) {
    let notificationHour = 7; // Default to 7 AM

    // Set appropriate times for different meal types
    if (mealType.toLowerCase() === 'lunch') {
      notificationHour = 11;
    } else if (mealType.toLowerCase() === 'dinner') {
      notificationHour = 16; // 4 PM
    }

    const notificationTime = new Date();
    notificationTime.setHours(notificationHour, 0, 0, 0);

    // Only schedule if notification time is in the future
    const now = new Date();
    if (notificationTime <= now) {
      continue;
    }

    // Build notification body
    let body: string;
    if (entries.length === 1) {
      const entry = entries[0];
      if (entry.eating_out) {
        body = `Eating out for ${mealType}`;
      } else if (entry.saved_recipe) {
        body = `Today's ${mealType}: ${entry.saved_recipe.name}`;
      } else if (entry.note) {
        body = `${mealType}: ${entry.note}`;
      } else {
        body = `Don't forget about ${mealType}!`;
      }
    } else {
      body = `You have ${entries.length} items planned for ${mealType}`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Meal Plan Reminder - ${mealType}`,
        body,
        data: {
          category: NOTIFICATION_CATEGORIES.MEAL_PLAN,
          mealPlanId: mealPlan.id,
          mealType,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationTime,
      },
    });
  }
}

/**
 * Schedule a daily notification at 9 AM reminding about the cooking challenge
 */
export async function scheduleDailyChallengeNotification(): Promise<void> {
  // Cancel existing daily challenge notifications
  await cancelNotificationsByCategory(NOTIFICATION_CATEGORIES.DAILY_CHALLENGE);

  // Schedule for 9 AM today
  const notificationTime = new Date();
  notificationTime.setHours(9, 0, 0, 0);

  // If 9 AM has passed, schedule for tomorrow
  const now = new Date();
  if (notificationTime <= now) {
    notificationTime.setDate(notificationTime.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Cooking Challenge',
      body: 'Ready to try something new? Check out today\'s cooking challenge!',
      data: {
        category: NOTIFICATION_CATEGORIES.DAILY_CHALLENGE,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    }
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancel notifications for a specific category
 */
async function cancelNotificationsByCategory(category: string): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    const notificationCategory = notification.content.data?.category;
    if (notificationCategory === category) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
  }
}
