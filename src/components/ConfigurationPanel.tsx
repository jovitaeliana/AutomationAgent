import React from 'react';
import type { FlowNodeData } from './FlowNode';
import { LLMConfigForm, WeatherAPIConfigForm } from './NodeConfigs';

interface ConfigurationPanelProps {
  selectedNode: FlowNodeData | null;
  nodeConfig: any; // The fetched configuration data
  onConfigChange: (newConfig: any) => void;
  onClose: () => void;
  onSave: () => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ selectedNode, nodeConfig, onConfigChange, onClose, onSave }) => {
  if (!selectedNode || !nodeConfig) return null;

  const renderConfigForm = () => {
    if (selectedNode.title.includes('LLM')) {
      return <LLMConfigForm config={nodeConfig} onConfigChange={onConfigChange} />;
    }
    if (selectedNode.title.includes('Weather')) {
      return <WeatherAPIConfigForm config={nodeConfig} onConfigChange={onConfigChange} />;
    }
    return <p>No specific configuration available for this node type.</p>;
  };

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
      <button onClick={onSave} className="w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-primary-hover">
        Save Configuration
      </button>
    </aside>
  );
};
export default ConfigurationPanel;