import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { getConversationIdFromTopic } from "./get-conversation-id-from-topic"

describe("getConversationIdFromTopic", () => {
  it("should return the group id from a topic with prefix", () => {
    const topic = "/xmtp/mls/1/g-854565fa1fbb235e241a80e370095740/proto" as ConversationTopic
    const groupId = getConversationIdFromTopic(topic)
    expect(groupId).toBe("854565fa1fbb235e241a80e370095740")
  })

  it("should return the group id from a topic without prefix", () => {
    const topic = "854565fa1fbb235e241a80e370095740" as ConversationTopic
    const groupId = getConversationIdFromTopic(topic)
    expect(groupId).toBe("854565fa1fbb235e241a80e370095740")
  })
})
