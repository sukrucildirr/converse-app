import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { captureError } from "@/utils/capture-error"
import { notificationsLogger } from "@/utils/logger"

export function configureForegroundNotificationBehavior() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // Show alert even when app is in foreground
      shouldShowAlert: true,
      // Play sound when receiving notification
      shouldPlaySound: true,
      // Update badge count on app icon
      shouldSetBadge: true,
    }),
    handleSuccess: (notificationId) => {
      notificationsLogger.debug(`Successfully displayed notification: ${notificationId}`)
    },
    handleError: (notificationId, error) => {
      notificationsLogger.error(`Failed to display notification ${notificationId}: ${error}`)
    },
  })

  // Create notification channel for Android
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      enableVibrate: true,
    }).catch(captureError)
  }
}
