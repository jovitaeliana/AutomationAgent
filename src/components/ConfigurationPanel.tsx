import React from 'react';
import type { FlowNodeData } from './FlowNode';

interface ConfigurationPanelProps {
  selectedNode: FlowNodeData | null;
  onClose: () => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ selectedNode, onClose }) => {
  if (!selectedNode) return null;
  return (
    <aside className="w-96 flex-shrink-0 bg-app-bg-content border-l border-app-border flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-app-text">Configure Node</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <h3 className="font-semibold">{selectedNode.title}</h3>
        <p className="text-sm text-app-text-subtle mb-4">{selectedNode.type}</p>
        <p>Configuration options for this node will appear here.</p>
      </div>
    </aside>
  );
};
export default ConfigurationPanel;