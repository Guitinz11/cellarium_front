export type ChatRole = "employee" | "warehouse";

export type ChatMessage = {
  id: string;
  requestId: string;
  role: ChatRole;
  author: string;
  text: string;
  sentAt: string;
};

const chatStorageKey = "cellarium-request-chats";

function readMessages(): ChatMessage[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(chatStorageKey) ?? "[]");
    if (!Array.isArray(stored)) return [];

    return stored.filter((item): item is ChatMessage =>
      typeof item === "object" && item !== null &&
      typeof item.id === "string" &&
      typeof item.requestId === "string" &&
      (item.role === "employee" || item.role === "warehouse") &&
      typeof item.author === "string" &&
      typeof item.text === "string" &&
      typeof item.sentAt === "string",
    );
  } catch {
    return [];
  }
}

export function getRequestMessages(requestId: string): ChatMessage[] {
  return readMessages()
    .filter((message) => message.requestId === requestId)
    .sort((first, second) => first.sentAt.localeCompare(second.sentAt));
}

export function saveChatMessage(message: ChatMessage) {
  window.localStorage.setItem(chatStorageKey, JSON.stringify([...readMessages(), message]));
  window.dispatchEvent(new Event("cellarium-chat-updated"));
}