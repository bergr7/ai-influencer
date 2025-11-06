import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

const discoveryStep = createStep({
    id: "discovery-step",
    inputSchema: z.object({
        query: z.string(),
        resourceId: z.string(),
        threadId: z.string()
    }),
    outputSchema: z.object({
        agentResponse: z.string(),
        resourceId: z.string(),
        threadId: z.string()
    }),
    execute: async ({ inputData, mastra }) => {
        const agent = mastra.getAgent("aiInfluencerAgent");
        const response = await agent.generate(inputData.query, {
            memory: {
                thread: inputData.threadId,
                resource: inputData.resourceId
            }
        });
        return { agentResponse: response.text || '', resourceId: inputData.resourceId, threadId: inputData.threadId }; /* TODO: Can ids go in context? */
    }
});

export { discoveryStep };