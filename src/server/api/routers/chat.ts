import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import { Configuration, OpenAIApi, type ChatCompletionRequestMessage } from "openai";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export const chatRouter = createTRPCRouter({
  getResponse: publicProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.string(),
        content: z.string(),
      }))
    }))
    .query(async ({ input }) => {
      console.log("---input", JSON.stringify(input, null, 2));

      const rsp = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: input.messages as ChatCompletionRequestMessage[],
      });

      const curAssistantMessage = rsp.data.choices[0]?.message;

      console.log("---curAssistantMessage", JSON.stringify(curAssistantMessage, null, 2));

      return {
        curAssistantMessage: curAssistantMessage,
      };
    }),
});
