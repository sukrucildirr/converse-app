import {
  getCurrentSenderEthAddress,
  useCurrentSenderEthAddress,
} from "@/features/multi-inbox/multi-inbox.store";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query";
import { markConversationAsUnread } from "@/features/conversation/conversation-metadata/conversation-metadata.api";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useMarkConversationAsUnread(args: {
  topic: ConversationTopic;
}) {
  const { topic } = args;

  const currentAccount = useCurrentSenderEthAddress()!;

  const { mutateAsync: markAsUnreadAsync } = useMutation({
    mutationFn: async () => {
      await markConversationAsUnread({
        account: currentAccount,
        topic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentSenderEthAddress()!;
      const previousData = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
      });

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: {
          unread: true,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentSenderEthAddress()!;
      if (context?.previousData) {
        updateConversationMetadataQueryData({
          account: currentAccount,
          topic,
          updateData: context.previousData,
        });
      }
    },
  });

  return {
    markAsUnreadAsync,
  };
}
