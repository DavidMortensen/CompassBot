import OpenAI from 'openai';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

// Use the specific assistant ID from the OpenAI playground
const ASSISTANT_ID = "asst_lVJFmwqFwiSXnDM5BZbGYfEN";

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
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      console.log("Run status:", runStatus.status);
      // Wait for a second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
    console.log("Run completed with status:", runStatus.status);
    
    if (runStatus.status !== 'completed') {
      console.log("Run failed with status:", runStatus.status);
      return new Response(
        JSON.stringify({ error: `Run ended with status: ${runStatus.status}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the assistant's response
    console.log("Getting messages from thread...");
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Find the first assistant message
    const assistantMessage = messages.data.find((msg) => msg.role === 'assistant');
    
    if (!assistantMessage) {
      console.log("No assistant message found");
      return new Response(
        JSON.stringify({ error: 'No response from assistant' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Found assistant message");
    
    // Extract text from the message content
    let content = "";
    for (const part of assistantMessage.content) {
      if (part.type === 'text') {
        content += part.text.value;
      }
    }
    
    console.log("Sending response:", content.substring(0, 100) + "...");
    
    // Return the assistant's response in a simple format
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: content,
        id: assistantMessage.id,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}