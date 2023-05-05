import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthorized } from "~/utils/utils";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, rsp: NextApiResponse) => {
  const { userId } = getAuth(req);
  if (!userId) return rsp.status(401).json({ error: "Unauthenticated" });

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
    // get the conversation ID and new title from user
    const { conversationId } = req.query;
    if (!conversationId) return rsp.status(400).json({ error: "Conversation API handler: Missing conversationId" });
    const { newTitle } = req.body as { newTitle: string };
    if (!newTitle) return rsp.status(400).json({ error: "Conversation API handler: Missing newTitle" });

    // check if the user is authorized to update the conversation
    const authorized = await isAuthorized(userId, conversationId as string);
    if (!authorized) return rsp.status(401).json({ error: "Unauthorized" });

    // update the conversation title
    const conversation = await prisma.conversation.update({
      where: { conversationId: conversationId as string },
      data: { title: newTitle },
    });
    return rsp.status(200).json({ conversation });
  } else if (req.method === "DELETE") {
    // delete conversation from database
    const { conversationId } = req.query;
    if (!conversationId) return rsp.status(400).json({ error: "Conversation API handler: Missing conversationId" });

    // check if the user is authorized to delete the conversation
    const authorized = await isAuthorized(userId, conversationId as string);
    if (!authorized) return rsp.status(401).json({ error: "Unauthorized" });

    const conversation = await prisma.conversation.delete({
      where: { conversationId: conversationId as string }
    });
    return rsp.status(200).json({ conversation });
  }
}

export default handler;
