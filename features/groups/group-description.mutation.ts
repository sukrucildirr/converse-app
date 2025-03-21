import { useMutation } from "@tanstack/react-query"
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@/features/groups/group.query"
import { updateXmtpGroupDescription } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { IGroup } from "./group.types"

type IArgs = {
  inboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}

export function useGroupDescriptionMutation(args: IArgs) {
  const { inboxId, xmtpConversationId } = args
  const { data: group } = useGroupQuery({ clientInboxId: inboxId, xmtpConversationId })

  return useMutation({
    mutationFn: async (description: string) => {
      if (!group || !inboxId || !xmtpConversationId) {
        throw new Error("Missing required data in useGroupDescriptionMutation")
      }

      await updateXmtpGroupDescription({
        clientInboxId: inboxId,
        groupId: group.xmtpId,
        description,
      })

      return description
    },
    onMutate: async (description: string) => {
      const previousGroup = getGroupQueryData({ clientInboxId: inboxId, xmtpConversationId })
      const updates: Partial<IGroup> = { description }

      if (previousGroup) {
        updateGroupQueryData({ clientInboxId: inboxId, xmtpConversationId, updates })
      }

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      const { previousGroup } = context || {}

      const updates: Partial<IGroup> = { description: previousGroup?.description ?? "" }

      updateGroupQueryData({ clientInboxId: inboxId, xmtpConversationId, updates })
    },
  })
}
