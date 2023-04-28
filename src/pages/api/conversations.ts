import { PrismaClient } from "@prisma/client";

import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, rsp: NextApiResponse) => {
  const conversation = await prisma.conversation.create({ data: { userId: "frank" } });

  return rsp.status(200).json({ conversation });
}

export default handler;
