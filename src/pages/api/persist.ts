import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Message } from "~/types";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, rsp: NextApiResponse) => {
  // IMPROVE: understand middleware and move it there
  const { userId } = getAuth(req);
  if (!userId) return rsp.status(401).json({ error: "Unauthorized" });

  const body = req.body as Message;
  const message = await prisma.message.create({ data: body });

  return rsp.status(200).json({ "message": message });
}

export default handler;
