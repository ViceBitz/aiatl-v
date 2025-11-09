import { useState, useRef, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Send, Bot, User } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  commits?: string[];
};

export default function ChatInterface({
  repoOwner,
  repoName,
  featureMap,
  onFeatureMapUpdate
}: {
  repoOwner?: string;
  repoName?: string;
  featureMap?: any[];
  onFeatureMapUpdate?: () => void;
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // STATIC DATA - No backend connection
  // In the real implementation, this would call the agentic workflow
  // For now, we're just showing the UI without backend integration

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isRunning) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    // Simulate AI response (static - no backend)
    setIsRunning(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'This is a placeholder response. Backend integration is not connected.',
        },
      ]);
      setIsRunning(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
        <CardDescription>
          Ask the AI to modify your code, add features, or fix bugs. Changes will be committed directly to your repository.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-muted/20">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-center">
              <div className="text-sm text-muted-foreground max-w-md">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="font-medium mb-2">Start a conversation</p>
                <p>
                  Try asking: "Add error handling to the authentication module" or "Create a new user profile page"
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.commits && msg.commits.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-1">
                    <p className="text-xs font-medium opacity-80">Commits:</p>
                    {msg.commits.map((commit, i) => (
                      <a
                        key={i}
                        href={commit}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs underline opacity-80 hover:opacity-100"
                      >
                        {commit}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to change or add..."
            className="flex-1 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            disabled={isRunning || !repoOwner || !repoName}
          />
          <Button
            onClick={handleSend}
            disabled={isRunning || !input.trim() || !repoOwner || !repoName}
            size="icon"
            className="h-[80px] w-[80px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {(!repoOwner || !repoName) && (
          <p className="text-xs text-muted-foreground text-center">
            Please select a repository to start chatting
          </p>
        )}
      </CardContent>
    </Card>
  );
}
