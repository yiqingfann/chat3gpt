import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, rsp: NextApiResponse) => {
  const { userId } = getAuth(req);
  if (!userId) return rsp.status(401).json({ error: "Unauthorized" });

  // save new conversation to database
  const conversation = await prisma.conversation.create({ data: { userId: userId } });

  return rsp.status(200).json({ conversation });
}

export default handler;
