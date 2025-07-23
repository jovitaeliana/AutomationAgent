import React, { useState, useEffect } from 'react';
import type { FlowNodeData } from './FlowNode';
import { LLMConfigForm, WeatherAPIConfigForm } from './NodeConfigs';

interface Dataset {
  id: string;
  name: string;
  type: string;
  description: string;
  createdAt: string;
  totalQuestions: number;
  questions?: any[];
}

interface ConfigurationPanelProps {
  selectedNode: FlowNodeData | null;
  nodeConfig: any; // The fetched configuration data or dataset
  onConfigChange: (newConfig: any) => void;
  onClose: () => void;
  onSave: () => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ 
  selectedNode, 
  nodeConfig, 
  onConfigChange, 
  onClose, 
  onSave 
}) => {
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedNode && isDocumentQANode(selectedNode)) {
      fetchAvailableDatasets();
    }
  }, [selectedNode]);

  const isDocumentQANode = (node: FlowNodeData) => {
    return node.title.toLowerCase().includes('document q&a') || 
           node.title.toLowerCase().includes('qa') ||
           node.type.toLowerCase().includes('document');
  };

  const fetchAvailableDatasets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3002/datasets');
      if (!response.ok) {
        throw new Error('Failed to fetch datasets');
      }
      
      const datasets = await response.json();
      setAvailableDatasets(datasets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatasetChange = (datasetId: string) => {
    const selectedDataset = availableDatasets.find(d => d.id === datasetId);
    onConfigChange(selectedDataset || null);
  };

  const renderConfigForm = () => {
    if (!selectedNode) return null;
    
    if (selectedNode.title.includes('LLM')) {
      return <LLMConfigForm config={nodeConfig} onConfigChange={onConfigChange} />;
    }
    if (selectedNode.title.includes('Weather')) {
      return <WeatherAPIConfigForm config={nodeConfig} onConfigChange={onConfigChange} />;
    }
    if (isDocumentQANode(selectedNode)) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-app-text mb-2">
              Selected Dataset
            </label>
            
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading datasets...</div>
            ) : error ? (
              <div className="text-sm text-red-500">
                Error loading datasets: {error}
                <button 
                  onClick={fetchAvailableDatasets}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <select
                value={nodeConfig?.id || ''}
                onChange={(e) => handleDatasetChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a dataset...</option>
                {availableDatasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.totalQuestions} questions)
                  </option>
                ))}
              </select>
            )}
          </div>

          {nodeConfig && (
            <div className="bg-app-bg-highlight rounded-lg p-4">
              <h4 className="font-medium text-app-text mb-2">Dataset Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {nodeConfig.name}
                </div>
                <div>
                  <span className="font-medium">Type:</span> 
                  <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {nodeConfig.type.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Questions:</span> {nodeConfig.totalQuestions}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(nodeConfig.createdAt).toLocaleDateString()}
                </div>
                {nodeConfig.description && (
                  <div>
                    <span className="font-medium">Description:</span> {nodeConfig.description}
                  </div>
                )}
              </div>
            </div>
          )}

          {availableDatasets.length === 0 && !isLoading && !error && (
            <div className="text-center py-4 text-gray-500">
              <p>No datasets available.</p>
              <p className="text-sm mt-1">Create a dataset in the Upload Dataset page first.</p>
            </div>
          )}
        </div>
      );
    }
    return <p>No specific configuration available for this node type.</p>;
  };

  if (!selectedNode) return null;

  return (
    <aside className="w-96 flex-shrink-0 bg-app-bg-content border-l border-app-border flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-app-text">Configure Node</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
        <h3 className="font-semibold text-lg">{selectedNode.title}</h3>
        <p className="text-sm text-app-text-subtle mb-4 pb-4 border-b border-app-border">{selectedNode.type}</p>
        {renderConfigForm()}
      </div>
      <button 
        onClick={onSave} 
        className="w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-primary-hover"
      >
        Save Configuration
      </button>
    </aside>
  );
};

export default ConfigurationPanel;