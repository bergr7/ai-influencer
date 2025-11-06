import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

const draftGenerationStep = createStep({
    id: "draft-generation-step",
    inputSchema: z.object({
        approved: z.boolean(),
        agentResponse: z.string(),
        resourceId: z.string(),
        threadId: z.string()
    }),
    outputSchema: z.object({
        agentResponse: z.string(), // ! We work with natural language responses for now
        resourceId: z.string(),
        threadId: z.string()
    }),
    execute: async ({ inputData, mastra }) => {
        const agent = mastra.getAgent("aiInfluencerAgent");
        const response = await agent.generate(
            `Generate 2-3 content options based on: ${inputData.agentResponse}`, {
            memory: {
                thread: inputData.threadId,
                resource: inputData.resourceId
            }
        });
        return { agentResponse: response.text || '', resourceId: inputData.resourceId, threadId: inputData.threadId };
    }
});

export { draftGenerationStep };