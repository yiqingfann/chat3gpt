import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, rsp: NextApiResponse) => {
  // authentication
  const { userId } = getAuth(req);
  if (!userId) return rsp.status(401).json({ error: "Unauthenticated" });

  const { conversationId } = req.query;
  if (!conversationId) return rsp.status(400).json({ error: "Missing conversationId" });

  // authorization
  // TODO

  // get all messags in a conversation
  const messages = await prisma.message.findMany({
    where: { conversationId: conversationId as string },
    orderBy: { messageNum: "asc" },
  });
  return rsp.status(200).json({ messages });
}

export default handler;
