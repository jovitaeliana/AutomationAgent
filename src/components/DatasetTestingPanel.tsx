import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { datasetService } from '../services/api';
import { localModelApi } from '../services/localModelApi';
import type { Dataset, Agent } from '../lib/supabase';
import { isRagAgent } from '../utils/agentUtils';

interface DatasetTestingPanelProps {
  nodeId: string;
  agentConfig: Agent | null;
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
}

interface Question {
  id: number;
  question: string;
  answer: string;
  category?: string;
  difficulty?: string;
}

const DatasetTestingPanel: React.FC<DatasetTestingPanelProps> = ({
  nodeId,
  agentConfig,
  onBack
}) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState<number | null>(null);
  const [isLocalModelServerAvailable, setIsLocalModelServerAvailable] = useState<boolean>(false);

  // Load available datasets on component mount
  useEffect(() => {
    loadDatasets();
  }, []);

  // Check local model server availability
  useEffect(() => {
    const checkServerAvailability = async () => {
      try {
        const isAvailable = await localModelApi.isServerAvailable();
        setIsLocalModelServerAvailable(isAvailable);
      } catch (error) {
        setIsLocalModelServerAvailable(false);
      }
    };

    checkServerAvailability();
    // Check every 30 seconds
    const interval = setInterval(checkServerAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDatasets = async () => {
    try {
      const data = await datasetService.getAll();
      setDatasets(data);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const getApiKey = (): string | null => {
    if (!agentConfig?.configuration) return null;

    // For RAG agents, no API key needed (using local models)
    if (isRagAgent(agentConfig)) {
      return 'local-model'; // Return a placeholder to indicate local model usage
    }

    // Check different possible locations for API key
    const config = agentConfig.configuration;
    return config.geminiApiKey ||
           config.search?.geminiApiKey ||
           config.apiKey ||
           null;
  };

  // Helper function to check if agent requires local model server
  const requiresLocalModelServer = (): boolean => {
    if (!agentConfig?.configuration) return false;
    
    return isRagAgent(agentConfig) ||
           agentConfig.configuration.preset === 'weather' ||
           agentConfig.configuration.preset === 'search';
  };

  const callGeminiAPI = async (question: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('No API key found in agent configuration');
    }

    // Check if this is a RAG agent - use local model instead of Gemini
    if (isRagAgent(agentConfig)) {
      const ragModel = agentConfig?.configuration?.customRag?.model || 'Mistral-7B-Instruct';
      console.log('Using local RAG model:', ragModel);

      // Use local model API
      const response = await localModelApi.generateChatCompletion({
        model: ragModel,
        messages: [
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 1024
      });

      return response;
    }

    // For regular Gemini agents
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: question }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
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
  };

  const checkAnswerCorrectness = (geminiResponse: string, expectedAnswer: string): boolean => {
    // Simple string matching - can be enhanced with more sophisticated comparison
    const response = geminiResponse.toLowerCase().trim();
    const expected = expectedAnswer.toLowerCase().trim();
    
    return response.includes(expected) || expected.includes(response);
  };

  const runTest = async () => {
    if (!selectedDataset || !questions.length) return;

    setIsRunning(true);
    setTestResults([]);
    setCurrentTestIndex(0);

    for (let i = 0; i < questions.length; i++) {
      setCurrentTestIndex(i);
      const question = questions[i];
      const startTime = Date.now();

      try {
        const geminiResponse = await callGeminiAPI(question.question);
        const responseTime = Date.now() - startTime;
        const isCorrect = checkAnswerCorrectness(geminiResponse, question.answer);

        const result: TestResult = {
          questionId: question.id,
          question: question.question,
          expectedAnswer: question.answer,
          geminiResponse,
          isCorrect,
          responseTime
        };

        setTestResults(prev => [...prev, result]);

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const result: TestResult = {
          questionId: question.id,
          question: question.question,
          expectedAnswer: question.answer,
          geminiResponse: '',
          isCorrect: null,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        setTestResults(prev => [...prev, result]);
      }
    }

    setIsRunning(false);
    setCurrentTestIndex(null);
  };

  const resetTest = () => {
    setTestResults([]);
    setCurrentTestIndex(null);
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 p-4 border-b border-app-border">
        <button
          onClick={onBack}
          className="text-app-text-subtle hover:text-app-text transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold text-app-text">Dataset Testing</h3>
      </div>

      {/* API Key Status */}
      {requiresLocalModelServer() && !isLocalModelServerAvailable && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-600">
            ⚠️ Local model server not available. Please start the local model server first by running <code className="bg-red-100 px-1 rounded">./start_local_models.sh</code>
          </div>
        </div>
      )}

      {!getApiKey() && !isRagAgent(agentConfig) && !requiresLocalModelServer() && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-600">
            ⚠️ No Gemini API key found in agent configuration. Please configure the agent first.
          </div>
        </div>
      )}

      {/* Error Display */}
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Dataset Selection */}
        <div>
          <h4 className="text-md font-medium text-app-text mb-3">Select Dataset</h4>
          <div className="space-y-2">
            {datasets.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => {
                  setSelectedDataset(dataset);
                  setQuestions(dataset.questions || []);
                  setTestResults([]);
                }}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  selectedDataset?.id === dataset.id
                    ? 'border-primary bg-primary/5'
                    : 'border-app-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-app-text">{dataset.name}</div>
                <div className="text-sm text-app-text-subtle">
                  {dataset.type} • {dataset.total_questions} questions
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Test Controls */}
        {selectedDataset && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <button
                onClick={runTest}
                disabled={
                  !selectedDataset ||
                  isRunning ||
                  (!getApiKey() && !isRagAgent(agentConfig)) ||
                  (requiresLocalModelServer() && !isLocalModelServerAvailable)
                }
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  !selectedDataset ||
                  isRunning ||
                  (!getApiKey() && !isRagAgent(agentConfig)) ||
                  (requiresLocalModelServer() && !isLocalModelServerAvailable)
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-hover'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Play size={16} />
                  <span>{isRunning ? 'Running Test...' : 'Start Test'}</span>
                </div>
              </button>
              
              <button
                onClick={resetTest}
                disabled={isRunning}
                className="px-4 py-3 border border-app-border text-app-text rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Progress */}
            {isRunning && currentTestIndex !== null && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-app-text-subtle mb-1">
                  <span>Testing question {currentTestIndex + 1} of {questions.length}</span>
                  <span>{Math.round(((currentTestIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentTestIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Test Statistics */}
            {testResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm font-medium text-green-700">Correct</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{getTestStats().correct}</div>
                </div>
                
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <XCircle size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-red-700">Incorrect</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{getTestStats().incorrect}</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <XCircle size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Errors</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-600">{getTestStats().errors}</div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">Avg Time</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(getTestStats().avgResponseTime)}ms
                  </div>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-app-text mb-3">Test Results</h4>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={result.questionId} className="border border-app-border rounded-lg p-4">
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
                      
                      <div className="text-sm space-y-1">
                        <div className="text-green-700">
                          <strong>Expected:</strong> {result.expectedAnswer}
                        </div>
                        <div className="text-blue-700">
                          <strong>Response:</strong> {result.geminiResponse || 'No response'}
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetTestingPanel;