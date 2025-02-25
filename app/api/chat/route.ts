import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

// Use the specific assistant ID from the OpenAI playground
const ASSISTANT_ID = process.env.ASSISTANT_ID || "asst_lVJFmwqFwiSXnDM5BZbGYfEN";

export async function POST(req: Request) {
  console.log("API called: /api/chat");
  
  try {
    // Parse the request body
    const { messages: chatMessages } = await req.json();
    console.log("Received messages:", JSON.stringify(chatMessages).substring(0, 100) + "...");
    
    // Create a thread
    console.log("Creating thread...");
    const thread = await openai.beta.threads.create();
    console.log("Thread created:", thread.id);

    // Add only the last user message to the thread to minimize API calls
    const lastUserMessage = chatMessages.filter((m: any) => m.role === 'user').pop();
    if (lastUserMessage) {
      console.log("Adding last user message to thread...");
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: lastUserMessage.content,
      });
      console.log("Message added to thread");
    }

    // Run the assistant on the thread
    console.log("Running assistant...");
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });
    console.log("Run created:", run.id);

    // Return immediately with the IDs needed for polling
    return NextResponse.json({
      threadId: thread.id,
      runId: run.id,
      status: 'polling_required'
    });
    
  } catch (error: unknown) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}