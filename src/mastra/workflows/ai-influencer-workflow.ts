import {createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { discoveryStep } from "./steps/discovery";
import { hitlSearchCheckpoint } from "./steps/hitl-search-ckpt";
import { draftGenerationStep } from "./steps/draft-generation";
import { hitlDraftCheckpoint } from "./steps/hitl-draft-ckpt";

export const aiInfluencerWorkflow = createWorkflow ({
    id: "ai-influencer-workflow",
    inputSchema: z.object({
        query: z.string(),
        resourceId: z.string(), // User ID for memory
        threadId: z.string()    // Conversation thread
    }),
    outputSchema: z.object({
        // posted: z.boolean(),
        // tweetId: z.string().optional(),
        // finalResponse: z.string()
        agentResponse: z.string(),
    }),
    steps: [discoveryStep, hitlSearchCheckpoint, draftGenerationStep],
})
    .then(discoveryStep)
    .dountil(
        hitlSearchCheckpoint,
        ({ inputData }) => Promise.resolve(inputData.approved === true)
    )
    .then(draftGenerationStep)
    .dountil(
        hitlDraftCheckpoint,
        ({ inputData }) => Promise.resolve(inputData.approved === true)
    )
    .commit();