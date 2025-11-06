# HITL Implementation Plan: Agent + Workflow Quality Gates

## Architecture Overview

**Approach**: Implement a workflow that calls the same agent multiple times with HITL checkpoints between autonomous phases.

**Key Insight**: The agent maintains full capabilities (tools, MCP, reasoning) and conversation context throughout the workflow by using the same `thread` and `resource` identifiers in every step.

```
Workflow: AI Influencer HITL Flow
├─ Step 1: Agent Discovery (Autonomous)
│  └─ Agent searches tweets, analyzes relevance and write discoveries to be presented to the user
├─ Step 2: HITL Checkpoint - Review Findings (Suspend/Resume)
│  └─ Present discoveries, get approval to proceed to the next step
│  └─ If search refinement requested: call agent → loop back to step 1
├─ Step 3: Agent Draft Generation (Autonomous)
│  └─ Agent creates 2-3 content options based on the approved discoveries and write them to be presented to the user
├─ Step 4: HITL Checkpoint - Approve/Refine (Suspend/Resume with Loop)
│  └─ Present drafts, get selection or refinement request
│  └─ If content refinement requested: call agent → loop back to step 3
└─ Step 5: Agent Execution (Autonomous)
   └─ Agent posts approved content using the MCP tools
```

---

## Why This Approach

### Benefits
- ✅ **Agent autonomy preserved**: Full tool access and reasoning in each step
- ✅ **Conversation continuity**: Same thread/resource maintains memory across steps
- ✅ **Human control gates**: HITL checkpoints prevent unwanted actions
- ✅ **Flexible refinement**: Loop allows multi-turn improvement
- ✅ **Scalable**: Easy to add/remove approval gates
- ✅ **Observable**: Each step's input/output is trackable via snapshots
- ✅ **Resumable**: Workflow snapshots persist across server restarts

### Key Patterns
- **Agent memory persistence**: Pass same `threadId` and `resourceId` to every `agent.generate()` call
- **Structured output**: Use `structuredOutput` to get JSON responses from agent for consistency
- **Suspend/Resume**: Use `suspendSchema` and `resumeSchema` to define HITL contracts
- **Conditional loops**: Use `dountil()` to loop refinement step until approved

---

## Workflow Structure Skeleton

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

export const aiInfluencerHitlWorkflow = createWorkflow({
  id: "ai-influencer-hitl-workflow",
  inputSchema: z.object({
    query: z.string().optional(),
    resourceId: z.string(), // User ID for memory
    threadId: z.string()    // Conversation thread
  }),
  outputSchema: z.object({
    posted: z.boolean(),
    tweetId: z.string().optional(),
    finalResponse: z.string()
  })
})
  .then(discoveryStep)
  .then(reviewDiscoveryCheckpoint)
  .then(draftGenerationStep)
  .dountil(
    approvalRefinementLoop,
    ({ inputData }) => inputData.approved === true
  )
  .then(executionStep)
  .commit();
```

**Reasoning**:
- Linear flow with strategic HITL gates
- `dountil` enables iterative refinement
- Each step receives memory identifiers to maintain context

---

## Step 1: Agent Discovery (Autonomous)

### Purpose
Let the agent search and analyze tweets using MCP tools autonomously and write the discoveries to be presented to the user.

See [discovery step](../src/mastra/workflows/steps/discovery.ts)

**Reasoning**:
- Agent uses MCP `fetch_tweets` and `read_tweet` tools autonomously
- Structured output ensures consistent data format
- Memory context preserves conversation state
- Agent decides which tweets are relevant (autonomy preserved)

---

## Step 2: Review Discovery Checkpoint (HITL)

### Purpose
Human reviews discovered tweets before proceeding to draft generation. User can ask agent to refine the search results as many times as needed.

See [hitl search checkpoint](../src/mastra/workflows/steps/hitl-search-ckpt.ts)

**Reasoning**:
- `suspend()` pauses workflow and persists snapshot to the database
- `suspendSchema` defines what user sees
- `resumeSchema` defines what user must provide. In this case, it's a string input from the user.
- Workflow resumes only when user submits an empty string -> Approved

---

## Step 3: Agent Draft Generation (Autonomous)

### Purpose
Agent generates 2-3 content options based on approved tweets.

### Skeleton

```typescript
const draftGenerationStep = createStep({
  id: "draft-generation-step",
  inputSchema: /* approved candidates + memory IDs */,
  outputSchema: z.object({
    options: z.array(z.object({
      id: z.number(),
      type: z.enum(["original", "quote", "reply"]),
      text: z.string(),
      targetTweetId: z.string().optional(),
      rationale: z.string()
    })),
    agentRecommendation: z.string(),
    resourceId: z.string(),
    threadId: z.string()
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("aiInfluencerAgent");

    const response = await agent.generate(
      `Generate 2-3 content options based on: ${JSON.stringify(inputData.approvedCandidates)}`,
      {
        memory: {
          thread: inputData.threadId,
          resource: inputData.resourceId
        },
        structuredOutput: { schema: /* ... */ }
      }
    );

    return { ...response.object, /* pass memory IDs */ };
  }
});
```

**Reasoning**:
- Agent has full autonomy to craft engaging content
- Agent remembers previous discovery phase via memory
- Structured output ensures consistent format for UI display

---

## Step 4: Approval/Refinement Loop (HITL + Conditional Agent)

### Purpose
Human approves content OR requests refinement, which triggers agent to regenerate.

See [approval/refinement loop](../src/mastra/workflows/steps/approval-refinement-loop.ts)

**Reasoning**:
- `suspend()` pauses workflow and persists snapshot to the database
- `suspendSchema` defines what user sees
- `resumeSchema` defines what user must provide. In this case, it's a string input from the user.
- Workflow resumes only when user submits an empty string -> Approved

---

The execution will happen after this with the user interacting with the agent via chat. See [chat with agent](../scripts/run-workflow-then-chat.ts)

---

## Storage & Registration

- PostgreSQL required for workflow snapshots (suspend/resume)
- Same storage used for agent memory and workflow state
- Both agent and workflow must be registered

---

## Memory Continuity Pattern

### How Memory Persists Across Steps

```typescript
// Step 1: Agent discovers tweets
const discovery = await agent.generate("Find tweets", {
  memory: { thread: "session-abc", resource: "user-123" }
});

// Memory saved: User's request + Agent's findings

// Step 3: Agent drafts content (remembers step 1)
const drafts = await agent.generate("Create drafts", {
  memory: { thread: "session-abc", resource: "user-123" } // Same IDs
});
...
```

**Reasoning**:
- Agent builds up conversation context across workflow
- Each `generate()` call adds to memory
- Agent can reference previous steps naturally
- Memory makes agent appear as single continuous conversation