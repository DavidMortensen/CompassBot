import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request) {
  console.log("API called: /api/chat/status");
  
  try {
    // Parse the request body
    const { threadId, runId } = await req.json();
    
    if (!threadId || !runId) {
      return NextResponse.json({ error: 'Missing threadId or runId' }, { status: 400 });
    }
    
    console.log(`Checking status for thread ${threadId}, run ${runId}`);
    
    // Get the run status
    const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    console.log("Run status:", runStatus.status);
    
    if (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      // Still processing
      return NextResponse.json({
        status: runStatus.status,
        completed: false
      });
    }
    
    if (runStatus.status !== 'completed') {
      // Run failed or was cancelled
      console.log("Run failed with status:", runStatus.status);
      return NextResponse.json({
        status: runStatus.status,
        completed: true,
        error: `Run ended with status: ${runStatus.status}`
      });
    }
    
    // Get the assistant's response
    console.log("Getting messages from thread...");
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Find the first assistant message
    const assistantMessage = messages.data.find((msg) => msg.role === 'assistant');
    
    if (!assistantMessage) {
      console.log("No assistant message found");
      return NextResponse.json({
        status: 'completed',
        completed: true,
        error: 'No response from assistant'
      });
    }
    
    console.log("Found assistant message");
    
    // Extract text from the message content
    let content = "";
    
    try {
      if (Array.isArray(assistantMessage.content)) {
        for (const part of assistantMessage.content) {
          if (part.type === 'text') {
            content += part.text.value;
          }
        }
      } else {
        console.log("Unexpected message content format:", JSON.stringify(assistantMessage.content));
        content = "I apologize, but I couldn't process your request properly.";
      }
    } catch (contentError) {
      console.error("Error processing message content:", contentError);
      content = "I apologize, but there was an error processing the response.";
    }
    
    console.log("Sending response:", content.substring(0, 100) + "...");
    
    // Return the assistant's response
    return NextResponse.json({
      status: 'completed',
      completed: true,
      message: {
        role: "assistant",
        content: content,
        id: assistantMessage.id,
      }
    });
    
  } catch (error: unknown) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 