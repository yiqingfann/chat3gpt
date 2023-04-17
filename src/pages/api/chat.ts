import { OpenAIStream } from "~/utils/OpenAIStream";

import type { ChatCompletionRequestMessage } from "openai";
import type { OpenAIStreamPayload } from "~/utils/OpenAIStream";

type ChatApiRequestBody = {
  messages?: ChatCompletionRequestMessage[];
};

export const config = {
  runtime: "edge",
};

const handler = async (req: Request) => {
  // extract messages from request
  const { messages } = await req.json() as ChatApiRequestBody;
  if (!messages) return new Response("Cannot find messages in request", { status: 400 });
  console.log(`---messages = ${JSON.stringify(messages, null, 2)}`);

  const payload: OpenAIStreamPayload = {
    model: "gpt-3.5-turbo",
    messages: messages,
    stream: true,
  };
  const stream = await OpenAIStream(payload);
  return new Response(stream);
}

export default handler;
