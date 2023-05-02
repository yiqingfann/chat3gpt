import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, rsp: NextApiResponse) => {
  const { userId } = getAuth(req);
  if (!userId) return rsp.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    // get all conversations for user
    const conversations = await prisma.conversation.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });
    return rsp.status(200).json({ conversations });
  } else if (req.method === "POST") {
    // save new conversation to database
    const conversation = await prisma.conversation.create({ data: { userId: userId } });
    return rsp.status(200).json({ conversation });
  } else if (req.method === "PUT") {
    // update conversation title
    const { conversationId } = req.query;
    if (!conversationId) return rsp.status(400).json({ error: "Conversation API handler: Missing conversationId" });

    const { newTitle } = req.body as { newTitle: string };
    if (!newTitle) return rsp.status(400).json({ error: "Conversation API handler: Missing newTitle" });

    const conversation = await prisma.conversation.update({
      where: { conversationId: conversationId as string },
      data: { title: newTitle },
    });
    return rsp.status(200).json({ conversation });
  } else if (req.method === "DELETE") {
    // delete conversation from database
    const { conversationId } = req.query;
    if (!conversationId) return rsp.status(400).json({ error: "Conversation API handler: Missing conversationId" });

    const conversation = await prisma.conversation.delete({
      where: { conversationId: conversationId as string }
    });
    return rsp.status(200).json({ conversation });
  }
}

export default handler;
