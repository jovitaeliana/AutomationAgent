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
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => handleSelect(dataset)}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(dataset);
                        }}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Select
                      </button>
                    </div>

                    {/* Optional: Show preview of questions if available */}
                    {dataset.questions && dataset.questions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                            Preview Questions ({dataset.questions.length})
                          </summary>
                          <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                            {dataset.questions.slice(0, 2).map((question: any, index: number) => (
                              <div key={index} className="text-xs text-gray-600 pl-4">
                                <span className="font-medium">{index + 1}.</span> {question.question}
                              </div>
                            ))}
                            {dataset.questions.length > 2 && (
                              <div className="text-xs text-gray-500 pl-4">
                                ... and {dataset.questions.length - 2} more questions
                              </div>
                            )}
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