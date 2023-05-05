import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Message } from "~/types";
import { isAuthorized } from "~/utils/utils";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, rsp: NextApiResponse) => {
  // authentication
  const { userId } = getAuth(req);
  if (!userId) return rsp.status(401).json({ error: "Unauthenticated" });

  if (req.method === "GET") {
    const { conversationId } = req.query;
    if (!conversationId) return rsp.status(400).json({ error: "Missing conversationId" });

    // check if the user is authorized to get the messages
    const authorized = await isAuthorized(userId, conversationId as string);
    if (!authorized) return rsp.status(401).json({ error: "Unauthorized" });

    // get all messags in a conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId as string },
      select: { role: true, content: true },
      orderBy: { messageNum: "asc" },
    });

    return rsp.status(200).json({ messages });
  } else if (req.method === "POST") {
    const body = req.body as Message;
    const message = await prisma.message.create({ data: body });

    return rsp.status(200).json({ "message": message });
  }
}

export default handler;
