import { memo, useCallback } from "react"
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller"
import { interpolate, useAnimatedStyle } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { Button } from "@/design-system/Button/Button"
import { AnimatedVStack } from "@/design-system/VStack"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAddGroupMembersStore } from "@/features/groups/group-details/add-group-members/stores/add-group-members.store"
import { useAddGroupMembersMutation } from "@/features/groups/group-members/use-add-group-members.mutation"
import { useGroupQuery } from "@/features/groups/useGroupQuery"
import { useRouteParams, useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"

export const AddGroupMembersConfirmButton = memo(function AddGroupMembersConfirmButton() {
  const { progress, height } = useReanimatedKeyboardAnimation()
  const { theme } = useAppTheme()
  const insets = useSafeAreaInsets()
  const { groupTopic } = useRouteParams<"AddGroupMembers">()
  const router = useRouter()

  const selectedInboxIds = useAddGroupMembersStore((state) => state.selectedInboxIds)

  const { mutateAsync: addGroupMembers } = useAddGroupMembersMutation()

  const { data: group } = useGroupQuery({
    account: getSafeCurrentSender().ethereumAddress,
    topic: groupTopic,
  })

  const handlePress = useCallback(async () => {
    try {
      if (!group) {
        throw new Error("Group not found")
      }

      showSnackbar({
        message: `Added ${selectedInboxIds.length} ${
          selectedInboxIds.length === 1 ? "member" : "members"
        }`,
      })

      router.goBack()

      await addGroupMembers({
        group: group,
        inboxIds: selectedInboxIds,
      })
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Failed to add group members",
      })
    }
  }, [selectedInboxIds, addGroupMembers, group, router])

  const as = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: height.value }],
      paddingBottom: interpolate(
        progress.value,
        [0, 1],
        [insets.bottom + theme.spacing.sm, theme.spacing.sm],
        "clamp",
      ),
    }
  })

  if (selectedInboxIds.length === 0) {
    return null
  }

  return (
    <AnimatedVStack
      style={[
        {
          padding: theme.spacing.sm,
        },
        as,
      ]}
    >
      <Button onPress={handlePress}>{`Invite ${selectedInboxIds.length}`}</Button>
    </AnimatedVStack>
  )
})
