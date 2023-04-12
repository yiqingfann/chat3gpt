import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const chatRouter = createTRPCRouter({
  getResponse: publicProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.string(),
        content: z.string(),
      }))
    }))
    .query(({ input }) => {
      console.log("---input", input);

      return {
        curAssistantMessage: `Hello from tRPC!!`,
      };
    }),
});
