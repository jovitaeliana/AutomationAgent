import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  type: string;
  description: string;
  createdAt: string;
  totalQuestions: number;
}

interface DatasetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (dataset: Dataset) => void;
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
      const response = await fetch('http://localhost:3002/datasets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch datasets');
      }
      
      const data = await response.json();
      setDatasets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (dataset: Dataset) => {
    onSelect(dataset);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                          <span>{dataset.totalQuestions} questions</span>
                          <span>{new Date(dataset.createdAt).toLocaleDateString()}</span>
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