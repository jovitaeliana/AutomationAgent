import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { datasetService } from '../services/api';
import type { Dataset } from '../lib/supabase';

interface DatasetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (dataset: Dataset) => Promise<void>; // Changed to async to match AgentCreationPage
}

const DatasetSelectionModal: React.FC<DatasetSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDatasets();
    }
  }, [isOpen]);

  const fetchDatasets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use Supabase service instead of direct fetch
      const data = await datasetService.getAll();
      setDatasets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (dataset: Dataset) => {
    try {
      await onSelect(dataset);
      onClose();
    } catch (error) {
      console.error('Error selecting dataset:', error);
      setError('Failed to select dataset');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Select Dataset</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading datasets...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500">Error: {error}</div>
              <button
                onClick={fetchDatasets}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No datasets found</div>
              <p className="text-sm text-gray-400">
                Create a dataset first in the Upload Dataset page
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {datasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{dataset.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {dataset.description || 'No description provided'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {dataset.type.toUpperCase()}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {dataset.total_questions} questions
                          </span>
                          <span>{new Date(dataset.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelect(dataset)}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors font-medium"
                      >
                        Select
                      </button>
                    </div>

                    {/* Show preview of questions if available */}
                    {dataset.questions && dataset.questions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                            Preview All Questions ({dataset.questions.length})
                          </summary>
                          <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                            <div className="p-3 space-y-3">
                              {dataset.questions.map((question: any, index: number) => (
                                <div key={index} className="bg-white rounded-lg p-3 border border-gray-100">
                                  <p className="font-medium text-sm text-gray-900 mb-2">
                                    {index + 1}. {question.question}
                                  </p>
                                  
                                  {/* Show options if it's MCQ */}
                                  {question.options && question.options.length > 0 && (
                                    <div className="ml-4 space-y-1">
                                      {question.options.map((option: string, optIndex: number) => (
                                        <div 
                                          key={optIndex} 
                                          className={`text-xs flex items-center ${
                                            option === question.correctAnswer 
                                              ? 'text-green-700 font-semibold' 
                                              : 'text-gray-600'
                                          }`}
                                        >
                                          <span className="inline-block w-6 text-center font-medium">
                                            {String.fromCharCode(65 + optIndex)}.
                                          </span>
                                          <span className={`flex-1 ${
                                            option === question.correctAnswer 
                                              ? 'bg-green-100 px-2 py-1 rounded' 
                                              : ''
                                          }`}>
                                            {option}
                                            {option === question.correctAnswer && (
                                              <span className="ml-2 text-green-600">✓</span>
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Show explanation if available */}
                                  {question.explanation && (
                                    <div className="mt-2 ml-4 text-xs text-gray-500 italic bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                                      💡 <strong>Explanation:</strong> {question.explanation}
                                    </div>
                                  )}
                                  
                                  {/* Show answer for non-MCQ questions */}
                                  {!question.options && question.answer && (
                                    <div className="mt-2 ml-4 text-xs">
                                      <span className="font-medium text-green-700">Answer:</span>
                                      <span className="ml-1 text-gray-600">{question.answer}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatasetSelectionModal;