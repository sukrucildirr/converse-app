import React, { memo, useCallback, useEffect, useMemo, useRef } from "react"
import { NativeScrollEvent, NativeSyntheticEvent, Platform } from "react-native"
import { FadeInDown } from "react-native-reanimated"
import { AnimatedVStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useConversationComposerStore } from "@/features/conversation/conversation-chat/conversation-composer/conversation-composer.store-context"
import { ConversationConsentPopupDm } from "@/features/conversation/conversation-chat/conversation-consent-popup/conversation-consent-popup-dm"
import { ConversationConsentPopupGroup } from "@/features/conversation/conversation-chat/conversation-consent-popup/conversation-consent-popup-group"
import { ConversationMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message"
import { ConversationMessageLayout } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-layout"
import { ConversationMessageReactions } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-reactions/conversation-message-reactions"
import { ConversationMessageRepliable } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-repliable"
import { ConversationMessageStatus } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-status/conversation-message-status"
import { ConversationMessageTimestamp } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-timestamp"
import { ConversationMessageContextStoreProvider } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import { isAnActualMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { ConversationMessagesList } from "@/features/conversation/conversation-chat/conversation-messages-list.component"
import { useConversationMessagesQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { useConversationIsUnread } from "@/features/conversation/conversation-list/hooks/use-conversation-is-unread"
import { IConversation } from "@/features/conversation/conversation.types"
import { useMarkConversationAsRead } from "@/features/conversation/hooks/use-mark-conversation-as-read"
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import { CONVERSATION_LIST_REFRESH_THRESHOLD } from "../conversation-list/conversation-list.contstants"
import { ConversationMessageHighlighted } from "./conversation-message/conversation-message-highlighted"
import { IConversationMessage } from "./conversation-message/conversation-message.types"
import { useMessageHasReactions } from "./conversation-message/hooks/use-message-has-reactions"
import { getConversationNextMessage } from "./conversation-message/utils/get-conversation-next-message"
import { getConversationPreviousMessage } from "./conversation-message/utils/get-conversation-previous-message"
import { DmConversationEmpty, GroupConversationEmpty } from "./conversation.screen"
import { useCurrentXmtpConversationId } from "./conversation.store-context"

export const ConversationMessages = memo(function ConversationMessages(props: {
  conversation: IConversation
}) {
  const { conversation } = props

  const currentSender = useSafeCurrentSender()

  const xmtpConversationId = useCurrentXmtpConversationId()!

  const refreshingRef = useRef(false)

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch: refetchMessages,
  } = useConversationMessagesQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
    caller: "Conversation Messages",
  })

  const latestMessageIdByCurrentUser = useMemo(() => {
    return messages?.ids?.find(
      (messageId) =>
        isAnActualMessage(messages.byId[messageId]) &&
        messages.byId[messageId].senderInboxId === currentSender.inboxId,
    )
  }, [messages?.ids, messages?.byId, currentSender.inboxId])

  const { isUnread } = useConversationIsUnread({
    xmtpConversationId,
  })

  const { markAsReadAsync } = useMarkConversationAsRead({
    xmtpConversationId,
  })

  // TODO: Need improvment but okay for now
  useEffect(() => {
    if (isUnread && !messagesLoading) {
      markAsReadAsync().catch(captureError)
    }
  }, [isUnread, messagesLoading, markAsReadAsync])

  const handleRefresh = useCallback(async () => {
    try {
      refreshingRef.current = true
      await refetchMessages()
    } catch (e) {
      captureError(e)
    } finally {
      refreshingRef.current = false
    }
  }, [refetchMessages])

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (refreshingRef.current && !isRefetchingMessages) return
      if (e.nativeEvent.contentOffset.y < CONVERSATION_LIST_REFRESH_THRESHOLD) {
        handleRefresh()
      }
    },
    [handleRefresh, isRefetchingMessages],
  )

  const allMessages = Object.values(messages?.byId ?? {})

  return (
    <ConversationMessagesList
      messages={allMessages}
      refreshing={isRefetchingMessages}
      onRefresh={Platform.OS === "android" ? refetchMessages : undefined}
      onScroll={onScroll}
      ListEmptyComponent={
        isConversationDm(conversation) ? <DmConversationEmpty /> : <GroupConversationEmpty />
      }
      ListHeaderComponent={
        !isConversationAllowed(conversation) ? (
          isConversationDm(conversation) ? (
            <ConversationConsentPopupDm />
          ) : (
            <ConversationConsentPopupGroup />
          )
        ) : undefined
      }
      renderMessage={({ message, index }) => {
        const previousMessage = getConversationPreviousMessage({
          messageId: message.xmtpId,
          xmtpConversationId,
        })
        const nextMessage = getConversationNextMessage({
          messageId: message.xmtpId,
          xmtpConversationId,
        })
        return (
          <ConversationMessagesListItem
            message={message}
            previousMessage={previousMessage}
            nextMessage={nextMessage}
            isLatestMessageSentByCurrentUser={latestMessageIdByCurrentUser === message.xmtpId}
            animateEntering={
              index === 0 &&
              // Need this because otherwise because our optimistic updates, we first create a dummy message with a random id
              // and then replace it with the real message. But the replacment triggers a new element in the list because we use messageId as key extractor
              // Maybe we can have a better solution in the future. Just okay for now until we either have better serialization
              // or have better ways to handle optimistic updates.
              // @ts-expect-error until we have better serialization and have our own message type
              message.deliveryStatus === "sending"
            }
          />
        )
      }}
    />
  )
})

const ConversationMessagesListItem = memo(function ConversationMessagesListItem(props: {
  message: IConversationMessage
  previousMessage: IConversationMessage | undefined
  nextMessage: IConversationMessage | undefined
  isLatestMessageSentByCurrentUser: boolean
  animateEntering: boolean
}) {
  const {
    message,
    previousMessage,
    nextMessage,
    isLatestMessageSentByCurrentUser,
    animateEntering,
  } = props
  const { theme } = useAppTheme()
  const composerStore = useConversationComposerStore()

  const handleReply = useCallback(() => {
    composerStore.getState().setReplyToMessageId(message.xmtpId)
  }, [composerStore, message])

  const messageHasReactions = useMessageHasReactions({
    xmtpMessageId: message.xmtpId,
  })

  return (
    <ConversationMessageContextStoreProvider
      message={message}
      previousMessage={previousMessage}
      nextMessage={nextMessage}
    >
      <AnimatedVStack
        {...(animateEntering && {
          entering: FadeInDown.springify()
            .damping(theme.animation.spring.damping)
            .stiffness(theme.animation.spring.stiffness)
            .withInitialValues({
              transform: [
                {
                  translateY: 60,
                },
              ],
            }),
        })}
      >
        <ConversationMessageTimestamp />
        <ConversationMessageRepliable onReply={handleReply}>
          <ConversationMessageLayout
            message={
              <ConversationMessageHighlighted>
                <ConversationMessage message={message} />
              </ConversationMessageHighlighted>
            }
            reactions={messageHasReactions && <ConversationMessageReactions />}
            messageStatus={
              isLatestMessageSentByCurrentUser && (
                <ConversationMessageStatus status={message.status} />
              )
            }
          />
        </ConversationMessageRepliable>
      </AnimatedVStack>
    </ConversationMessageContextStoreProvider>
  )
})
