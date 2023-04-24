export type Message = {
  conversationId: string,
  messageNum: number,
  role: "user" | "assistant" | "system",
  content: string,
};
