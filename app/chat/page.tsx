'use client'

import { KeyboardEvent, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { useAssistant, type Message } from 'ai/react'

// Define types for markdown components
type MarkdownProps = {
  children?: ReactNode;
  className?: string;
  href?: string;
};

// Logo configuration
const COMPASS_LOGO = '/compass-logo.png';

// Define the markdown components with proper types
const MarkdownComponents: Components = {
  a: ({ children, href, ...props }: MarkdownProps) => (
    <a 
      {...props} 
      href={href}
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-blue-600 hover:underline"
    >
      {children}
    </a>
  ),
  code: ({ children, className }: MarkdownProps) => {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <div className="my-4 rounded-md overflow-hidden">
        <div className="bg-gray-800 text-gray-200 text-xs py-1 px-4 font-mono">
          {match[1]}
        </div>
        <pre className="bg-gray-900 p-4 overflow-x-auto">
          <code className={className}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code className="bg-gray-200 rounded px-1 py-0.5 text-sm font-mono">
        {children}
      </code>
    );
  },
  p: ({ children }: MarkdownProps) => <p className="mb-4 last:mb-0">{children}</p>,
  h1: ({ children }: MarkdownProps) => <h1 className="text-xl font-bold mb-4 mt-6">{children}</h1>,
  h2: ({ children }: MarkdownProps) => <h2 className="text-lg font-bold mb-3 mt-5">{children}</h2>,
  h3: ({ children }: MarkdownProps) => <h3 className="text-base font-bold mb-2 mt-4">{children}</h3>,
  ul: ({ children }: MarkdownProps) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
  ol: ({ children }: MarkdownProps) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
  li: ({ children }: MarkdownProps) => <li className="mb-1">{children}</li>,
  blockquote: ({ children }: MarkdownProps) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">{children}</blockquote>
  ),
  table: ({ children }: MarkdownProps) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-gray-300">{children}</table>
    </div>
  ),
  thead: ({ children }: MarkdownProps) => <thead className="bg-gray-100">{children}</thead>,
  tbody: ({ children }: MarkdownProps) => <tbody className="divide-y divide-gray-200">{children}</tbody>,
  tr: ({ children }: MarkdownProps) => <tr>{children}</tr>,
  th: ({ children }: MarkdownProps) => <th className="px-4 py-2 text-left font-medium text-gray-700">{children}</th>,
  td: ({ children }: MarkdownProps) => <td className="px-4 py-2">{children}</td>,
};

export default function ChatPage() {
  const { messages, input, setInput, append, status, error } = useAssistant({
    api: '/api/chat',
  });

  const isLoading = status === 'in_progress';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Animation variants for messages
  const messageVariants = {
    initial: { 
      opacity: 0
    },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.1
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.05
      }
    }
  };

  // Handle textarea key press
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    try {
      await append({
        content: input.trim(),
        role: 'user',
      });
      setInput('');
    } catch (err) {
      console.error('Error submitting message:', err);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Filter out empty messages and show loading state only for the latest message
  const displayMessages = messages.filter((message) => {
    if (message.role === 'user') return true;
    if (message.role === 'assistant') {
      // Show all non-empty messages, including partial ones
      return message.content !== '';
    }
    return false;
  });

  // Determine if we should show the loading indicator
  const showLoadingIndicator = isLoading && !messages.some(m => 
    m.role === 'assistant' && m.content !== '' && 
    messages.indexOf(m) === messages.length - 1
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-slate-100 dark:bg-slate-900 py-24 px-4"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="max-w-4xl mx-auto"
      >
        {/* Top Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-t-xl p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h1 className="font-semibold text-lg">Compass Assistant</h1>
            <p className="text-sm text-muted-foreground">Powered by OpenAI</p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white dark:bg-slate-800 h-[600px] flex flex-col rounded-b-xl">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            <div className="flex flex-col">
              {displayMessages.map((message: Message) => (
                <div key={`message-${message.id}`}>
                  {message.role === 'user' ? (
                    <div
                      className="flex mb-4 justify-end"
                    >
                      <div className="flex gap-3 max-w-[85%] flex-row-reverse items-end">
                        <div className="rounded-2xl px-4 py-2 shadow-sm bg-indigo-600 text-white">
                          <div className="text-sm text-white">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={MarkdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      <motion.div
                        key={message.id}
                        variants={messageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex mb-4 justify-start"
                      >
                        <div className="flex gap-3 max-w-[85%] items-start">
                          <div className="w-8 h-8 relative flex-shrink-0 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                            <Image
                              src={COMPASS_LOGO}
                              alt="Compass Logo"
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="rounded-2xl px-4 py-2 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="prose dark:prose-invert prose-sm max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={MarkdownComponents}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              ))}
              {showLoadingIndicator && (
                <motion.div
                  key="loading"
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex mb-4 justify-start"
                >
                  <div className="flex gap-3 max-w-[85%] items-start">
                    <div className="w-8 h-8 relative flex-shrink-0 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                      <Image
                        src={COMPASS_LOGO}
                        alt="Compass Logo"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="rounded-2xl px-4 py-2 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1 py-1">
                        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 rounded-b-xl">
            <form onSubmit={handleSubmit} className="flex gap-2 items-stretch">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="min-h-[56px] max-h-[200px] flex-1 resize-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 disabled:opacity-50"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="min-h-[56px] px-8 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse [animation-delay:0.2s]">●</span>
                    <span className="animate-pulse [animation-delay:0.4s]">●</span>
                  </span>
                ) : (
                  'Send'
                )}
              </Button>
            </form>
            {error && (
              <div className="text-destructive text-sm mt-2">
                Error: {error.message}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 