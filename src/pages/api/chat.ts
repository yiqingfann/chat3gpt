import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, type ChatCompletionRequestMessage, OpenAIApi } from "openai";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

type ChatApiRequestBody = {
  messages: ChatCompletionRequestMessage[];
};

const handler = async (req: NextApiRequest, rsp: NextApiResponse) => {
  // extract messages from request
  const messages = (req.body as ChatApiRequestBody).messages;
  if (!messages) return rsp.status(400).json({ message: "Cannot find messages in request" });
  console.log(`---messages = ${JSON.stringify(messages, null, 2)}`);

  // invoke OpenAI API to get assistant message
  const chatRsp = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messages,
  });
  const curAssistantMessage = chatRsp.data.choices[0]?.message;
  if (!curAssistantMessage) return rsp.status(502).json({ message: "Cannot get message from assistant" });
  console.log(`---curAssistantMessage = ${JSON.stringify(curAssistantMessage, null, 2)}`);

  // return assistant message
  return rsp.status(200).json({ curAssistantMessage: curAssistantMessage });
}

export default handler;
