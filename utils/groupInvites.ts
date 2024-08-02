import mmkv from "./mmkv";

const GROUP_INVITE_LINKS_STORAGE_KEY_PREFIX = "group-invites-link-";

export const createGroupInviteLinkStoragekey = (topic: string) => {
  return `${GROUP_INVITE_LINKS_STORAGE_KEY_PREFIX}${topic}`;
};

export const saveGroupInviteLink = (inviteId: string, groupId: string) => {
  return mmkv.set(createGroupInviteLinkStoragekey(inviteId), groupId);
};

export const deleteGroupInviteLink = (inviteId: string) => {
  return mmkv.delete(createGroupInviteLinkStoragekey(inviteId));
};
