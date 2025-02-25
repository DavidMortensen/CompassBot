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

    // Add the conversation messages to the thread
    console.log("Adding messages to thread...");
    
    for (const message of chatMessages) {
      if (message.role === 'user') {
        await openai.beta.threads.messages.create(thread.id, {
          role: 'user',
          content: message.content,
        });
      }
    }
    console.log("Messages added to thread");

    // Run the assistant on the thread
    console.log("Running assistant...");
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });
    console.log("Run created:", run.id);

    // Poll for run completion
    console.log("Polling for run completion...");
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    // Set a maximum number of polling attempts to avoid infinite loops
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      console.log("Run status:", runStatus.status, "Attempt:", attempts + 1);
      // Wait for a second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.log("Run timed out after", maxAttempts, "seconds");
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
    }
    
    console.log("Run completed with status:", runStatus.status);
    
    if (runStatus.status !== 'completed') {
      console.log("Run failed with status:", runStatus.status);
      return NextResponse.json({ error: `Run ended with status: ${runStatus.status}` }, { status: 500 });
    }
    
    // Get the assistant's response
    console.log("Getting messages from thread...");
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Find the first assistant message
    const assistantMessage = messages.data.find((msg) => msg.role === 'assistant');
    
    if (!assistantMessage) {
      console.log("No assistant message found");
      return NextResponse.json({ error: 'No response from assistant' }, { status: 500 });
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
    
    // Return the assistant's response using NextResponse
    return NextResponse.json({
      role: "assistant",
      content: content,
      id: assistantMessage.id,
    });
    
  } catch (error: unknown) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}