import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { datasetService } from '../services/api';
import type { Dataset, Agent } from '../lib/supabase';

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
  options?: string[];
  correctAnswer?: string;
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    // Check different possible locations for API key
    const config = agentConfig.configuration;
    return config.geminiApiKey || 
           config.search?.geminiApiKey || 
           config.apiKey || 
           null;
  };

  const callGeminiAPI = async (question: string, apiKey: string): Promise<string> => {
    const startTime = Date.now();

    try {
      const systemPrompt = agentConfig?.configuration?.systemPrompt ||
                          "You are a helpful AI assistant. Answer the question accurately and concisely.";

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{
                text: `${systemPrompt}\n\nQuestion: ${question}\n\nPlease provide a direct, concise answer.`
              }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runSingleTest = async (questionIndex: number): Promise<TestResult> => {
    const question = questions[questionIndex];
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('No API key found in agent configuration');
    }

    const startTime = Date.now();
    
    try {
      const geminiResponse = await callGeminiAPI(question.question, apiKey);
      const responseTime = Date.now() - startTime;
      
      // Simple comparison - you might want to make this more sophisticated
      const expectedAnswer = question.answer || question.correctAnswer || '';
      const isCorrect = geminiResponse.toLowerCase().includes(expectedAnswer.toLowerCase()) ||
                       expectedAnswer.toLowerCase().includes(geminiResponse.toLowerCase());

      return {
        questionId: question.id,
        question: question.question,
        expectedAnswer,
        geminiResponse,
        isCorrect,
        responseTime
      };
    } catch (error) {
      return {
        questionId: question.id,
        question: question.question,
        expectedAnswer: question.answer || question.correctAnswer || '',
        geminiResponse: '',
        isCorrect: null,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
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
    setError(null);
    setTestResults([]);
    setCurrentQuestionIndex(0);

    for (let i = 0; i < questions.length; i++) {
      if (isPaused) break;
      
      setCurrentQuestionIndex(i);
      
      try {
        const result = await runSingleTest(i);
        setTestResults(prev => [...prev, result]);
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Test failed');
        break;
      }
    }

    setIsRunning(false);
  };

  const pauseTesting = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const resetTesting = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTestResults([]);
    setCurrentQuestionIndex(0);
    setError(null);
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
          <h3 className="text-lg font-semibold text-app-text">Dataset Testing</h3>
        </div>
        <p className="text-sm text-app-text-subtle">
          Testing node: <code className="bg-gray-100 px-1 rounded">{nodeId}</code>
        </p>
      </div>

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
              {!isRunning ? (
                <button
                  onClick={startTesting}
                  disabled={!getApiKey()}
                  className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={16} />
                  <span>Start Test</span>
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
                ⚠️ No Gemini API key found in agent configuration. Please configure the agent first.
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
          <div className="flex-1 overflow-y-auto p-4">
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
                    
                    <div className="text-sm space-y-1">
                      <div className="text-green-700">
                        <strong>Expected:</strong> {result.expectedAnswer}
                      </div>
                      <div className="text-blue-700">
                        <strong>Gemini:</strong> {result.geminiResponse || 'No response'}
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
  );
};

export default DatasetTestingPanel;
