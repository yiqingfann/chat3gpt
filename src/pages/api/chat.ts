import { OpenAIStream } from "~/utils/OpenAIStream";

import type { ChatCompletionRequestMessage } from "openai";
import type { OpenAIStreamPayload } from "~/utils/OpenAIStream";
import { getAuth } from "@clerk/nextjs/server";
import { type RequestLike } from "@clerk/nextjs/dist/server/types";

type ChatApiRequestBody = {
  messages?: ChatCompletionRequestMessage[];
};

export const config = {
  runtime: "edge",
};

const handler = async (req: Request) => {
  const { userId } = getAuth(req as RequestLike);
  if (!userId) return new Response("Unauthenticated", { status: 401, statusText: "Unauthenticated" });

  // extract messages from request
  const { messages } = await req.json() as ChatApiRequestBody;
  if (!messages) return new Response("Cannot find messages in request", { status: 400 });

  const payload: OpenAIStreamPayload = {
    model: "gpt-3.5-turbo",
    messages: messages,
    stream: true,
  };
  const stream = await OpenAIStream(payload);
  return new Response(stream);
}

export default handler;
