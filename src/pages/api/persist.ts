import { PrismaClient } from "@prisma/client";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Message } from "~/types";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, rsp: NextApiResponse) => {
  const body = req.body as Message;
  const message = await prisma.message.create({ data: body });

  return rsp.status(200).json({ "message": message });
}

export default handler;
