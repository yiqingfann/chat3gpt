import type { NextApiRequest, NextApiResponse } from "next";

const handler = (res: NextApiRequest, rsp: NextApiResponse) => {
  return rsp.status(200).json({ message: "Hello World" });
}

export default handler;
