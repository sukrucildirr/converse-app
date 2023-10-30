import { In } from "typeorm/browser";

import { getLensHandleFromConversationIdAndPeer } from "../../../utils/lens";
import { saveConversationIdentifiersForNotifications } from "../../../utils/notifications";
import { getRepository } from "../../db";
import { getExistingDataSource } from "../../db/datasource";
import { Conversation } from "../../db/entities/conversationEntity";
import { upsertRepository } from "../../db/upsert";
import { xmtpConversationToDb } from "../../mappers";
import { getChatStore, getProfilesStore } from "../../store/accountsStore";
import { XmtpConversation } from "../../store/chatStore";
import { refreshProfilesIfNeeded } from "../profiles/profilesUpdate";
import { upgradePendingConversationsIfNeeded } from "./pendingConversations";

export const saveConversations = async (
  account: string,
  conversations: XmtpConversation[],
  forceUpdate = false
) => {
  const chatStoreState = getChatStore(account).getState();
  const alreadyKnownConversations: XmtpConversation[] = [];
  const conversationsToUpsert: XmtpConversation[] = [];
  conversations.forEach((c) => {
    if (!chatStoreState.conversations[c.topic] || forceUpdate) {
      conversationsToUpsert.push(c);
    } else {
      alreadyKnownConversations.push(c);
    }
  });

  // Save immediatly to db the new ones
  const newlySavedConversations = await setupAndSaveConversations(
    account,
    conversationsToUpsert
  );
  // Then to context so it show immediatly even without handle
  chatStoreState.setConversations(newlySavedConversations);

  // Let's find out which need to have the profile updated
  const knownProfiles = getProfilesStore(account).getState().profiles;
  const convosWithProfilesToUpdate: XmtpConversation[] = [];
  const now = new Date().getTime();
  [alreadyKnownConversations, newlySavedConversations].forEach(
    (conversationList) => {
      conversationList.forEach((c) => {
        const existingProfile = knownProfiles[c.peerAddress];
        const lastProfileUpdate = existingProfile?.updatedAt || 0;
        const shouldUpdateProfile = now - lastProfileUpdate >= 24 * 3600 * 1000;
        if (shouldUpdateProfile) {
          convosWithProfilesToUpdate.push(c);
        }
      });
    }
  );
  refreshProfilesIfNeeded(account);
};

const setupAndSaveConversations = async (
  account: string,
  conversations: XmtpConversation[]
): Promise<XmtpConversation[]> => {
  // If there are here conversations newly created that correspond to
  // pending convos in our local db, let's update them
  await upgradePendingConversationsIfNeeded(account, conversations);

  const conversationRepository = await getRepository(account, "conversation");
  const alreadyConversationInDbWithTopics = await conversationRepository.find({
    where: { topic: In(conversations.map((c) => c.topic)) },
  });
  const alreadyConversationsByTopic: {
    [topic: string]: Conversation | undefined;
  } = {};
  alreadyConversationInDbWithTopics.forEach((c) => {
    alreadyConversationsByTopic[c.topic] = c;
  });

  const conversationsToUpsert: Conversation[] = [];
  conversations.forEach((conversation) => {
    const alreadyConversationInDbWithTopic =
      alreadyConversationsByTopic[conversation.topic];
    const profileSocials =
      getProfilesStore(account).getState().profiles[conversation.peerAddress]
        ?.socials;

    const lensHandle = getLensHandleFromConversationIdAndPeer(
      conversation.context?.conversationId,
      profileSocials?.lensHandles
    );
    const ensName =
      profileSocials?.ensNames?.find((e) => e.isPrimary)?.name || null;
    const unsDomain =
      profileSocials?.unstoppableDomains?.find((e) => e.isPrimary)?.domain ||
      null;

    // If this is a lens convo we show lens, if not ENS
    conversation.conversationTitle = lensHandle || ensName || unsDomain;
    conversation.readUntil =
      conversation.readUntil ||
      alreadyConversationInDbWithTopic?.readUntil ||
      0;
    conversationsToUpsert.push(xmtpConversationToDb(conversation));
    saveConversationIdentifiersForNotifications(conversation);
  });

  // Let's save by batch to avoid hermes issues
  let batch: Conversation[] = [];
  let rest = conversationsToUpsert;
  while (rest.length > 0) {
    batch = rest.slice(0, 5000);
    rest = rest.slice(5000);
    await upsertRepository(conversationRepository, batch, ["topic"], false);
  }

  return conversations;
};

export const markAllConversationsAsReadInDb = async (account: string) => {
  const dataSource = getExistingDataSource(account);
  if (!dataSource) return;
  await dataSource.query(
    `UPDATE "conversation" SET "readUntil" = (SELECT COALESCE(MAX(sent), 0) FROM "message" WHERE "message"."conversationId" = "conversation"."topic")`
  );
};

export const markConversationReadUntil = async (
  account: string,
  topic: string,
  readUntil: number
) => {
  const conversationRepository = await getRepository(account, "conversation");
  await conversationRepository.update({ topic }, { readUntil });
};
