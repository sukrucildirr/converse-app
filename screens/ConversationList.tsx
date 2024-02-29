import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  useColorScheme,
  Text,
  View,
  TextInput,
} from "react-native";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";
import { SearchBarCommands } from "react-native-screens";

import ConversationFlashList from "../components/ConversationFlashList";
import NewConversationButton from "../components/ConversationList/NewConversationButton";
import RequestsButton from "../components/ConversationList/RequestsButton";
import EphemeralAccountBanner from "../components/EphemeralAccountBanner";
import InitialLoad from "../components/InitialLoad";
import Recommendations from "../components/Recommendations/Recommendations";
import NoResult from "../components/Search/NoResult";
import Welcome from "../components/Welcome";
import { refreshProfileForAddress } from "../data/helpers/profiles/profilesUpdate";
import {
  useChatStore,
  useSettingsStore,
  useProfilesStore,
  currentAccount,
} from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { useSelect } from "../data/store/storeHelpers";
import {
  textPrimaryColor,
  backgroundColor,
  itemSeparatorColor,
} from "../utils/colors";
import {
  LastMessagePreview,
  getConversationListItemsToDisplay,
} from "../utils/conversation";
import { converseEventEmitter } from "../utils/events";
import { useHeaderSearchBar } from "./Navigation/ConversationListNav";
import { NavigationParamList } from "./Navigation/Navigation";
import { useIsSplitScreen } from "./Navigation/navHelpers";

type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};
type FlatListItem = ConversationWithLastMessagePreview | { topic: string };

type Props = {
  searchBarRef:
    | React.MutableRefObject<SearchBarCommands | null>
    | React.MutableRefObject<TextInput | null>;
} & NativeStackScreenProps<NavigationParamList, "Chats">;

function ConversationList({ navigation, route, searchBarRef }: Props) {
  const styles = useStyles();
  const {
    searchQuery,
    searchBarFocused,
    initialLoadDoneOnce,
    sortedConversationsWithPreview,
    openedConversationTopic,
    setSearchQuery,
  } = useChatStore(
    useSelect([
      "initialLoadDoneOnce",
      "searchQuery",
      "setSearchQuery",
      "searchBarFocused",
      "sortedConversationsWithPreview",
      "openedConversationTopic",
    ])
  );

  const { ephemeralAccount } = useSettingsStore(
    useSelect(["peersStatus", "ephemeralAccount"])
  );
  const profiles = useProfilesStore((s) => s.profiles);
  const [flatListItems, setFlatListItems] = useState<{
    items: FlatListItem[];
    searchQuery: string;
  }>({ items: [], searchQuery: "" });

  // Display logic
  const showInitialLoad =
    !initialLoadDoneOnce && flatListItems.items.length <= 1;
  const showNoResult = flatListItems.items.length === 0 && !!searchQuery;

  // Welcome screen
  const showWelcome =
    !searchQuery &&
    !searchBarFocused &&
    sortedConversationsWithPreview.conversationsInbox.length === 0;

  const isSplit = useIsSplitScreen();

  useEffect(() => {
    if (!initialLoadDoneOnce) {
      // First login, let's refresh the profile
      refreshProfileForAddress(currentAccount(), currentAccount());
    }
  }, [initialLoadDoneOnce]);

  useEffect(() => {
    const listItems = getConversationListItemsToDisplay(
      searchQuery,
      sortedConversationsWithPreview.conversationsInbox,
      profiles
    );
    setFlatListItems({ items: listItems, searchQuery });
  }, [
    searchQuery,
    sortedConversationsWithPreview.conversationsInbox,
    profiles,
  ]);

  // Search bar hook
  useHeaderSearchBar({
    navigation,
    route,
    searchBarRef,
  });

  useEffect(() => {
    // In split screen, when selecting a convo with search active,
    // let's clear the search
    if (isSplit && openedConversationTopic) {
      setSearchQuery("");
      (searchBarRef.current as any)?.clearText?.();
    }
  }, [isSplit, openedConversationTopic, searchBarRef, setSearchQuery]);

  const ListHeaderComponents: React.ReactElement[] = [];
  const showSearchTitleHeader =
    (Platform.OS === "ios" && searchBarFocused && !showNoResult) ||
    (Platform.OS === "android" && searchBarFocused);
  if (showSearchTitleHeader) {
    ListHeaderComponents.push(
      <View key="search" style={styles.searchTitleContainer}>
        <Text style={styles.searchTitle}>Chats</Text>
      </View>
    );
  } else if (sortedConversationsWithPreview.conversationsRequests.length > 0) {
    ListHeaderComponents.push(
      <RequestsButton
        key="requests"
        navigation={navigation}
        route={route}
        requestsCount={
          sortedConversationsWithPreview.conversationsRequests.length
        }
      />
    );
  }

  let ListFooterComponent: React.ReactElement | undefined = undefined;
  if (showInitialLoad) {
    ListFooterComponent = <InitialLoad />;
  } else if (showWelcome) {
    ListFooterComponent = (
      <Welcome ctaOnly={false} navigation={navigation} route={route} />
    );
  } else {
    if (ephemeralAccount && !showNoResult && !showSearchTitleHeader) {
      ListHeaderComponents.push(<EphemeralAccountBanner key="ephemeral" />);
    }
    if (!searchQuery) {
      ListFooterComponent = (
        <Welcome ctaOnly navigation={navigation} route={route} />
      );
    } else if (showNoResult) {
      ListFooterComponent = <NoResult navigation={navigation} />;
    }
  }

  return (
    <>
      <ConversationFlashList
        route={route}
        navigation={navigation}
        onScroll={() => {
          converseEventEmitter.emit("conversationList-scroll");
          searchBarRef.current?.blur();
        }}
        itemsForSearchQuery={flatListItems.searchQuery}
        items={showInitialLoad || showWelcome ? [] : flatListItems.items}
        ListHeaderComponent={
          ListHeaderComponents.length > 0 ? (
            <>{ListHeaderComponents}</>
          ) : undefined
        }
        ListFooterComponent={ListFooterComponent}
      />
      <Recommendations navigation={navigation} visibility="HIDDEN" />
      {(Platform.OS === "android" || Platform.OS === "web") && (
        <NewConversationButton navigation={navigation} route={route} />
      )}
    </>
  );
}

export default gestureHandlerRootHOC(ConversationList);

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    searchTitleContainer: {
      ...Platform.select({
        default: {
          padding: 10,
          paddingLeft: 16,
          backgroundColor: backgroundColor(colorScheme),
          borderBottomColor: itemSeparatorColor(colorScheme),
          borderBottomWidth: 0.5,
        },
        android: {
          padding: 10,
          paddingLeft: 16,
          borderBottomWidth: 0,
        },
      }),
    },
    searchTitle: {
      ...Platform.select({
        default: {
          fontSize: 22,
          fontWeight: "bold",
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 11,
          textTransform: "uppercase",
          fontWeight: "bold",
          color: textPrimaryColor(colorScheme),
        },
      }),
    },
    scrollViewWrapper: {
      backgroundColor: backgroundColor(colorScheme),
    },
  });
};
