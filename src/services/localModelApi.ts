/**
 * Local Model API Service
 * Handles communication with the local model server for RAG agents
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatResponse {
  model: string;
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ModelInfo {
  id: string;
  name: string;
  available: boolean;
}

interface ModelsResponse {
  models: ModelInfo[];
}

class LocalModelApiService {
  private baseUrl: string;

  // Map full model names to server model keys
  private modelNameMap: Record<string, string> = {
    'Mistral-7B-Instruct': 'mistral',
    'Llama-3-8B-Instruct': 'llama',
    'TinyLlama-1.1B-Chat': 'tinyllama',
    'OpenHermes-2.5-Mistral': 'openhermes'
  };

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Convert full model name to server model key
   */
  private getModelKey(modelName: string): string {
    return this.modelNameMap[modelName] || modelName.toLowerCase();
  }

  /**
   * Check if the local model server is available
   */
  async isServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Explicitly set CORS mode
      });
      return response.ok;
    } catch (error) {
      console.warn('Local model server not available:', error);
      return false;
    }
  }

  /**
   * Get list of available models
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Explicitly set CORS mode
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ModelsResponse = await response.json();
      return data.models;
    } catch (error) {
      console.error('Error fetching available models:', error);
      throw new Error('Failed to fetch available models from local server');
    }
  }

  /**
   * Generate chat completion using local model
   */
  async generateChatCompletion(request: ChatRequest): Promise<string> {
    try {
      // Check if server is available first
      const serverAvailable = await this.isServerAvailable();
      if (!serverAvailable) {
        throw new Error('Local model server is not available. Please start the server first.');
      }

      // Convert full model name to server model key
      const modelKey = this.getModelKey(request.model);

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Explicitly set CORS mode
        body: JSON.stringify({
          model: modelKey,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error generating chat completion:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate response from local model');
    }
  }

  /**
   * Generate response for RAG query
   * This method formats the query appropriately for RAG use cases
   */
  async generateRagResponse(
    model: string,
    query: string,
    context: string = '',
    systemPrompt: string = ''
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add context and query
    const userContent = context 
      ? `Context: ${context}\n\nQuestion: ${query}\n\nPlease answer the question based on the provided context.`
      : query;

    messages.push({
      role: 'user',
      content: userContent,
    });

    return this.generateChatCompletion({
      model: model, // The generateChatCompletion method will handle the mapping
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });
  }

  /**
   * Test connection to local model server
   */
  async testConnection(): Promise<{ success: boolean; message: string; models?: ModelInfo[] }> {
    try {
      const serverAvailable = await this.isServerAvailable();
      if (!serverAvailable) {
        return {
          success: false,
          message: 'Local model server is not running. Please start the server on port 8000.',
        };
      }

      const models = await this.getAvailableModels();
      const availableModels = models.filter(model => model.available);

      if (availableModels.length === 0) {
        return {
          success: false,
          message: 'No models are available. Please ensure your .gguf files are in the models directory.',
          models,
        };
      }

      return {
        success: true,
        message: `Connected successfully. ${availableModels.length} model(s) available.`,
        models,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Export singleton instance
export const localModelApi = new LocalModelApiService();

// Export types for use in other files
export type { ChatMessage, ChatRequest, ChatResponse, ModelInfo };
