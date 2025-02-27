import { AssistantResponse } from 'ai'
import OpenAI from 'openai'

// Configure maximum duration for Edge function (in seconds)
export const maxDuration = 60

// Configure runtime as Edge
export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Type for tool call function
interface ToolCallFunction {
  name: string;
  arguments: string;
}

// Type for tool call
interface ToolCall {
  id: string;
  type: 'function';
  function: ToolCallFunction;
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const input: {
      threadId: string | null;
      message: string;
    } = await req.json()

    // Create a thread if needed
    const threadId = input.threadId ?? (await openai.beta.threads.create({})).id

    // Add the user message to the thread
    const createdMessage = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: input.message,
    })

    return AssistantResponse(
      { threadId, messageId: createdMessage.id },
      async ({ forwardStream }) => {
        // Run the assistant on the thread
        const runStream = openai.beta.threads.runs.stream(threadId, {
          assistant_id: process.env.ASSISTANT_ID ?? (() => {
            throw new Error('ASSISTANT_ID is not set')
          })(),
        })

        // Forward run status and stream message deltas
        let runResult = await forwardStream(runStream)

        // Handle any required actions (like tool calls)
        while (
          runResult?.status === 'requires_action' &&
          runResult.required_action?.type === 'submit_tool_outputs'
        ) {
          const tool_outputs = runResult.required_action.submit_tool_outputs.tool_calls.map(
            (toolCall: ToolCall) => {
              // We're not using the parameters yet, but keeping them parsed for future use
              JSON.parse(toolCall.function.arguments)
              // Add tool handling here if needed
              throw new Error(`Unknown tool call function: ${toolCall.function.name}`)
            }
          )

          runResult = await forwardStream(
            openai.beta.threads.runs.submitToolOutputsStream(threadId, runResult.id, {
              tool_outputs,
            })
          )
        }

        // If run failed, throw an error
        if (runResult?.status === 'failed') {
          throw new Error(runResult.last_error?.message ?? 'Run failed')
        }
      }
    )
  } catch (error: unknown) {
    console.error('API error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}