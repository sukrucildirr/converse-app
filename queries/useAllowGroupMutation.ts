import { useGroupId } from "@hooks/useGroupId";
import { queryClient } from "@queries/queryClient";
import { useMutation, MutationObserver } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import {
  consentToGroupsOnProtocol,
  consentToGroupsOnProtocolByAccount,
} from "@utils/xmtpRN/contacts";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

import { allowGroupMutationKey } from "./MutationKeys";
import {
  cancelGroupConsentQuery,
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";

export type AllowGroupMutationProps = {
  account: string;
  topic: string;
  groupId: string;
};

export const createAllowGroupMutationObserver = ({
  account,
  topic,
  groupId,
}: AllowGroupMutationProps) => {
  const allowGroupMutationObserver = new MutationObserver(queryClient, {
    mutationKey: allowGroupMutationKey(account, topic),
    mutationFn: async () => {
      //       export const consentToGroupsOnProtocol = async ({
      //   client,
      //   groupIds,
      //   consent,
      // }: ConsentToGroupsOnProtocolParams) => {
      await consentToGroupsOnProtocol(account, [groupId], "allow");
      return "allowed";
    },
    onMutate: async () => {
      await cancelGroupConsentQuery(account, topic);
      const previousConsent = getGroupConsentQueryData(account, topic);
      setGroupConsentQueryData(account, topic, "allowed");
      return { previousConsent };
    },
    onError: (error, _variables, context) => {
      logger.warn("onError useAllowGroupMutation");
      sentryTrackError(error);
      if (context?.previousConsent === undefined) {
        return;
      }
      setGroupConsentQueryData(account, topic, context.previousConsent);
    },
    onSuccess: () => {
      logger.debug("onSuccess useAllowGroupMutation");
    },
  });
  return allowGroupMutationObserver;
};

export const useAllowGroupMutation = (account: string, topic: string) => {
  const { groupId } = useGroupId(topic);
  // >>>>>>> bd191fb2 (feat: Add Dependency Control Pattern)
  return useMutation({
    mutationKey: allowGroupMutationKey(account, topic),
    mutationFn: async () => {
      if (!topic || !account) {
        return;
      }
      await consentToGroupsOnProtocolByAccount(
        account,
        [getV3IdFromTopic(topic)],
        "allow"
      );
      return "allowed";
    },
    onMutate: async () => {
      await cancelGroupConsentQuery(account, topic);
      const previousConsent = getGroupConsentQueryData(account, topic);
      setGroupConsentQueryData(account, topic, "allowed");
      return { previousConsent };
    },
    onError: (error, _variables, context) => {
      logger.warn("onError useAllowGroupMutation");
      sentryTrackError(error);
      if (context?.previousConsent === undefined) {
        return;
      }
      setGroupConsentQueryData(account, topic, context.previousConsent);
    },
    onSuccess: () => {
      logger.debug("onSuccess useAllowGroupMutation");
    },
  });
};
