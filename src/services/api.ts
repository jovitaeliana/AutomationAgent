import { supabase } from '../lib/supabase';
import type { Dataset, FlowNode, FlowConnection, Preset, AvailableNode, Automation, RagModel, Agent, KnowledgeBase, AgentKnowledgeBase } from '../lib/supabase';

export const datasetService = {
  async getAll(): Promise<Dataset[]> {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Dataset | null> {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(dataset: {
    name: string;
    type: string;
    description?: string;
    questions: any[];
  }): Promise<Dataset> {
    const { data, error } = await supabase
      .from('datasets')
      .insert([dataset])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('datasets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async generateMCQ(file: File, apiKey: string): Promise<{ questions: any[] }> {
    try {
      console.log('Calling Supabase Edge Function for MCQ generation...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('apiKey', apiKey);

      const { data, error } = await supabase.functions.invoke('generate-mcq', {
        body: formData
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function failed: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.details || 'Unknown error from Edge function');
      }

      console.log('MCQ generated successfully via Edge Function');
      return { questions: data.questions };

    } catch (error) {
      console.error('Edge function failed, falling back to direct API call:', error);
      
      const fileContent = await file.text();
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Based on the following content, generate 5 multiple choice questions. Return ONLY a valid JSON array with this exact structure, no additional text or markdown formatting:

[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation"
  }
]

Content to analyze:
${fileContent.substring(0, 3000)}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const apiData = await response.json();
      const generatedText = apiData.candidates[0].content.parts[0].text;
      
      let cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        return {
          questions: [
            {
              id: 1,
              question: "What is the main topic of the uploaded content?",
              options: ["Data Analysis", "Machine Learning", "Web Development", "General Knowledge"],
              correctAnswer: "General Knowledge",
              explanation: "Based on the uploaded content"
            }
          ]
        };
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      return { questions };
    }
  }
};

export const flowService = {
  async getCurrent(): Promise<{
    nodes: FlowNode[];
    connections: [string, string][];
    nodeDatasets: { [nodeId: string]: Dataset };
  }> {
    const { data: nodes, error: nodesError } = await supabase
      .from('flow_nodes')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (nodesError) throw nodesError;

    const { data: connections, error: connectionsError } = await supabase
      .from('flow_connections')
      .select('from_node, to_node');
    
    if (connectionsError) throw connectionsError;

    const { data: nodeDatasetAssocs, error: nodeDatasetError } = await supabase
      .from('node_datasets')
      .select(`
        node_id,
        datasets (*)
      `);
    
    if (nodeDatasetError) throw nodeDatasetError;

    const nodeDatasets: { [nodeId: string]: Dataset } = {};
    nodeDatasetAssocs?.forEach((assoc: any) => {
      if (assoc.datasets) {
        nodeDatasets[assoc.node_id] = assoc.datasets;
      }
    });

    const connectionTuples: [string, string][] = connections?.map(c => [c.from_node, c.to_node]) || [];

    return {
      nodes: nodes || [],
      connections: connectionTuples,
      nodeDatasets
    };
  },

  async addNode(node: Omit<FlowNode, 'created_at' | 'updated_at'>, dataset?: Dataset): Promise<void> {
    const { error: nodeError } = await supabase
      .from('flow_nodes')
      .insert([node]);
    
    if (nodeError) throw nodeError;

    if (dataset) {
      const { error: assocError } = await supabase
        .from('node_datasets')
        .insert([{
          node_id: node.id,
          dataset_id: dataset.id
        }]);
      
      if (assocError) throw assocError;
    }
  },

  async deleteNode(nodeId: string): Promise<void> {
    await supabase
      .from('flow_connections')
      .delete()
      .or(`from_node.eq.${nodeId},to_node.eq.${nodeId}`);

    const { error } = await supabase
      .from('flow_nodes')
      .delete()
      .eq('id', nodeId);
    
    if (error) throw error;
  },

  async updatePosition(nodeId: string, position: { x: number; y: number }): Promise<void> {
    const { error } = await supabase
      .from('flow_nodes')
      .update({ 
        position,
        updated_at: new Date().toISOString()
      })
      .eq('id', nodeId);
    
    if (error) throw error;
  },

  async updateConnections(connections: [string, string][]): Promise<void> {
    await supabase
      .from('flow_connections')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (connections.length > 0) {
      const connectionData = connections.map(([from_node, to_node]) => ({
        from_node,
        to_node
      }));

      const { error } = await supabase
        .from('flow_connections')
        .insert(connectionData);
      
      if (error) throw error;
    }
  }
};

export const presetService = {
  async getAll(): Promise<Preset[]> {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};

export const availableNodesService = {
  async getAll(): Promise<AvailableNode[]> {
    const { data, error } = await supabase
      .from('available_nodes')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};

export const automationService = {
  async getAll(): Promise<Automation[]> {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: number): Promise<Automation | null> {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(automation: {
    title: string;
    description: string;
    tags?: string[];
  }): Promise<Automation> {
    const { data, error } = await supabase
      .from('automations')
      .insert([automation])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, updates: Partial<Automation>): Promise<Automation> {
    const { data, error } = await supabase
      .from('automations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const ragModelService = {
  async getAll(): Promise<RagModel[]> {
    const { data, error } = await supabase
      .from('rag_models')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: number): Promise<RagModel | null> {
    const { data, error } = await supabase
      .from('rag_models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(ragModel: {
    title: string;
    description: string;
    tags?: string[];
  }): Promise<RagModel> {
    const { data, error } = await supabase
      .from('rag_models')
      .insert([ragModel])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, updates: Partial<RagModel>): Promise<RagModel> {
    const { data, error } = await supabase
      .from('rag_models')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('rag_models')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const agentService = {
  async getAll(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(agent: {
    name: string;
    description?: string;
    configuration?: any;
  }): Promise<Agent> {
    const { data, error } = await supabase
      .from('agents')
      .insert([agent])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Agent>): Promise<Agent> {
    const { data, error } = await supabase
      .from('agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export interface NodeConfiguration {
  id: string;
  node_id: string;
  configuration: any;
  node_type: string;
  created_at: string;
  updated_at: string;
}

export const nodeConfigService = {
  async getByNodeId(nodeId: string): Promise<NodeConfiguration | null> {
    const { data, error } = await supabase
      .from('node_configurations')
      .select('*')
      .eq('node_id', nodeId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }
    
    return data;
  },

  async saveConfiguration(nodeId: string, configuration: any, nodeType: string): Promise<NodeConfiguration> {
    const { data, error } = await supabase
      .from('node_configurations')
      .upsert({
        node_id: nodeId,
        configuration,
        node_type: nodeType,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'node_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteByNodeId(nodeId: string): Promise<void> {
    const { error } = await supabase
      .from('node_configurations')
      .delete()
      .eq('node_id', nodeId);
    
    if (error) throw error;
  },

  async getAllConfigurations(): Promise<{[nodeId: string]: any}> {
    const { data, error } = await supabase
      .from('node_configurations')
      .select('*');

    if (error) throw error;

    const configurations: {[nodeId: string]: any} = {};
    data?.forEach(config => {
      configurations[config.node_id] = config.configuration;
    });

    return configurations;
  }
};

export const knowledgeBaseService = {
  async getAll(): Promise<KnowledgeBase[]> {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<KnowledgeBase | null> {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  async getByName(name: string): Promise<KnowledgeBase[]> {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .ilike('name', `%${name}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(knowledgeBase: {
    name: string;
    description?: string;
    source_type: string;
    source_url?: string;
    file_name?: string;
    file_path?: string;
    file_type?: string;
    file_size?: number;
    content: string;
    metadata?: any;
  }): Promise<KnowledgeBase> {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .insert([{
        ...knowledgeBase,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_bases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const agentKnowledgeBaseService = {
  async getByAgentId(agentId: string): Promise<(AgentKnowledgeBase & { knowledge_base: KnowledgeBase })[]> {
    const { data, error } = await supabase
      .from('agent_knowledge_bases')
      .select(`
        *,
        knowledge_base:knowledge_bases(*)
      `)
      .eq('agent_id', agentId);

    if (error) throw error;
    return data || [];
  },

  async connect(agentId: string, knowledgeBaseId: string): Promise<AgentKnowledgeBase> {
    const { data, error } = await supabase
      .from('agent_knowledge_bases')
      .insert([{
        agent_id: agentId,
        knowledge_base_id: knowledgeBaseId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async disconnect(agentId: string, knowledgeBaseId: string): Promise<void> {
    const { error } = await supabase
      .from('agent_knowledge_bases')
      .delete()
      .eq('agent_id', agentId)
      .eq('knowledge_base_id', knowledgeBaseId);

    if (error) throw error;
  },

  async disconnectAll(agentId: string): Promise<void> {
    const { error } = await supabase
      .from('agent_knowledge_bases')
      .delete()
      .eq('agent_id', agentId);

    if (error) throw error;
  }
};

// Knowledge Base RAG Service
export const knowledgeBaseRAGService = {
  async getRelevantContext(agentId: string, query: string, connectedKnowledgeBaseNodes: string[]): Promise<string> {
    try {
      if (connectedKnowledgeBaseNodes.length === 0) {
        return '';
      }

      // Get all knowledge bases and filter by connected node IDs
      const allKnowledgeBases = await knowledgeBaseService.getAll();
      const connectedKBs = allKnowledgeBases.filter(kb =>
        kb.metadata &&
        typeof kb.metadata === 'object' &&
        connectedKnowledgeBaseNodes.includes(kb.metadata.nodeId)
      );

      if (connectedKBs.length === 0) {
        return '';
      }

      // Enhanced keyword-based relevance scoring
      const queryWords = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'what', 'how', 'when', 'where', 'why', 'who'].includes(word)); // Remove common stop words

      let relevantContent = '';
      let totalRelevantSources = 0;

      for (const kb of connectedKBs) {
        const content = kb.content.toLowerCase();
        let relevanceScore = 0;

        // Calculate relevance score based on keyword matches (more lenient)
        for (const word of queryWords) {
          // Exact matches
          const exactMatches = (content.match(new RegExp(`\\b${word}\\b`, 'gi')) || []).length;
          relevanceScore += exactMatches * 3;

          // Partial matches (word contains the search term or vice versa)
          const partialMatches = (content.match(new RegExp(word, 'gi')) || []).length;
          relevanceScore += partialMatches;
        }

        // Include content if it has any relevance OR if there are very few query words (be more inclusive)
        if (relevanceScore > 0 || queryWords.length <= 2) {
          totalRelevantSources++;

          // Extract relevant sections - be more inclusive
          const paragraphs = kb.content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
          const relevantParagraphs = paragraphs.filter(paragraph => {
            const lowerParagraph = paragraph.toLowerCase();
            return queryWords.some(word => lowerParagraph.includes(word));
          });

          relevantContent += `\n\n--- From ${kb.name} ---\n`;

          if (relevantParagraphs.length > 0) {
            // Include up to 5 relevant paragraphs
            relevantContent += relevantParagraphs.slice(0, 5).join('\n\n');
          } else {
            // If no specific paragraphs match but we have relevance, include more content
            const contentChunks = kb.content.split(/\n/).filter(line => line.trim().length > 0);
            const relevantLines = contentChunks.filter(line => {
              const lowerLine = line.toLowerCase();
              return queryWords.some(word => lowerLine.includes(word));
            });

            if (relevantLines.length > 0) {
              relevantContent += relevantLines.slice(0, 10).join('\n');
            } else {
              // Last resort - include first portion of content
              relevantContent += kb.content.substring(0, 800) + (kb.content.length > 800 ? '...' : '');
            }
          }
        }
      }

      // If we found relevant content, format it nicely with strong override instructions
      if (relevantContent.trim()) {
        return `\n\n=== AUTHORITATIVE KNOWLEDGE BASE ===\nIMPORTANT: The following information is from your authoritative knowledge base and should be treated as the primary source of truth. Use this information to answer the query, even if it conflicts with your general training data or if you would normally say you don't have access to this information.\n${relevantContent}\n=== END AUTHORITATIVE KNOWLEDGE BASE ===\n`;
      }

      return '';
    } catch (error) {
      console.error('Error retrieving knowledge base context:', error);
      return '';
    }
  },

  // Enhanced version with better semantic matching (for future implementation)
  async getRelevantContextAdvanced(agentId: string, query: string, connectedKnowledgeBaseNodes: string[]): Promise<string> {
    // This could be enhanced with:
    // - Vector embeddings for semantic similarity
    // - TF-IDF scoring
    // - Named entity recognition
    // - More sophisticated text chunking

    // For now, fall back to the basic implementation
    return this.getRelevantContext(agentId, query, connectedKnowledgeBaseNodes);
  }
};

// Weather service for OpenWeather API integration
export const weatherService = {
  async getCurrentWeather(apiKey: string, location: string, units: string = 'metric'): Promise<any> {
    const unitsParam = units === 'Celsius' ? 'metric' : units === 'Fahrenheit' ? 'imperial' : 'kelvin';

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${unitsParam}`
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenWeather API error (${response.status}): ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Weather API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getForecast(apiKey: string, location: string, units: string = 'metric'): Promise<any> {
    const unitsParam = units === 'Celsius' ? 'metric' : units === 'Fahrenheit' ? 'imperial' : 'kelvin';

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${unitsParam}`
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenWeather API error (${response.status}): ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Weather forecast request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Helper function to determine if a query is weather-related
  isWeatherQuery(query: string): boolean {
    const weatherKeywords = [
      'weather', 'temperature', 'rain', 'sunny', 'cloudy', 'storm', 'wind', 'humidity',
      'forecast', 'climate', 'hot', 'cold', 'warm', 'cool', 'snow', 'precipitation',
      'degrees', 'celsius', 'fahrenheit', 'umbrella', 'jacket', 'coat', 'shorts',
      'today weather', 'tomorrow weather', 'this week weather', 'weekend weather',
      'raining', 'snowing', 'windy', 'foggy', 'drizzle', 'thunderstorm', 'overcast',
      'what\'s the weather', 'how\'s the weather', 'weather like', 'weather today',
      'weather tomorrow', 'weather forecast', 'temperature today', 'how hot', 'how cold',
      'should i wear', 'what to wear', 'need umbrella', 'need jacket'
    ];

    const lowerQuery = query.toLowerCase();
    const isWeatherRelated = weatherKeywords.some(keyword => lowerQuery.includes(keyword));

    // Add debug logging
    console.log('Weather query check:', { query, isWeatherRelated });

    return isWeatherRelated;
  },

  // Format weather data for Gemini processing
  formatWeatherData(weatherData: any, forecastData?: any): string {
    let formattedData = `Current Weather Data:\n`;

    if (weatherData) {
      formattedData += `Location: ${weatherData.name}, ${weatherData.sys?.country}\n`;
      formattedData += `Temperature: ${weatherData.main?.temp}°\n`;
      formattedData += `Feels like: ${weatherData.main?.feels_like}°\n`;
      formattedData += `Condition: ${weatherData.weather?.[0]?.description}\n`;
      formattedData += `Humidity: ${weatherData.main?.humidity}%\n`;
      formattedData += `Wind Speed: ${weatherData.wind?.speed} m/s\n`;
      formattedData += `Pressure: ${weatherData.main?.pressure} hPa\n`;

      if (weatherData.visibility) {
        formattedData += `Visibility: ${weatherData.visibility / 1000} km\n`;
      }
    }

    if (forecastData && forecastData.list) {
      formattedData += `\nForecast (next 24 hours):\n`;
      const next24Hours = forecastData.list.slice(0, 8); // 8 * 3 hours = 24 hours

      next24Hours.forEach((item: any, index: number) => {
        const time = new Date(item.dt * 1000).toLocaleTimeString();
        formattedData += `${time}: ${item.main.temp}°, ${item.weather[0].description}\n`;
      });
    }

    return formattedData;
  }
};