import React, { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import FlowSidebar, { ItemTypes } from '../components/FlowSidebar';
import type { NodeCategory, NodeItem } from '../components/FlowSidebar';
import FlowNode from '../components/FlowNode';
import type { FlowNodeData } from '../components/FlowNode';
import ConfigurationPanel from '../components/ConfigurationPanel';
import Connector from '../components/Connector';

const AgentCreationPage: React.FC = () => {
  const [nodes, setNodes] = useState<FlowNodeData[]>([]);
  const [connections, setConnections] = useState<[string, string][]>([['node-trigger', 'node-llm'], ['node-llm', 'node-weather'], ['node-llm', 'node-email']]);
  const [availableNodes, setAvailableNodes] = useState<NodeCategory[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configuringNodeId, setConfiguringNodeId] = useState<string | null>(null);
  const [linkingNodeId, setLinkingNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, availableNodesRes] = await Promise.all([
          fetch('http://localhost:3001/initialFlowNodes'),
          fetch('http://localhost:3001/availableNodes'),
        ]);
        if (!nodesRes.ok || !availableNodesRes.ok) throw new Error('Failed to fetch flow data');
        setNodes(await nodesRes.json());
        setAvailableNodes(await availableNodesRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.NODE,
    drop: (item: NodeItem, monitor) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const canvasRect = canvas.getBoundingClientRect();
      const position = { x: offset.x - canvasRect.left, y: offset.y - canvasRect.top };
      const newNode: FlowNodeData = {
        id: `node-${Date.now()}`,
        title: `${item.icon} ${item.title}`,
        type: item.description,
        position,
      };
      setNodes(prev => [...prev, newNode]);
    },
  }));
  drop(canvasRef);

  const moveNode = (nodeId: string, position: { x: number; y: number }) => setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, position } : n)));
  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c[0] !== nodeId && c[1] !== nodeId));
  };

  const handleStartLinking = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setLinkingNodeId(nodeId);
  };
  const handleNodeSelect = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    if (linkingNodeId && linkingNodeId !== nodeId) {
      setConnections(prev => [...prev, [linkingNodeId, nodeId]]);
      setLinkingNodeId(null);
    }
  };

  const selectedNodeForConfig = nodes.find(n => n.id === configuringNodeId) || null;

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-app-bg-highlight to-app-bg-content">
      <FlowSidebar nodes={availableNodes} isLoading={isLoading} error={error} />
      <div className="flex-1 flex flex-col">
        <header className="bg-app-bg-content border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-app-text">Flow Builder</h1>
          <button className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover">Create Flow</button>
        </header>
        <main className="flex-1 flex overflow-hidden">
          <div ref={canvasRef} className="flex-1 relative bg-gray-50 overflow-auto" onClick={() => { setSelectedNodeId(null); setLinkingNodeId(null); }}>
            {nodes.map(node => (
              <FlowNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={handleNodeSelect}
                onMove={moveNode}
                onDelete={deleteNode}
                onStartLinking={handleStartLinking}
                onConfigure={setConfiguringNodeId}
              />
            ))}
            {/* The connectors need to be rendered inside the canvas */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {connections.map(([startId, endId]) => {
                const startNode = nodes.find(n => n.id === startId);
                const endNode = nodes.find(n => n.id === endId);
                if (!startNode || !endNode) return null;
                const from = { x: startNode.position.x + 192, y: startNode.position.y + 40 }; // Approx right middle
                const to = { x: endNode.position.x, y: endNode.position.y + 40 }; // Approx left middle
                return <Connector key={`${startId}-${endId}`} from={from} to={to} />;
              })}
            </svg>
          </div>
          <ConfigurationPanel selectedNode={selectedNodeForConfig} onClose={() => setConfiguringNodeId(null)} />
        </main>
      </div>
    </div>
  );
};

export default AgentCreationPage;