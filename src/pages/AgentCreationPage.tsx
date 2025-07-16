import React, { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import FlowSidebar, { ItemTypes } from '../components/FlowSidebar';
import FlowNode from '../components/FlowNode';
import type { FlowNodeData } from '../components/FlowNode';
import ConfigurationPanel from '../components/ConfigurationPanel';

// Type definitions from our db.json
interface NodeItem { id: string; icon: string; title: string; description: string; }
interface NodeCategory { category: string; items: NodeItem[]; }

const AgentCreationPage: React.FC = () => {
  const [nodes, setNodes] = useState<FlowNodeData[]>([]);
  const [availableNodes, setAvailableNodes] = useState<NodeCategory[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configuringNodeId, setConfiguringNodeId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch nodes for the sidebar
  useEffect(() => {
    const fetchAvailableNodes = async () => {
      try {
        const response = await fetch('http://localhost:3001/availableNodes');
        if (!response.ok) throw new Error('Failed to fetch available nodes');
        setAvailableNodes(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAvailableNodes();
  }, []);

  // Logic to handle dropping a new node onto the canvas
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.NODE,
    drop: (item: NodeItem, monitor) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const delta = monitor.getClientOffset();
      if (!delta) return;
      const canvasRect = canvas.getBoundingClientRect();
      const position = { x: delta.x - canvasRect.left, y: delta.y - canvasRect.top };
      addNode(item, position);
    },
  }));
  drop(canvasRef);

  // Add a new node to the canvas
  const addNode = (item: NodeItem, position: { x: number; y: number }) => {
    const newNode: FlowNodeData = {
      id: `node-${Date.now()}`,
      title: `${item.icon} ${item.title}`,
      type: item.description,
      position,
    };
    setNodes(prev => [...prev, newNode]);
  };

  // Update a node's position after it has been moved
  const moveNode = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, position } : n)));
  };

  const selectedNode = nodes.find(n => n.id === configuringNodeId) || null;

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-app-bg-highlight to-app-bg-content">
      <FlowSidebar nodes={availableNodes} isLoading={isLoading} error={error} />

      <div className="flex-1 flex flex-col">
        <header className="bg-app-bg-content border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-app-text">Flow Builder</h1>
          <button className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover">Create Flow</button>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <div
            ref={canvasRef}
            className="flex-1 relative bg-gray-50 overflow-auto"
            onClick={() => setSelectedNodeId(null)}
          >
            {nodes.map(node => (
              <FlowNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={(e, nodeId) => { e.stopPropagation(); setSelectedNodeId(nodeId); }}
                onMove={moveNode}
                onConfigure={setConfiguringNodeId}
              />
            ))}
          </div>
          <ConfigurationPanel selectedNode={selectedNode} onClose={() => setConfiguringNodeId(null)} />
        </main>
      </div>
    </div>
  );
};

export default AgentCreationPage;