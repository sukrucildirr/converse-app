import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { memo } from "react";
import { useColorScheme } from "react-native";

import { authScreensSharedScreenOptions } from "../screens/Navigation/Navigation";
import { stackGroupScreenOptions } from "../screens/Navigation/navHelpers";
import { OnboardingNotificationsScreen } from "@/features/onboarding/screens/onboarding-notifications-screen";
import { OnboardingWelcomeScreen } from "@/features/onboarding/screens/onboarding-welcome-screen";
import { OnboardingContactCardScreen } from "@/features/onboarding/screens/onboarding-contact-card-screen";

type OnboardingParamList = {
  OnboardingWelcome: undefined;
  OnboardingCreateContactCard: undefined;

  OnboardingGetStarted: undefined;
  OnboardingNotifications: undefined;
};

const OnboardingNativeStack = createNativeStackNavigator<OnboardingParamList>();

/**
 * Used for split screen layout
 */
export const OnboardingNavigator = memo(function OnboardingNavigator() {
  const colorScheme = useColorScheme();

  return (
    <OnboardingNativeStack.Navigator>
      {/* Auth / Onboarding */}
      <OnboardingNativeStack.Group
        screenOptions={{
          ...stackGroupScreenOptions(colorScheme),
          ...authScreensSharedScreenOptions,
        }}
      >
        <OnboardingNativeStack.Screen
          options={{
            headerShown: false,
          }}
          name="OnboardingWelcome"
          component={OnboardingWelcomeScreen}
        />
        <OnboardingNativeStack.Screen
          options={{
            headerShown: false,
          }}
          name="OnboardingCreateContactCard"
          component={OnboardingContactCardScreen}
        />
        <OnboardingNativeStack.Screen
          name="OnboardingNotifications"
          component={OnboardingNotificationsScreen}
        />
      </OnboardingNativeStack.Group>
    </OnboardingNativeStack.Navigator>
  );
});
