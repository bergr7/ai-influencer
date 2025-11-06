import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

const hitlSearchCheckpoint = createStep({
    id: "hitl-search-checkpoint",
    inputSchema: z.object({
        agentResponse: z.string(),
        resourceId: z.string(),
        threadId: z.string()
    }),
    suspendSchema: z.object({
        suspendResponse: z.string()
    }),
    resumeSchema: z.object({
        userInput: z.string().optional(),
    }),
    outputSchema: z.object({
        approved: z.boolean(),
        agentResponse: z.string(),
        resourceId: z.string(),
        threadId: z.string()
    }),
    execute: async ({ inputData, mastra, resumeData, suspend }) => {
        let { agentResponse, resourceId, threadId } = inputData;

        if (!resumeData) {
            return await suspend({
                suspendResponse: "Please review the search results: " + agentResponse
            });
        }

        // AFTER RESUME: Check if there is user input
        const { userInput } = resumeData ?? {};
        console.log("userInput", userInput);
        
        if (!userInput || userInput.trim() === "") {
            console.log("Approved.");
            return {
                approved: true,
                agentResponse: agentResponse,
                resourceId: resourceId,
                threadId: threadId
            }
        }

        // User provided input - we call aiInfluencerAgent to refine the search results
        const agent = mastra.getAgent("aiInfluencerAgent");
        const newResponse = await agent.generate(
            `Refine the search results based on the user input: ${userInput}`,
            {
                memory: {
                    thread: threadId,
                    resource: resourceId
                }
            }
        );
        if (!newResponse.text) {
            throw new Error("No response from agent");
        }
        return {
            approved: false,
            agentResponse: newResponse.text,
            resourceId: resourceId,
            threadId: threadId
        }
    }
});

export { hitlSearchCheckpoint };