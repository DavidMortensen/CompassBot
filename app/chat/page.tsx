'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, KeyboardEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'

// Define message types
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// Logo configuration
const COMPASS_LOGO = '/compass-logo.png'; // Using the correct filename from the public directory

export default function ChatPage() {
  // State for messages and input
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Log when component mounts
  useEffect(() => {
    console.log('Chat component initialized');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle keyboard shortcuts - Shift+Enter to add newline, Enter to submit
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        submitMessage();
      }
    }
  };

  // Create a helper function that doesn't require an event parameter
  const submitMessage = () => {
    if (!input.trim()) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    console.log(`Submitting message: ${input}`);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Call API to create thread and run
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [...messages, userMessage],
      }),
    })
    .then(response => {
      console.log(`API Response status: ${response.status}`);
      
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error || 'Failed to get response');
        });
      }
      
      return response.json();
    })
    .then(data => {
      console.log('Initial response:', data);
      
      if (data.status === 'polling_required') {
        // Start polling for the result
        pollForCompletion(data.threadId, data.runId);
      } else {
        throw new Error('Unexpected response format');
      }
    })
    .catch(err => {
      console.error('Chat error:', err);
      
      // Add an error message to the chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${err.message || 'Unknown error'}. Please try again.`
      }]);
      
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error(`Error: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
      setIsLoading(false);
    });
  };

  // Function to poll for completion
  const pollForCompletion = (threadId: string, runId: string) => {
    console.log(`Polling for completion: thread ${threadId}, run ${runId}`);
    
    // Set a maximum number of polling attempts
    let pollCount = 0;
    const maxPolls = 60; // Poll for up to 5 minutes (60 * 5 seconds)
    
    const pollInterval = setInterval(() => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        clearInterval(pollInterval);
        console.error('Polling timed out after maximum attempts');
        
        // Add a timeout message to the chat
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'm sorry, but it's taking me longer than expected to respond. Please try again or ask a different question."
        }]);
        
        setIsLoading(false);
        return;
      }
      
      // Call the status API
      fetch('/api/chat/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threadId, runId }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Poll response:', data);
        
        // Clear interval immediately if completed to prevent any race conditions
        if (data.completed) {
          clearInterval(pollInterval);
        }
        
        if (data.completed && data.error) {
          // Handle error
          throw new Error(data.error);
        }
        
        if (data.completed && data.message) {
          // Add the assistant's message to the chat
          setMessages(prev => [...prev, data.message]);
          setIsLoading(false);
        } else if (data.completed) {
          throw new Error('No message in completed response');
        } else {
          // Still processing, continue polling
          console.log(`Still processing: ${data.status}`);
        }
      })
      .catch(err => {
        clearInterval(pollInterval);
        console.error('Polling error:', err);
        
        // Add an error message to the chat
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I'm sorry, I encountered an error while processing your request: ${err.message || 'Unknown error'}. Please try again.`
        }]);
        
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setIsLoading(false);
      });
    }, 5000); // Poll every 5 seconds
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage();
  };

  // Animation variants for messages
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  // Typing indicator animation
  const typingVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    }
  };

  // Custom components for markdown rendering
  const MarkdownComponents = {
    // Style links
    a: (props: any) => (
      <a 
        {...props} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:underline"
      />
    ),
    // Style code blocks
    code: ({inline, className, children, ...props}: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="my-4 rounded-md overflow-hidden">
          <div className="bg-gray-800 text-gray-200 text-xs py-1 px-4 font-mono">
            {match[1]}
          </div>
          <pre className="bg-gray-900 p-4 overflow-x-auto">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      ) : (
        <code className="bg-gray-200 rounded px-1 py-0.5 text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    // Style paragraphs
    p: (props: any) => <p className="mb-4 last:mb-0" {...props} />,
    // Style headings
    h1: (props: any) => <h1 className="text-xl font-bold mb-4 mt-6" {...props} />,
    h2: (props: any) => <h2 className="text-lg font-bold mb-3 mt-5" {...props} />,
    h3: (props: any) => <h3 className="text-base font-bold mb-2 mt-4" {...props} />,
    // Style lists
    ul: (props: any) => <ul className="list-disc pl-6 mb-4" {...props} />,
    ol: (props: any) => <ol className="list-decimal pl-6 mb-4" {...props} />,
    li: (props: any) => <li className="mb-1" {...props} />,
    // Style blockquotes
    blockquote: (props: any) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />
    ),
    // Style tables
    table: (props: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-300" {...props} />
      </div>
    ),
    thead: (props: any) => <thead className="bg-gray-100" {...props} />,
    tbody: (props: any) => <tbody className="divide-y divide-gray-200" {...props} />,
    tr: (props: any) => <tr {...props} />,
    th: (props: any) => <th className="px-4 py-2 text-left font-medium text-gray-700" {...props} />,
    td: (props: any) => <td className="px-4 py-2" {...props} />,
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl px-4 py-8"
      >
        <Card className="w-full overflow-hidden border-0 shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
            <CardTitle className="text-2xl font-bold tracking-tight">Compass Assistant</CardTitle>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 text-red-100 text-sm px-3 py-2 bg-red-500/20 rounded-lg"
              >
                Error: {error.message || "Something went wrong"}
              </motion.div>
            )}
            <div className="text-xs text-blue-100 mt-1 flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isLoading ? 'bg-green-400' : 'bg-blue-200'}`}></div>
              <span>{isLoading ? 'Processing...' : 'Ready'}</span>
            </div>
          </CardHeader>
          <CardContent className="h-[60vh] overflow-y-auto p-5 bg-gradient-to-b from-white to-gray-50/30">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-400"
                >
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <p className="font-medium">Start a conversation with the assistant</p>
                  <p className="text-sm mt-1">Ask a question or share what you need help with</p>
                </motion.div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map(m => (
                  <motion.div 
                    key={m.id} 
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={messageVariants}
                    className={`mb-6 ${m.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div className="flex items-end space-x-2">
                      {m.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-white border border-blue-200 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <Image 
                            src={COMPASS_LOGO}
                            alt="Compass Logo" 
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div className={`flex flex-col space-y-1 ${m.role === 'user' ? 'ml-auto' : ''}`}>
                        <span className={`inline-block p-3 rounded-2xl ${
                          m.role === 'user' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' 
                            : 'bg-white border border-gray-200 text-black shadow-sm'
                        }`}>
                          {m.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]} 
                                components={MarkdownComponents}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap font-medium">{m.content}</div>
                          )}
                        </span>
                        <span className="text-xs text-gray-500 px-1">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {m.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-medium">
                          You
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {isLoading && (
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={messageVariants}
                className="text-left mb-4"
              >
                <div className="flex items-end space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white border border-blue-200 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <Image 
                      src={COMPASS_LOGO}
                      alt="Compass Logo" 
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <motion.div 
                      animate="animate"
                      variants={typingVariants}
                      className="inline-block p-4 rounded-2xl bg-white border border-gray-200 shadow-sm"
                    >
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      </div>
                    </motion.div>
                    <div className="text-xs text-gray-500 px-1 mt-1">
                      Typing...
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
          
          <CardFooter className="border-t p-4 bg-white">
            <form onSubmit={handleSubmit} className="flex w-full space-x-2">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-grow shadow-sm border-gray-300 resize-none min-h-[80px] max-h-[200px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                disabled={isLoading}
              />
              <div className="flex flex-col justify-end">
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className={`px-6 ${isLoading ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} transition-all duration-200 text-white shadow-md rounded-lg`}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
                <div className="text-xs text-gray-400 mt-2 text-center">
                  Enter to send
                </div>
              </div>
            </form>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
} 