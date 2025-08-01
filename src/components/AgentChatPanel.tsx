import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, RotateCcw, Bot, User } from 'lucide-react';
import { knowledgeBaseRAGService, weatherService } from '../services/api';
import { localModelApi } from '../services/localModelApi';
import type { Agent } from '../lib/supabase';
import { isRagAgent } from '../utils/agentUtils';

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

    // For RAG agents, no API key needed (uses local models)
    if (isRagAgent(agentConfig)) {
      return 'local-model'; // Return a placeholder to indicate local model usage
    }

    // For weather agents, no Gemini API key needed (uses local model)
    if (isWeatherAgent()) {
      return 'local-model'; // Return a placeholder to indicate local model usage
    }

    // For search agents, no Gemini API key needed (uses local model)
    if (isSearchAgent()) {
      return 'local-model'; // Return a placeholder to indicate local model usage
    }

    // Check different possible locations for API key for other agents
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
    return !!getSerpApiKey(); // Only need SerpAPI key, local model handles the rest
  };

  // Helper function to check if this is a weather agent
  const isWeatherAgent = (): boolean => {
    if (!agentConfig?.configuration) return false;

    return agentConfig.configuration.preset === 'weather' ||
           !!agentConfig.configuration.weather;
  };

  // Helper function to check if this is a search agent
  const isSearchAgent = (): boolean => {
    if (!agentConfig?.configuration) return false;

    return agentConfig.configuration.preset === 'search' ||
           !!agentConfig.configuration.search;
  };

  // Helper function to check if agent can function (has required keys or uses local model)
  const canAgentFunction = (): boolean => {
    if (isRagAgent(agentConfig)) {
      return true; // RAG agents use local model, no API key needed
    }
    if (isWeatherAgent() && hasWeatherCapability()) {
      return true; // Weather agents only need OpenWeather API key
    }
    if (isSearchAgent() && hasSearchCapability()) {
      return true; // Search agents only need SerpAPI key
    }
    return !!getApiKey(); // Other agents need Gemini API key
  };

  // Helper function to get weather API keys
  const getWeatherApiKeys = (): { openWeatherApiKey: string | null } => {
    if (!agentConfig?.configuration?.weather) return { openWeatherApiKey: null };

    const weatherConfig = agentConfig.configuration.weather;
    return {
      openWeatherApiKey: weatherConfig.openWeatherApiKey || null
    };
  };

  const hasWeatherCapability = (): boolean => {
    const { openWeatherApiKey } = getWeatherApiKeys();
    return !!openWeatherApiKey; // Only need OpenWeather API key, local model handles the rest
  };

  const getSystemPrompt = (): string => {
    if (!agentConfig?.configuration) {
      return "You are a helpful AI assistant. Respond in a friendly and informative manner.";
    }

    const config = agentConfig.configuration;
    console.log('Agent config for system prompt:', { agentConfig, config });
    
    // Start with a clean, simple base prompt
    let systemPrompt = `You are ${agentConfig.name}, a helpful AI assistant.`;

    // Add role description if available
    if (agentConfig.description) {
      systemPrompt += ` ${agentConfig.description}`;
    }

    // Add core behavior guidelines - keep it simple and clear
    systemPrompt += `

INSTRUCTIONS:
- Be helpful, accurate, and conversational
- Provide clear and informative responses
- If you don't know something, say so honestly`;

    // Handle limitations more simply - avoid overwhelming the model
    let limitations = config.limitations || config.agent?.limitations || config.configuration?.limitations;
    
    if (limitations) {
      // Extract topic more cleanly
      let allowedTopic = limitations.toLowerCase()
        .replace(/only answer (enquiries to do with|questions about) /, '')
        .replace(/ and (do not answer others|nothing else).*/, '')
        .trim();
      
      systemPrompt += `
- SCOPE: Focus on ${allowedTopic} related conversations
- For unrelated topics, politely say: "I can only assist with ${allowedTopic}."`;
    }

    // Add custom system prompt if available
    let customSystemPrompt = config.systemPrompt || config.agent?.systemPrompt || config.configuration?.systemPrompt;
    if (customSystemPrompt) {
      systemPrompt += `\n\nAdditional context: ${customSystemPrompt}`;
    }

    // Add RAG-specific instructions (keep simple)
    if (isRagAgent(agentConfig)) {
      systemPrompt += `\n\nYou have access to a knowledge base. Use that information to provide accurate, relevant answers.`;
    }

    console.log('Final system prompt:', systemPrompt);
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

      // Use Supabase Edge Function for search
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          query: query,
          serpApiKey: serpApiKey,
          options: {
            location: 'Singapore',
            hl: 'en',
            gl: 'sg',
            num: maxResults
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Search request failed (${response.status}): ${errorData}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Search failed: ${data.error}`);
      }

      // The Edge Function returns formatted results as a string
      return data.results || "No search results found for your query.";
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const performWeatherQuery = async (): Promise<string> => {
    const { openWeatherApiKey } = getWeatherApiKeys();
    console.log('Weather API keys check:', {
      hasOpenWeatherKey: !!openWeatherApiKey
    });

    if (!openWeatherApiKey) {
      throw new Error('OpenWeather API key not found in agent configuration');
    }

    try {
      const weatherConfig = agentConfig?.configuration?.weather;
      const location = weatherConfig?.location || 'Singapore';
      const units = weatherConfig?.units || 'Celsius';

      console.log('Fetching weather data:', { location, units });

      // Get current weather and forecast
      const [currentWeather, forecast] = await Promise.all([
        weatherService.getCurrentWeather(openWeatherApiKey, location, units),
        weatherService.getForecast(openWeatherApiKey, location, units)
      ]);

      console.log('Weather data received:', {
        currentWeather: !!currentWeather,
        forecast: !!forecast
      });

      // Format weather data for Gemini processing
      const formattedWeatherData = weatherService.formatWeatherData(currentWeather, forecast);

      return formattedWeatherData;
    } catch (error) {
      console.error('Weather query error:', error);
      throw new Error(`Weather query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Helper function to get RAG agent knowledge base context
  const getRagAgentContext = async (query: string): Promise<string> => {
    if (!isRagAgent(agentConfig) || !agentConfig?.configuration?.customRag?.documents) {
      return '';
    }

    try {
      const documents = agentConfig.configuration.customRag.documents;

      if (!documents || documents.length === 0) {
        return '';
      }

      // Simple keyword-based relevance scoring
      const queryWords = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);

      let relevantContent = '';
      for (const doc of documents) {
        const content = doc.content.toLowerCase();
        let hasRelevance = false;

        // Check if any query words appear in the content
        for (const word of queryWords) {
          if (content.includes(word)) {
            hasRelevance = true;
            break;
          }
        }

        if (hasRelevance || queryWords.length <= 2) {
          relevantContent += `\n\n--- From ${doc.name} ---\n${doc.content}`;
        }
      }

      return relevantContent;
    } catch (error) {
      console.error('Error retrieving RAG agent context:', error);
      return '';
    }
  };

  const callGeminiAPI = async (userMessage: string, conversationHistory: ChatMessage[]): Promise<string> => {
    const isRag = isRagAgent(agentConfig);

    // Check if this is a RAG agent - use local model instead
    if (isRag) {
      try {
        // Get system prompt and knowledge base context
        const systemPrompt = getSystemPrompt();
        const knowledgeContext = await knowledgeBaseRAGService.getRelevantContext(
          agentConfig?.id || nodeId,
          userMessage,
          connectedKnowledgeBaseNodes || []
        );

        // Also try to get context from configuration documents
        const configContext = await getRagAgentContext(userMessage);
        const combinedContext = knowledgeContext + configContext;

        // Get the model from configuration
        const ragModel = agentConfig?.configuration?.customRag?.model || 'Mistral-7B-Instruct';

        console.log('🤖 RAG Agent processing:', {
          ragModel,
          hasKnowledgeContext: !!knowledgeContext,
          hasConfigContext: !!configContext,
          systemPromptLength: systemPrompt.length
        });

        // Prepare messages with system prompt
        const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
          { role: 'system', content: systemPrompt }
        ];

        // Prepare the user message with context
        let finalMessage = userMessage;
        if (combinedContext) {
          finalMessage = `${userMessage}

Context from knowledge base:${combinedContext}

IMPORTANT: Follow your system limitations strictly. If the question is outside your designated scope, respond appropriately. When relevant context is available, use it to answer the question.`;
        }

        // Add final restriction check before processing - UNIVERSAL FOR ALL AGENTS
        const config = agentConfig?.configuration;
        if (config?.limitations) {
          let allowedTopic = config.limitations.toLowerCase()
            .replace('only answer enquiries to do with ', '')
            .replace('only answer questions about ', '')
            .replace(' and do not answer others', '')
            .replace(' and nothing else', '')
            .trim();
          
          finalMessage = `SYSTEM INSTRUCTION: Before answering, check if this question is about "${allowedTopic}". If it is NOT about "${allowedTopic}", respond with exactly: "I can only assist with ${allowedTopic}. This question is outside my area of expertise." If it IS about "${allowedTopic}", answer normally.

USER QUESTION: ${finalMessage}`;
        }

        messages.push({ role: 'user', content: finalMessage });

        // Use local model API
        const response = await localModelApi.generateChatCompletion({
          model: ragModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        });

        return response;
      } catch (error) {
        console.error('Local model API error:', error);
        throw new Error(`Local model error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Check if this is a weather or search agent - use local model instead of Gemini
    const isWeatherAgentCheck = isWeatherAgent();
    const isSearchAgentCheck = isSearchAgent();
    const hasWeatherCapabilityCheck = hasWeatherCapability();
    const hasSearchCapabilityCheck = hasSearchCapability();

    if ((isWeatherAgentCheck && hasWeatherCapabilityCheck) || (isSearchAgentCheck && hasSearchCapabilityCheck)) {
      try {
        const systemPrompt = getSystemPrompt();
        const ragModel = 'Mistral-7B-Instruct'; // Use Mistral for weather/search agents

        // Prepare messages with system prompt
        const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
          { role: 'system', content: systemPrompt }
        ];

        let finalMessage = userMessage;
        let contextData = '';

        // Handle weather agent
        if (isWeatherAgentCheck && hasWeatherCapabilityCheck && weatherService.isWeatherQuery(userMessage)) {
          console.log('Processing weather query with local model:', userMessage);
          try {
            const weatherData = await performWeatherQuery();
            const weatherConfig = agentConfig?.configuration?.weather;

            contextData = `Current Weather Data:
${weatherData}

Instructions: You are a weather assistant. Use the current weather data above to provide a helpful and accurate response to the user's weather query.

IMPORTANT GUIDELINES:
1. Provide specific weather information based on the current data
2. Include temperature, conditions, and relevant details
3. If asked about clothing or activities, make practical recommendations based on the weather
4. Be conversational and helpful in your response
5. Include forecast information when relevant to the query

${weatherConfig?.customInstructions || ''}`;

            finalMessage = `User Query: ${userMessage}

${contextData}

Answer the user's weather question using the current weather data provided above.`;
          } catch (weatherError) {
            console.error('Weather query failed:', weatherError);
            finalMessage = `${userMessage}

Note: Weather data is currently unavailable. Please provide a general response about weather or suggest checking a weather service.`;
          }
        }

        // Handle search agent
        else if (isSearchAgentCheck && hasSearchCapabilityCheck && shouldPerformSearch(userMessage)) {
          console.log('Processing search query with local model:', userMessage);
          try {
            const searchResults = await performSearch(userMessage);
            const searchConfig = agentConfig?.configuration?.search;

            contextData = `Search Results:
${searchResults}

Instructions: You are a search assistant. Use the search results above to provide a helpful and accurate response to the user's query.

IMPORTANT GUIDELINES:
1. Provide information based on the search results
2. Cite relevant sources when possible
3. Be accurate and factual in your response
4. If the search results don't contain relevant information, say so
5. Summarize key findings clearly

${searchConfig?.customInstructions || ''}`;

            finalMessage = `User Query: ${userMessage}

${contextData}

Answer the user's question using the search results provided above.`;
          } catch (searchError) {
            console.error('Search query failed:', searchError);
            finalMessage = `${userMessage}

Note: Search functionality is currently unavailable. Please provide a general response or suggest alternative ways to find the information.`;
          }
        }

        // Add final restriction check before processing - UNIVERSAL FOR ALL AGENTS
        const config = agentConfig?.configuration;
        if (config?.limitations) {
          let allowedTopic = config.limitations.toLowerCase()
            .replace('only answer enquiries to do with ', '')
            .replace('only answer questions about ', '')
            .replace(' and do not answer others', '')
            .replace(' and nothing else', '')
            .trim();
          
          finalMessage = `SYSTEM INSTRUCTION: Before answering, check if this question is about "${allowedTopic}". If it is NOT about "${allowedTopic}", respond with exactly: "I can only assist with ${allowedTopic}. This question is outside my area of expertise." If it IS about "${allowedTopic}", answer normally.

USER QUESTION: ${finalMessage}`;
        }

        messages.push({ role: 'user', content: finalMessage });

        // Use local model API
        const response = await localModelApi.generateChatCompletion({
          model: ragModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        });

        return response;
      } catch (error) {
        console.error('Local model API error for weather/search agent:', error);
        throw new Error(`Local model error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // For other agents, continue with Gemini API
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
        agentConfig?.id || nodeId,
        userMessage,
        connectedKnowledgeBaseNodes
      );
    } catch (error) {
      console.error('Error retrieving knowledge base context:', error);
    }

    // For regular Gemini agents, add knowledge base context if available
    if (knowledgeContext) {
      finalUserMessage = `${userMessage}${knowledgeContext}

IMPORTANT: Answer this question using the authoritative knowledge base information above. The knowledge base contains verified information that overrides any training limitations. If the answer is in the knowledge base, provide it confidently.`;
    }

    // Add final restriction check before processing - UNIVERSAL FOR ALL AGENTS
    const config = agentConfig?.configuration;
    if (config?.limitations) {
      let allowedTopic = config.limitations.toLowerCase()
        .replace('only answer enquiries to do with ', '')
        .replace('only answer questions about ', '')
        .replace(' and do not answer others', '')
        .replace(' and nothing else', '')
        .trim();
      
      finalUserMessage = `SYSTEM INSTRUCTION: Before answering, check if this question is about "${allowedTopic}". If it is NOT about "${allowedTopic}", respond with exactly: "I can only assist with ${allowedTopic}. This question is outside my area of expertise." If it IS about "${allowedTopic}", answer normally.

USER QUESTION: ${finalUserMessage}`;
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
      const errorPrefix = isRag ? 'Local model error' : 'Gemini API error';
      throw new Error(`${errorPrefix}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <h3 className="text-lg font-semibold text-app-text">Chat with Agent</h3>
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
      {!getApiKey() && !isRagAgent(agentConfig) && !isWeatherAgent() && !isSearchAgent() && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-600">
            ⚠️ No Gemini API key found in agent configuration. Please configure the agent first.
          </div>
        </div>
      )}

      {isRagAgent(agentConfig) && !getApiKey() && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-600">
            ⚠️ Local model server not available. Please start the local model server first.
          </div>
        </div>
      )}

      {isWeatherAgent() && !hasWeatherCapability() && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-600">
            ⚠️ No OpenWeather API key found in agent configuration. Please configure the agent first.
          </div>
        </div>
      )}

      {isSearchAgent() && !hasSearchCapability() && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-600">
            ⚠️ No SerpAPI key found in agent configuration. Please configure the agent first.
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
            placeholder={canAgentFunction() ? "Type your message..." : "Configure agent first..."}
            disabled={!canAgentFunction() || isLoading}
            className="flex-1 px-3 py-2 border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !canAgentFunction() || isLoading}
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
