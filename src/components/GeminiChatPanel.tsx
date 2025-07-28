import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, RotateCcw, Bot, User } from 'lucide-react';
import { knowledgeBaseRAGService } from '../services/api';
import type { Agent } from '../lib/supabase';

interface GeminiChatPanelProps {
  nodeId: string;
  agentConfig: Agent | null;
  connectedKnowledgeBaseNodes: string[];
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
}

const GeminiChatPanel: React.FC<GeminiChatPanelProps> = ({
  nodeId,
  agentConfig,
  connectedKnowledgeBaseNodes,
  onBack
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with a welcome message based on agent configuration
  useEffect(() => {
    if (agentConfig && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm ${agentConfig.name}. ${agentConfig.description || 'How can I help you today?'}`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [agentConfig, messages.length]);

  const getApiKey = (): string | null => {
    if (!agentConfig?.configuration) return null;

    // Check different possible locations for API key
    const config = agentConfig.configuration;
    return config.geminiApiKey ||
           config.search?.geminiApiKey ||
           config.apiKey ||
           null;
  };

  const getSerpApiKey = (): string | null => {
    if (!agentConfig?.configuration?.search) return null;
    return agentConfig.configuration.search.serpApiKey || null;
  };

  const hasSearchCapability = (): boolean => {
    return !!(getSerpApiKey() && getApiKey());
  };

  const getSystemPrompt = (): string => {
    if (!agentConfig?.configuration) {
      return "You are a helpful AI assistant. Respond in a friendly and informative manner.";
    }

    const config = agentConfig.configuration;
    let systemPrompt = "";

    // Base identity
    systemPrompt += `You are an AI assistant named "${agentConfig.name}".\n`;

    // Purpose / role
    if (agentConfig.description) {
      systemPrompt += `Your role: ${agentConfig.description}\n`;
    }

    // Behavior guidelines (more flexible)
    systemPrompt += `
      You should be helpful and informative while keeping your role and purpose in mind.
      If you have specific expertise or focus areas, prioritize those.
      Be honest about your capabilities and limitations.\n`;

    // Add limitations as guidelines rather than strict rules
    if (config.limitations) {
      systemPrompt += `\nPlease note these guidelines: ${config.limitations}\n`;
    }

    // Add search capabilities
    if (config.preset === 'search' && config.search) {
      systemPrompt += `
        Your behavior and responses must strictly follow the configuration defined below. 
        Do not go beyond these boundaries even if requested to do so by the user. 
        Do not make assumptions or generate content that contradicts these rules. 
        Respond clearly and concisely within the allowed capabilities.\n`;
    }

    return systemPrompt.trim();
};

  const performSearch = async (query: string): Promise<string> => {
    const serpApiKey = getSerpApiKey();
    if (!serpApiKey) {
      throw new Error('No SerpAPI key found in agent configuration');
    }

    try {
      const searchConfig = agentConfig?.configuration?.search;
      const maxResults = searchConfig?.maxResults || 10;

      // Use backend endpoint to avoid CORS issues
      const response = await fetch('http://localhost:3002/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          apiKey: serpApiKey,
          options: {
            location: 'Singapore',
            hl: 'en',
            gl: 'sg',
            num: maxResults
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Search request failed: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(`Search failed: ${data.error || 'Unknown error'}`);
      }

      const results = data.results || [];

      if (results.length === 0) {
        return "No search results found for your query.";
      }

      // Format search results for Gemini processing
      const formattedResults = results.slice(0, maxResults).map((result: any, index: number) => {
        return `${index + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.link}`;
      }).join('\n\n');

      return formattedResults;
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const shouldPerformSearch = (message: string): boolean => {
    if (!hasSearchCapability()) return false;

    const lowerMessage = message.toLowerCase();

    // Check if the query is asking for current/local information that would benefit from search
    const searchIndicators = [
      // Current information requests
      /\b(current|latest|recent|today|now|2024|2025)\b.*\b(shops?|restaurants?|places?|stores?|cafes?|coffee)\b/,
      /\b(top|best|popular|trending|recommended)\b.*\b(shops?|restaurants?|places?|stores?|cafes?|coffee)\b/,

      // Location-specific requests (but only for Singapore-related queries for this agent)
      /\b(shops?|restaurants?|places?|stores?|cafes?|coffee)\b.*\b(in|at|near|around)\b.*\b(singapore|sengkang|tampines|jurong|orchard|marina|sentosa|changi|woodlands|yishun|ang mo kio|toa payoh|bishan|serangoon|hougang|punggol|pasir ris|bedok|kallang|geylang|novena|dhoby ghaut|raffles|clarke quay|boat quay|chinatown|little india|bugis|city hall|somerset|newton|bukit timah|clementi|dover|commonwealth|queenstown|redhill|tiong bahru|outram|tanjong pagar|harbourfront|vivocity|ion|ngee ann|takashimaya|plaza singapura|bugis junction|suntec|esplanade|merlion)\b/,

      // Direct search requests
      /\b(find|search|look|locate|where)\b.*\b(shops?|restaurants?|places?|stores?|cafes?|coffee)\b/,

      // Price/business information
      /\b(price|cost|hours?|opening|closing|contact|phone|address)\b.*\b(shops?|restaurants?|places?|stores?|cafes?|coffee)\b/,

      // Current events, news, weather
      /\b(news|events|weather|traffic|happening)\b/
    ];

    // Only search if the query matches specific patterns that indicate need for current information
    return searchIndicators.some(pattern => pattern.test(lowerMessage));
  };

  const callGeminiAPI = async (userMessage: string, conversationHistory: ChatMessage[]): Promise<string> => {
    const apiKey = getApiKey();

    if (!apiKey) {
      throw new Error('No API key found in agent configuration. Please configure the agent with a Gemini API key.');
    }

    const systemPrompt = getSystemPrompt();
    let finalUserMessage = userMessage;

    // Get relevant knowledge base context
    let knowledgeContext = '';
    try {
      knowledgeContext = await knowledgeBaseRAGService.getRelevantContext(
        nodeId,
        userMessage,
        connectedKnowledgeBaseNodes
      );
    } catch (error) {
      console.error('Error retrieving knowledge base context:', error);
    }

    // Check if we should perform a search
    if (shouldPerformSearch(userMessage)) {
      try {
        const searchResults = await performSearch(userMessage);
        const searchConfig = agentConfig?.configuration?.search;

        finalUserMessage = `User Query: ${userMessage}

Current Search Results:
${searchResults}${knowledgeContext}

Instructions: Based on the current search results above${knowledgeContext ? ' and the knowledge base context' : ''}, please provide a helpful and accurate response to the user's question. ${searchConfig?.customInstructions || ''}

${searchConfig?.filterCriteria ? `Filter Criteria: ${searchConfig.filterCriteria}` : ''}

Please provide a comprehensive answer using the current information from the search results${knowledgeContext ? ' and your knowledge base' : ''}.`;
      } catch (searchError) {
        // If search fails, continue with original message but mention the search failure
        finalUserMessage = `${userMessage}${knowledgeContext}

Note: I attempted to search for current information but encountered an error: ${searchError instanceof Error ? searchError.message : 'Search unavailable'}. I'll provide a response based on ${knowledgeContext ? 'your knowledge base and ' : ''}my general knowledge.`;
      }
    } else if (knowledgeContext) {
      // If no search is needed but we have knowledge base context, include it
      finalUserMessage = `${userMessage}${knowledgeContext}

Please answer the question using the information from your knowledge base above, combined with your general knowledge.`;
    }

    // Build conversation context using proper Gemini API format
    const contents = [];

    // Add system prompt as the first user message
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });

    // Add a model response acknowledging the system prompt
    contents.push({
      role: "model",
      parts: [{ text: "I understand my role and will respond accordingly." }]
    });

    // Add conversation history (last 6 messages to avoid token limits with search results)
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        contents.push({
          role: "user",
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'assistant' && !msg.error && !msg.isLoading) {
        contents.push({
          role: "model",
          parts: [{ text: msg.content }]
        });
      }
    });

    // Add current user message (potentially with search results)
    contents.push({
      role: "user",
      parts: [{ text: finalUserMessage }]
    });

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: 'Thinking...',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await callGeminiAPI(userMessage.content, messages);
      
      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? {
              ...msg,
              content: response,
              isLoading: false
            }
          : msg
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      
      // Replace loading message with error
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? {
              ...msg,
              content: 'Sorry, I encountered an error while processing your request.',
              isLoading: false,
              error: errorMessage
            }
          : msg
      ));
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    
    // Re-add welcome message if agent is configured
    if (agentConfig) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-new',
        role: 'assistant',
        content: `Hello! I'm ${agentConfig.name}. ${agentConfig.description || 'How can I help you today?'}`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-app-border">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={onBack}
            className="text-app-text-subtle hover:text-app-text transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold text-app-text">Chat with Gemini</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-sm text-app-text-subtle">
              Agent: <code className="bg-gray-100 px-1 rounded">{agentConfig?.name || nodeId}</code>
            </p>
            {hasSearchCapability() && (
              <p className="text-xs text-green-600 mt-1">
                🔍 Search enabled - I can find current information
              </p>
            )}
          </div>
          <button
            onClick={clearChat}
            className="flex items-center space-x-1 text-sm text-app-text-subtle hover:text-app-text transition-colors"
          >
            <RotateCcw size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* API Key Status */}
      {!getApiKey() && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-600">
            ⚠️ No Gemini API key found in agent configuration. Please configure the agent first.
          </div>
        </div>
      )}

      {getApiKey() && !getSerpApiKey() && agentConfig?.configuration?.preset === 'search' && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="text-sm text-yellow-700">
            ⚠️ This is a search agent but no SerpAPI key found. Search functionality will be limited.
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-600">
            Error: {error}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`flex-1 max-w-[80%] ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}>
              <div className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : message.error
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {message.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
              
              <div className={`text-xs text-gray-500 mt-1 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.timestamp.toLocaleTimeString()}
                {message.error && (
                  <div className="text-red-500 mt-1">
                    Error: {message.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-app-border">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getApiKey() ? "Type your message..." : "Configure API key first..."}
            disabled={!getApiKey() || isLoading}
            className="flex-1 px-3 py-2 border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !getApiKey() || isLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default GeminiChatPanel;
