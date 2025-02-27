'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"

export default function LandingPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/validate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      });
      
      const data = await response.json();

      if (data.valid) {
        // Use Framer Motion to fade out the content
        const container = document.querySelector('.landing-container');
        if (container) {
          await new Promise<void>((resolve) => {
            const animation = container.animate(
              [
                { opacity: 1 },
                { opacity: 0 }
              ],
              {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards'
              }
            );
            animation.onfinish = () => resolve();
          });
        }
        
        // Navigate to chat page
        router.push('/chat');
      } else {
        setError(data.message || 'Invalid invite code');
      }
    } catch (err) {
      console.error('Error validating invite code:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-container min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg px-4 py-8 text-center"
      >
        <Card className="w-full overflow-hidden border-0 shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-white">
            <CardTitle className="text-xl font-bold tracking-tight">
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <img 
                  src="/main-logo.png" 
                  alt="Compass HRG" 
                  className="h-24 mx-auto"
                />
              </motion.div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Enter your invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full shadow-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 text-sm text-red-600"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2 relative ${
                    isLoading
                      ? 'bg-gray-400'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  } transition-all duration-300 text-white shadow-md rounded-lg overflow-hidden`}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isLoading ? 0 : 1,
                      y: isLoading ? 10 : 0
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    Continue to Chat
                  </motion.div>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="flex gap-1">
                        <motion.span
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                        <motion.span
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.2,
                            ease: "easeInOut"
                          }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                        <motion.span
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.4,
                            ease: "easeInOut"
                          }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}