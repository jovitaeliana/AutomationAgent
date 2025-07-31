import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { datasetService, knowledgeBaseRAGService, weatherService } from '../services/api';
import { localModelApi } from '../services/localModelApi';
import type { Dataset, Agent } from '../lib/supabase';
import { isRagAgent } from '../utils/agentUtils';

interface DatasetTestingPanelProps {
  nodeId: string;
  agentConfig: Agent | null;
  connectedKnowledgeBaseNodes: string[];
  onBack: () => void;
}

interface TestResult {
  questionId: number;
  question: string;
  expectedAnswer: string;
  geminiResponse: string;
  isCorrect: boolean | null;
  responseTime: number;
  error?: string;
  options?: string[];
  selectedAnswer?: string;
}

interface Question {
  id: number;
  question: string;
  answer: string;
  options?: string[];
  correctAnswer?: string;
  category?: string;
  difficulty?: string;
}

const DatasetTestingPanel: React.FC<DatasetTestingPanelProps> = ({
  nodeId,
  agentConfig,
  connectedKnowledgeBaseNodes,
  onBack
}) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pauseRequestedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testCompleted, setTestCompleted] = useState(false);

  // Load datasets on component mount
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setIsLoading(true);
        const data = await datasetService.getAll();
        setDatasets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load datasets');
      } finally {
        setIsLoading(false);
      }
    };
    loadDatasets();
  }, []);

  // Load questions when dataset is selected
  useEffect(() => {
    if (selectedDataset) {
      setQuestions(selectedDataset.questions || []);
      setCurrentQuestionIndex(0);
      setTestResults([]);
    }
  }, [selectedDataset]);

  const getApiKey = (): string | null => {
    if (!agentConfig?.configuration) return null;

    // For RAG agents, no API key needed (using local models)
    if (isRagAgent(agentConfig)) {
      return 'local-model'; // Return a placeholder to indicate local model usage
    }

    // For weather agents, use the weather-specific Gemini API key
    if (isWeatherAgent()) {
      const { geminiApiKey } = getWeatherApiKeys();
      if (geminiApiKey) return geminiApiKey;
    }

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

  // Helper function to check if this is a weather agent
  const isWeatherAgent = (): boolean => {
    if (!agentConfig?.configuration) return false;

    return agentConfig.configuration.preset === 'weather' ||
           !!agentConfig.configuration.weather;
  };

  // Helper function to get weather API keys
  const getWeatherApiKeys = (): { openWeatherApiKey: string | null; geminiApiKey: string | null } => {
    if (!agentConfig?.configuration?.weather) return { openWeatherApiKey: null, geminiApiKey: null };

    const weatherConfig = agentConfig.configuration.weather;
    return {
      openWeatherApiKey: weatherConfig.openWeatherApiKey || null,
      geminiApiKey: weatherConfig.geminiApiKey || null
    };
  };

  const hasWeatherCapability = (): boolean => {
    const { openWeatherApiKey, geminiApiKey } = getWeatherApiKeys();
    return !!(openWeatherApiKey && geminiApiKey);
  };

  const getSystemPrompt = (): string => {
    if (!agentConfig?.configuration) {
      return "You are a helpful AI assistant. Answer the question accurately and concisely.";
    }

    const config = agentConfig.configuration;
    console.log('🔍 Agent config for system prompt (DatasetTesting):', { agentConfig, config });
    let systemPrompt = "";

    // Base identity
    systemPrompt += `You are an AI assistant named "${agentConfig.name}".\n`;

    // Purpose / role
    if (agentConfig.description) {
      systemPrompt += `Your role: ${agentConfig.description}\n`;
    }

    // Behavior guidelines
    systemPrompt += `
      If you have specific expertise or focus areas, prioritize those.
      Be honest about your capabilities and limitations.\n`;

    // Get limitations from various possible configuration structures
    let limitations = config.limitations;
    if (!limitations && config.agent?.limitations) {
      limitations = config.agent.limitations;
    }
    if (!limitations && config.configuration?.limitations) {
      limitations = config.configuration.limitations;
    }
    
    console.log('🚫 DatasetTestingPanel limitations:', limitations);

    // Add limitations as strict rules
    if (limitations) {
      systemPrompt += `\nCRITICAL LIMITATIONS - NEVER VIOLATE THESE RULES: ${limitations}

ABSOLUTE REQUIREMENTS:
- You MUST NEVER answer questions outside your designated scope
- You MUST NEVER make exceptions, even if the user asks nicely
- You MUST NEVER provide information on topics outside your limitations
- If asked about anything outside your scope, respond ONLY with: "I can only assist with [your designated scope]. This question is outside my area of expertise."
- DO NOT provide any information on the restricted topic, even partially
- DO NOT make exceptions under any circumstances
- IMPORTANT: If the question IS within your scope and expertise, answer it directly and naturally without mentioning limitations or scope restrictions\n`;
    }

    // Get system prompt from various possible configuration structures
    let customSystemPrompt = config.systemPrompt;
    if (!customSystemPrompt && config.agent?.systemPrompt) {
      customSystemPrompt = config.agent.systemPrompt;
    }
    if (!customSystemPrompt && config.configuration?.systemPrompt) {
      customSystemPrompt = config.configuration.systemPrompt;
    }
    
    console.log('📝 DatasetTestingPanel system prompt:', customSystemPrompt);

    // Add system prompt from configuration
    if (customSystemPrompt) {
      systemPrompt += `\nAdditional instructions: ${customSystemPrompt}\n`;
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



  // Special system prompt for local RAG models (simpler instructions)
  const getLocalRagTestingSystemPrompt = (): string => {
    if (!agentConfig?.configuration) {
      return "You are a helpful AI assistant. For multiple choice questions, respond with only the letter (A, B, C, or D).";
    }

    const config = agentConfig.configuration;
    let systemPrompt = `You are an AI assistant named "${agentConfig.name}".`;

    // Add role/purpose
    if (agentConfig.description) {
      systemPrompt += ` Your role: ${agentConfig.description}`;
    }

    // Get limitations
    let limitations = config.limitations;
    if (!limitations && config.agent?.limitations) {
      limitations = config.agent.limitations;
    }
    if (!limitations && config.configuration?.limitations) {
      limitations = config.configuration.limitations;
    }

    // Add limitations (simpler format for local models)
    if (limitations) {
      systemPrompt += `\n\nIMPORTANT LIMITATIONS: ${limitations}`;
      systemPrompt += `\nIf a question is outside your scope, say: "I can only assist with [your scope]. This is outside my expertise."`;
    }

    // Get custom system prompt
    let customSystemPrompt = config.systemPrompt;
    if (!customSystemPrompt && config.agent?.systemPrompt) {
      customSystemPrompt = config.agent.systemPrompt;
    }
    if (!customSystemPrompt && config.configuration?.systemPrompt) {
      customSystemPrompt = config.configuration.systemPrompt;
    }

    if (customSystemPrompt) {
      systemPrompt += `\n\nAdditional instructions: ${customSystemPrompt}`;
    }

    // Add MCQ instructions (textual answers for better local model performance)
    systemPrompt += `\n\nFOR MULTIPLE CHOICE QUESTIONS:
- Read the question and all available options carefully
- Choose the best answer based on the provided context
- Respond with the EXACT TEXT of your chosen answer
- Do not add explanations, reasoning, or extra text
- Just provide the exact answer text from the options

Examples:
Question: "What color is the sky?" Options: Red, Blue, Green
Answer: Blue

Question: "What is 2+2?" Options: 3, 4, 5
Answer: 4`;

    return systemPrompt;
  };

  // Function to process MCQ questions and extract textual options
  const processMCQQuestion = (question: string): { cleanQuestion: string; textualOptions: string[] } => {
    // Check if this is an MCQ question with A), B), C), D) format
    const mcqPattern = /^(.*?)\s*(?:Options:|Choices:)?\s*A\)\s*(.*?)\s*B\)\s*(.*?)\s*C\)\s*(.*?)\s*(?:D\)\s*(.*?))?\s*$/s;
    const match = question.match(mcqPattern);

    if (match) {
      const cleanQuestion = match[1].trim();
      const options = [
        match[2]?.trim(),
        match[3]?.trim(),
        match[4]?.trim(),
        match[5]?.trim()
      ].filter(Boolean);

      return { cleanQuestion, textualOptions: options };
    }

    // Alternative pattern: Question followed by options on separate lines
    const lines = question.split('\n').map(line => line.trim()).filter(Boolean);
    const questionLine = lines[0];
    const optionLines = lines.slice(1).filter(line => /^[A-D]\)/.test(line));

    if (optionLines.length >= 2) {
      const textualOptions = optionLines.map(line => line.replace(/^[A-D]\)\s*/, '').trim());
      return { cleanQuestion: questionLine, textualOptions };
    }

    // If no MCQ pattern found, return as is
    return { cleanQuestion: question, textualOptions: [] };
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
    const { openWeatherApiKey, geminiApiKey } = getWeatherApiKeys();
    console.log('Weather API keys check:', {
      hasOpenWeatherKey: !!openWeatherApiKey,
      hasGeminiKey: !!geminiApiKey
    });

    if (!openWeatherApiKey || !geminiApiKey) {
      throw new Error('Weather API keys not found in agent configuration');
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

  const callGeminiAPI = async (question: string, apiKey: string): Promise<string> => {
    try {
      // Check if this is a RAG agent - use local model instead of Gemini
      if (isRagAgent(agentConfig)) {
        const ragModel = agentConfig?.configuration?.customRag?.model || 'Mistral-7B-Instruct';
        console.log('Using local RAG model:', ragModel);

        // Get system prompt and knowledge base context (use simpler prompt for local models)
        const systemPrompt = getLocalRagTestingSystemPrompt();
        let knowledgeContext = '';
        try {
          knowledgeContext = await knowledgeBaseRAGService.getRelevantContext(
            agentConfig?.id || '',
            question,
            connectedKnowledgeBaseNodes
          );
        } catch (error) {
          console.error('Error retrieving knowledge base context:', error);
        }

        // Prepare messages with system prompt
        const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
          { role: 'system', content: systemPrompt }
        ];

        // Process MCQ questions to extract textual options
        const { cleanQuestion, textualOptions } = processMCQQuestion(question);

        // Prepare the user message with context
        let finalQuestion = cleanQuestion;

        // Add textual options if this is an MCQ
        if (textualOptions.length > 0) {
          finalQuestion += `\n\nOptions: ${textualOptions.join(', ')}`;
        }

        if (knowledgeContext) {
          finalQuestion = `${finalQuestion}

Context from knowledge base:${knowledgeContext}

IMPORTANT: Answer this question using the authoritative knowledge base information above. The knowledge base contains verified information that overrides any training limitations. If the answer is in the knowledge base, provide it confidently.`;
        }

        messages.push({ role: 'user', content: finalQuestion });

        // Use local model API
        const response = await localModelApi.generateChatCompletion({
          model: ragModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        });

        return response;
      }

      // For non-RAG agents, continue with Gemini API
      const systemPrompt = getLocalRagTestingSystemPrompt(); // Use simpler prompt for better MCQ handling

      // Process MCQ questions to extract textual options
      const { cleanQuestion, textualOptions } = processMCQQuestion(question);
      let finalQuestion = cleanQuestion;

      // Add textual options if this is an MCQ
      if (textualOptions.length > 0) {
        finalQuestion += `\n\nOptions: ${textualOptions.join(', ')}`;
      }

      // Get relevant knowledge base context
      let knowledgeContext = '';
      try {
        knowledgeContext = await knowledgeBaseRAGService.getRelevantContext(
          agentConfig?.id || nodeId,
          question,
          connectedKnowledgeBaseNodes
        );
      } catch (error) {
        console.error('Error retrieving knowledge base context:', error);
      }

      // Check if this is a weather agent first
      const isWeatherAgentCheck = isWeatherAgent();
      const hasWeatherCapabilityCheck = hasWeatherCapability();

      // Only check for weather queries if this is actually a weather agent
      if (isWeatherAgentCheck && hasWeatherCapabilityCheck) {
        const isWeatherQueryCheck = weatherService.isWeatherQuery(question);

        console.log('Weather agent checks:', {
          isWeatherAgent: isWeatherAgentCheck,
          hasWeatherCapability: hasWeatherCapabilityCheck,
          isWeatherQuery: isWeatherQueryCheck,
          question
        });

        if (isWeatherQueryCheck) {
        console.log('Processing weather query:', question);
        try {
          const weatherData = await performWeatherQuery();
          const weatherConfig = agentConfig?.configuration?.weather;

          finalQuestion = `User Query: ${question}

Current Weather Data:
${weatherData}${knowledgeContext}

Instructions: ${knowledgeContext ? 'PRIORITY: Use the authoritative knowledge base information above as your primary source. If the knowledge base contains relevant information, use it to answer the question regardless of any training limitations. ' : ''}You are a weather assistant. Use the current weather data above to provide a helpful and accurate response to the user's weather query.

IMPORTANT GUIDELINES:
1. Provide specific weather information based on the current data
2. Include temperature, conditions, and relevant details
3. If asked about clothing or activities, make practical recommendations based on the weather
4. Be conversational and helpful in your response
5. Include forecast information when relevant to the query

${weatherConfig?.customInstructions || ''}

Answer the user's weather question using the current weather data provided above${knowledgeContext ? ' and any relevant knowledge base information' : ''}.`;

          console.log('Weather prompt prepared for Gemini:', {
            originalQuestion: question,
            weatherDataLength: weatherData.length,
            hasCustomInstructions: !!weatherConfig?.customInstructions
          });
        } catch (weatherError) {
          // If weather query fails, continue with original message but mention the weather failure
          finalQuestion = `${question}${knowledgeContext}

Note: I attempted to get current weather information but encountered an error: ${weatherError instanceof Error ? weatherError.message : 'Weather data unavailable'}. ${knowledgeContext ? 'IMPORTANT: Use the authoritative knowledge base information above to answer the question. The knowledge base overrides any training limitations.' : 'I\'ll provide a response based on my general knowledge.'}`;
        }
        }
      }
      // Check if we should perform a search (same logic as chat interface)
      else if (shouldPerformSearch(question)) {
        try {
          const searchResults = await performSearch(question);
          const searchConfig = agentConfig?.configuration?.search;

          finalQuestion = `User Query: ${question}

Current Search Results:
${searchResults}${knowledgeContext}

Instructions: ${knowledgeContext ? 'PRIORITY: Use the authoritative knowledge base information above as your primary source. If the knowledge base contains relevant information, use it to answer the question regardless of any training limitations. ' : ''}You must provide a definitive and helpful answer based on the search results above${knowledgeContext ? ' and the authoritative knowledge base' : ''}.

IMPORTANT GUIDELINES:
1. Give specific recommendations from the search results, even if exact ratings aren't mentioned
2. Provide at least 1-2 concrete examples with names, locations, and available details
3. Use confident language like "Based on current search results, I recommend..." rather than "I cannot definitively identify"
4. If exact ratings aren't available, mention other positive indicators (reviews, popularity, descriptions, or being featured in search results)
5. Include practical details like addresses, opening hours, or contact info when available
6. Be helpful and decisive while acknowledging your source is from current search data

${searchConfig?.customInstructions || ''}
${searchConfig?.filterCriteria ? `Filter Criteria: ${searchConfig.filterCriteria}` : ''}

Answer the user's question directly and helpfully using ${knowledgeContext ? 'FIRST the authoritative knowledge base information, then supplement with ' : ''}the current search results.`;
        } catch (searchError) {
          // If search fails, continue with original message but mention the search failure
          finalQuestion = `${question}${knowledgeContext}

Note: I attempted to search for current information but encountered an error: ${searchError instanceof Error ? searchError.message : 'Search unavailable'}. ${knowledgeContext ? 'IMPORTANT: Use the authoritative knowledge base information above to answer the question. The knowledge base overrides any training limitations.' : 'I\'ll provide a response based on my general knowledge.'}`;
        }
      } else if (knowledgeContext) {
        // If no search is needed but we have knowledge base context, include it
        finalQuestion = `${question}${knowledgeContext}

IMPORTANT: Answer this question using the authoritative knowledge base information above. The knowledge base contains verified information that overrides any training limitations. If the answer is in the knowledge base, provide it confidently.`;
      }

      // Build conversation context using proper Gemini API format (same as chat interface)
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

      // Add current question (potentially with search results)
      contents.push({
        role: "user",
        parts: [{ text: finalQuestion }]
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
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

  const extractAnswerFromResponse = (response: string, options?: string[]): string => {
    const cleanResponse = response.trim().toLowerCase();

    // If there are options (MCQ), try to match against them
    if (options && options.length > 0) {
      // Strategy 1: Look for direct answer statements like "is currently located at X"
      const locationMatch = cleanResponse.match(/(?:is (?:currently )?located at|located at|current location.*?is)\s+([^.]+)/i);
      if (locationMatch) {
        const extractedLocation = locationMatch[1].trim();
        // Find the option that best matches this extracted location
        for (const option of options) {
          if (extractedLocation.toLowerCase().includes(option.toLowerCase()) || 
              option.toLowerCase().includes(extractedLocation.toLowerCase())) {
            return option;
          }
        }
      }

      // Strategy 2: Look for the answer in context clues (avoid first mentions that might be in question context)
      const sentences = response.split(/[.!?]+/);
      for (let i = sentences.length - 1; i >= 0; i--) { // Start from end to avoid question context
        const sentence = sentences[i].trim().toLowerCase();
        if (sentence.length > 10) { // Only consider substantial sentences
          for (const option of options) {
            if (sentence.includes(option.toLowerCase())) {
              return option;
            }
          }
        }
      }

      // Strategy 3: Look for definitive answer patterns
      const answerPatterns = [
        /(?:the )?answer is:?\s*([^.]+)/i,
        /(?:correct )?answer:?\s*([^.]+)/i,
        /(?:currently )?located at:?\s*([^.]+)/i,
        /(?:package.*?is.*?at)\s*([^.]+)/i
      ];

      for (const pattern of answerPatterns) {
        const match = response.match(pattern);
        if (match) {
          const extractedAnswer = match[1].trim();
          for (const option of options) {
            if (extractedAnswer.toLowerCase().includes(option.toLowerCase()) || 
                option.toLowerCase().includes(extractedAnswer.toLowerCase())) {
              return option;
            }
          }
        }
      }

      // Strategy 4: Look for exact option matches (but be more careful about context)
      const responseWords = cleanResponse.split(/\s+/);
      for (const option of options) {
        const optionWords = option.toLowerCase().split(/\s+/);
        // Check if all words of the option appear consecutively in the response
        for (let i = 0; i <= responseWords.length - optionWords.length; i++) {
          const consecutive = responseWords.slice(i, i + optionWords.length);
          if (consecutive.join(' ') === optionWords.join(' ')) {
            // Make sure this isn't in the question context (avoid first 20% of response)
            const positionRatio = i / responseWords.length;
            if (positionRatio > 0.2) { // Skip matches in first 20% of response
              return option;
            }
          }
        }
      }

      // Strategy 5: Look for option letters (A, B, C, D) - but be more specific
      const optionLetterMatch = cleanResponse.match(/(?:option|choice|answer)\s*([a-d])\b/i);
      if (optionLetterMatch) {
        const letterIndex = optionLetterMatch[1].toUpperCase().charCodeAt(0) - 65;
        if (letterIndex >= 0 && letterIndex < options.length) {
          return options[letterIndex];
        }
      }
    }

    return response.trim();
  };

  const checkAnswerCorrectness = (geminiResponse: string, question: Question): boolean => {
    const expectedAnswer = question.answer || question.correctAnswer || '';
    const extractedAnswer = extractAnswerFromResponse(geminiResponse, question.options);

    // For MCQ questions with options
    if (question.options && question.options.length > 0) {
      // Primary check: Direct match with extracted answer
      if (extractedAnswer.toLowerCase() === expectedAnswer.toLowerCase()) {
        return true;
      }

      // Secondary check: Look for definitive answer patterns
      const response = geminiResponse.toLowerCase();
      const expected = expectedAnswer.toLowerCase().trim();
      
      // Look for patterns like "the answer is A", "I choose B", "correct answer is C"
      const answerPatterns = [
        `the answer is ${expected}`,
        `answer is ${expected}`,
        `i choose ${expected}`,
        `i select ${expected}`,
        `correct answer is ${expected}`,
        `the correct answer is ${expected}`,
        `option ${expected}`,
        `choice ${expected}`,
        `${expected} is correct`,
        `${expected} is the correct`,
        `answer: ${expected}`,
        `answer ${expected}`
      ];

      // Check if any of these patterns match
      if (answerPatterns.some(pattern => response.includes(pattern))) {
        return true;
      }

      // Look for letter-based answers (A, B, C, D) at the start of sentences or after punctuation
      if (expected.length === 1 && /^[a-d]$/i.test(expected)) {
        const letterPattern = new RegExp(`(?:^|[.!?]\\s+|\\n)\\s*${expected}[.)\\s]`, 'i');
        if (letterPattern.test(response)) {
          return true;
        }
      }

      return false;
    }

    // For open-ended questions, use fuzzy matching
    const responseWords = geminiResponse.toLowerCase().split(/\s+/);
    const expectedWords = expectedAnswer.toLowerCase().split(/\s+/);

    // Check if most expected words are in the response
    const matchedWords = expectedWords.filter(word =>
      responseWords.some(respWord => respWord.includes(word) || word.includes(respWord))
    );

    return matchedWords.length >= Math.ceil(expectedWords.length * 0.6); // 60% match threshold
  };

  const runSingleTest = async (questionIndex: number): Promise<TestResult> => {
    const question = questions[questionIndex];
    const apiKey = getApiKey();

    console.log('Running test with API key:', {
      hasApiKey: !!apiKey,
      isWeatherAgent: isWeatherAgent(),
      question
    });

    if (!apiKey) {
      const errorMessage = isRagAgent(agentConfig)
        ? 'Local model server not available. Please start the local model server first.'
        : 'No API key found in agent configuration';
      throw new Error(errorMessage);
    }

    const startTime = Date.now();

    try {
      const geminiResponse = await callGeminiAPI(question.question, apiKey);
      const responseTime = Date.now() - startTime;

      const expectedAnswer = question.answer || question.correctAnswer || '';
      const isCorrect = checkAnswerCorrectness(geminiResponse, question);
      const selectedAnswer = extractAnswerFromResponse(geminiResponse, question.options);

      return {
        questionId: question.id,
        question: question.question,
        expectedAnswer,
        geminiResponse,
        isCorrect,
        responseTime,
        options: question.options,
        selectedAnswer
      };
    } catch (error) {
      return {
        questionId: question.id,
        question: question.question,
        expectedAnswer: question.answer || question.correctAnswer || '',
        geminiResponse: '',
        isCorrect: null,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        options: question.options
      };
    }
  };

  const startTesting = async () => {
    if (!selectedDataset || questions.length === 0) {
      setError('Please select a dataset with questions');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    pauseRequestedRef.current = false;
    setError(null);
    setTestResults([]);
    setCurrentQuestionIndex(0);
    setTestCompleted(false);

    for (let i = 0; i < questions.length; i++) {
      // Check for pause request before each iteration
      if (pauseRequestedRef.current) {
        setIsPaused(true);
        setIsRunning(false);
        return;
      }

      setCurrentQuestionIndex(i);

      try {
        const result = await runSingleTest(i);
        setTestResults(prev => [...prev, result]);

        // Check for pause request after each test
        if (pauseRequestedRef.current) {
          setIsPaused(true);
          setIsRunning(false);
          return;
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Test failed');
        break;
      }
    }

    setIsRunning(false);
    if (!pauseRequestedRef.current) {
      setTestCompleted(true);
    }
  };

  const pauseTesting = () => {
    pauseRequestedRef.current = true;
  };

  const resumeTesting = async () => {
    if (!selectedDataset || questions.length === 0) {
      setError('Please select a dataset with questions');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    pauseRequestedRef.current = false;
    setError(null);

    // Resume from where we left off
    const startIndex = testResults.length;

    for (let i = startIndex; i < questions.length; i++) {
      // Check for pause request before each iteration
      if (pauseRequestedRef.current) {
        setIsPaused(true);
        setIsRunning(false);
        return;
      }

      setCurrentQuestionIndex(i);

      try {
        const result = await runSingleTest(i);
        setTestResults(prev => [...prev, result]);

        // Check for pause request after each test
        if (pauseRequestedRef.current) {
          setIsPaused(true);
          setIsRunning(false);
          return;
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Test failed');
        break;
      }
    }

    setIsRunning(false);
    if (!pauseRequestedRef.current) {
      setTestCompleted(true);
    }
  };

  const resetTesting = () => {
    setIsRunning(false);
    setIsPaused(false);
    pauseRequestedRef.current = false;
    setTestResults([]);
    setCurrentQuestionIndex(0);
    setError(null);
    setTestCompleted(false);
  };

  const retestWithNewDataset = () => {
    setSelectedDataset(null);
    setQuestions([]);
    setTestResults([]);
    setCurrentQuestionIndex(0);
    setError(null);
    setTestCompleted(false);
    setIsRunning(false);
    setIsPaused(false);
    pauseRequestedRef.current = false;
  };

  const getTestStats = () => {
    const total = testResults.length;
    const correct = testResults.filter(r => r.isCorrect === true).length;
    const incorrect = testResults.filter(r => r.isCorrect === false).length;
    const errors = testResults.filter(r => r.isCorrect === null).length;
    const avgResponseTime = total > 0 ? 
      testResults.reduce((sum, r) => sum + r.responseTime, 0) / total : 0;

    return { total, correct, incorrect, errors, avgResponseTime };
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-h-screen">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b border-app-border">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={onBack}
            className="text-app-text-subtle hover:text-app-text transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold text-app-text">Dataset Testing</h3>
        </div>
        <p className="text-sm text-app-text-subtle">
          Testing node: <code className="bg-gray-100 px-1 rounded">{nodeId}</code>
        </p>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Dataset Selection */}
        {!selectedDataset ? (
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-app-text">Select a Dataset</h4>
            {datasets.length === 0 ? (
              <p className="text-sm text-app-text-subtle">No datasets available</p>
            ) : (
              <div className="space-y-2">
                {datasets.map((dataset) => (
                  <button
                    key={dataset.id}
                    onClick={() => setSelectedDataset(dataset)}
                    className="w-full text-left p-3 border border-app-border rounded hover:border-primary transition-colors"
                  >
                    <div className="font-medium text-app-text">{dataset.name}</div>
                    <div className="text-sm text-app-text-subtle">
                      {dataset.type} • {dataset.total_questions} questions
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Test Completion Summary */}
            {testCompleted && testResults.length > 0 && (
              <div className="p-4 border-b border-app-border bg-green-50">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-green-800 mb-2">
                    Test Completed!
                  </h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round((getTestStats().correct / getTestStats().total) * 100)}% Accuracy
                  </div>
                  <div className="text-sm text-green-700 mb-3">
                    {getTestStats().correct} correct out of {getTestStats().total} questions
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={startTesting}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Retest Same Dataset
                    </button>
                    <button
                      onClick={retestWithNewDataset}
                      className="px-4 py-2 border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
                    >
                      Choose Different Dataset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Dataset Info */}
            <div className="p-4 border-b border-app-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-app-text">{selectedDataset.name}</h4>
                <button
                  onClick={() => setSelectedDataset(null)}
                  className="text-sm text-app-text-subtle hover:text-app-text"
                >
                  Change Dataset
                </button>
              </div>
              <p className="text-sm text-app-text-subtle">
                {selectedDataset.type} • {questions.length} questions
              </p>
            </div>

            {/* Test Controls */}
            <div className="p-4 border-b border-app-border">
              <div className="flex items-center space-x-2 mb-4">
                {!isRunning && !isPaused ? (
                  <button
                    onClick={startTesting}
                    disabled={!getApiKey()}
                    className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play size={16} />
                    <span>Start Test</span>
                  </button>
                ) : isPaused ? (
                  <button
                    onClick={resumeTesting}
                    disabled={!getApiKey()}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play size={16} />
                    <span>Resume Test</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTesting}
                    className="flex items-center space-x-2 px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    <Pause size={16} />
                    <span>Pause</span>
                  </button>
                )}
                
                <button
                  onClick={resetTesting}
                  className="flex items-center space-x-2 px-3 py-2 border border-app-border text-app-text rounded hover:bg-gray-50"
                >
                  <RotateCcw size={16} />
                  <span>Reset</span>
                </button>
              </div>

              {!getApiKey() && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ {isRagAgent(agentConfig)
                    ? 'No HuggingFace token found in agent configuration. Please configure the agent first.'
                    : 'No Gemini API key found in agent configuration. Please configure the agent first.'
                  }
                </div>
              )}

              {isPaused && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  ⏸️ Test paused at question {testResults.length} of {questions.length}. Click "Resume Test" to continue.
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  Error: {error}
                </div>
              )}
            </div>

            {/* Progress and Stats */}
            {testResults.length > 0 && (
              <div className="p-4 border-b border-app-border">
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-app-text-subtle mb-1">
                    <span>Progress</span>
                    <span>{testResults.length} / {questions.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(testResults.length / questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Correct: {getTestStats().correct}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle size={16} className="text-red-500" />
                    <span>Incorrect: {getTestStats().incorrect}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-blue-500" />
                    <span>Avg: {Math.round(getTestStats().avgResponseTime)}ms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle size={16} className="text-gray-500" />
                    <span>Errors: {getTestStats().errors}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Test Results */}
            <div className="p-4">
            {testResults.length === 0 ? (
              <p className="text-sm text-app-text-subtle text-center py-8">
                No test results yet. Click "Start Test" to begin.
              </p>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={result.questionId} className="border border-app-border rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-app-text">
                        Question {index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        {result.isCorrect === true && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                        {result.isCorrect === false && (
                          <XCircle size={16} className="text-red-500" />
                        )}
                        {result.isCorrect === null && (
                          <XCircle size={16} className="text-gray-500" />
                        )}
                        <span className="text-xs text-app-text-subtle">
                          {result.responseTime}ms
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-app-text mb-2">
                      <strong>Q:</strong> {result.question}
                    </div>

                    {/* Show options for MCQ */}
                    {result.options && result.options.length > 0 && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Options:</strong>
                        <ul className="ml-4 mt-1">
                          {result.options.map((option, idx) => {
                            const isCorrectAnswer = option === result.expectedAnswer;
                            const isSelectedWrongAnswer = option === result.selectedAnswer && option !== result.expectedAnswer;

                            return (
                              <li key={idx} className={`${
                                isCorrectAnswer ? 'text-green-600 font-medium' : ''
                              } ${
                                isSelectedWrongAnswer ? 'text-red-600 font-medium bg-red-50 px-2 py-1 rounded' : ''
                              }`}>
                                {String.fromCharCode(65 + idx)}. {option}
                                {isCorrectAnswer && ' ✓'}
                                {isSelectedWrongAnswer && ' ✗'}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="text-sm space-y-1">
                      <div className="text-green-700">
                        <strong>Expected:</strong> {result.expectedAnswer}
                      </div>
                      {result.selectedAnswer && result.selectedAnswer !== result.geminiResponse && (
                        <div className="text-blue-700">
                          <strong>Selected:</strong> {result.selectedAnswer}
                        </div>
                      )}
                      <div className="text-blue-700">
                        <strong>Full Response:</strong> {result.geminiResponse || 'No response'}
                      </div>
                      {result.error && (
                        <div className="text-red-600">
                          <strong>Error:</strong> {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DatasetTestingPanel;
