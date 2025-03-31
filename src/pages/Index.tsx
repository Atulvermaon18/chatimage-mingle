
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image, Send, Upload } from "lucide-react";

type MessageType = 'user' | 'assistant';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  imageUrl?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!input.trim() && !imagePreview) || isLoading) return;
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      imageUrl: imagePreview || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImagePreview(null);
    setIsLoading(true);
    
    try {
      // In a real app, this would be replaced with an API call to your Ollama instance
      const response = await mockOllamaRequest(input, imagePreview);
      
      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Ollama. Is it running locally?",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock Ollama request for demonstration
  // In a real app, this would be replaced with an actual API call
  const mockOllamaRequest = async (text: string, image: string | null): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (image) {
      return `I've analyzed the image you sent. ${text ? `Regarding your message "${text}": ` : ''} This appears to be an image. In a real implementation, Ollama would process this image and provide a relevant response.`;
    }
    
    return `You said: "${text}". This is a placeholder response. In a real implementation, this would be the response from your local Ollama instance.`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto flex flex-col flex-grow">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Ollama Chat</h1>
          <p className="text-muted-foreground">Chat with your local Ollama instance</p>
        </header>
        
        <Card className="flex-grow flex flex-col overflow-hidden mb-4">
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div className="max-w-md">
                  <h3 className="text-xl font-semibold mb-2">Welcome to Ollama Chat</h3>
                  <p className="text-muted-foreground">
                    Start a conversation with your local Ollama instance. You can send text messages or upload images for analysis.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground ml-4' 
                        : 'bg-muted text-foreground mr-4'
                    }`}
                  >
                    {message.imageUrl && (
                      <div className="mb-2">
                        <img 
                          src={message.imageUrl} 
                          alt="User uploaded image" 
                          className="max-w-full rounded"
                        />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t">
            {imagePreview && (
              <div className="mb-3 relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-20 rounded border"
                />
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={removeImage}
                >
                  <span className="sr-only">Remove image</span>
                  ×
                </Button>
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow min-h-[60px] max-h-[200px]"
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  type="button"
                  onClick={triggerImageUpload}
                  disabled={isLoading}
                  title="Upload image"
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload image</span>
                </Button>
                <Button
                  size="icon"
                  type="button"
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && !imagePreview) || isLoading}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>
        </Card>
        
        <footer className="text-center text-sm text-muted-foreground">
          <p>This chat connects to your locally running Ollama instance</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
