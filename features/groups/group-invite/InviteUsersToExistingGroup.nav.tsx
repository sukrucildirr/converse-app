// import {
//   NativeStack,
//   navigationAnimation,
// } from "@/screens/Navigation/Navigation";
// import { Platform } from "react-native";
// import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types";
// import { useColorScheme } from "react-native";
// import { InviteUsersToExistingGroupScreen } from "./invite-users-to-exisiting-group.screen";
// import { translate } from "@/i18n";
// import {
//   headerTitleStyle,
//   textPrimaryColor,
//   textSecondaryColor,
// } from "@/styles/colors";

// export type InviteUsersToExistingGroupParams = {
//   addingToGroupTopic: IXmtpConversationTopic;
// };

// export function InviteUsersToExistingGroupNav() {
//   const colorScheme = useColorScheme();
//   return (
//     <NativeStack.Screen
//       name="InviteUsersToExistingGroup"
//       component={InviteUsersToExistingGroupScreen}
//       options={({ route }) => ({
//         headerTitle: translate("group_info"),
//         headerTintColor:
//           Platform.OS === "android"
//             ? textSecondaryColor(colorScheme)
//             : textPrimaryColor(colorScheme),
//         animation: navigationAnimation,
//         headerTitleStyle: headerTitleStyle(colorScheme),
//       })}
//     />
//   );
// }
