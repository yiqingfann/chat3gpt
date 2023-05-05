import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const isAuthorized = async (userId: string, conversationId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { conversationId: conversationId },
  });
  if (!conversation) return false;
  if (conversation.userId !== userId) return false; // Q: different http status code and error message?
  return true;
}
