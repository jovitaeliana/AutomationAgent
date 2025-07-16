import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import FlowSidebar, { ItemTypes } from '../components/FlowSidebar';
import type { FlowNodeData } from '../components/FlowNode';
import ConfigurationPanel from '../components/ConfigurationPanel';
import Connector from '../components/Connector';
import type { NodeCategory } from '../components/FlowSidebar';
import FlowNode from '../components/FlowNode';

const AgentCreationPage: React.FC = () => {
  const [nodes, setNodes] = useState<FlowNodeData[]>([]);
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [availableNodes, setAvailableNodes] = useState<NodeCategory[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configuringNodeId, setConfiguringNodeId] = useState<string | null>(null);
  const [linkingNodeId, setLinkingNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch initial data from the mock backend
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
        // Set initial connections based on fetched nodes
        setConnections([['node-trigger', 'node-llm'], ['node-llm', 'node-weather'], ['node-llm', 'node-email']]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Use useCallback to memoize the moveNode function for performance
  const moveNode = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, position } : node))
    );
  }, []);

  // Set up the canvas as a drop target
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.NODE, 'canvas-node'],
    drop: (item: any, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const offset = monitor.getClientOffset();
      if (!canvasRef.current || !offset || !delta) return;

      if (monitor.getItemType() === 'canvas-node') {
        const left = Math.round(item.x + delta.x);
        const top = Math.round(item.y + delta.y);
        moveNode(item.id, { x: left, y: top });
      } else {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const newNode: FlowNodeData = {
          id: `node-${Date.now()}`,
          title: `${item.icon} ${item.title}`,
          type: item.description,
          position: { x: offset.x - canvasRect.left, y: offset.y - canvasRect.top },
        };
        setNodes(prev => [...prev, newNode]);
      }
    },
  }), [moveNode]);

  drop(canvasRef);

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c[0] !== nodeId && c[1] !== nodeId));
  };

  const handlePortMouseDown = (e: React.MouseEvent, fromNode: string) => {
    e.stopPropagation();
    setLinkingNodeId(fromNode);
  };

  const handlePortMouseUp = (e: React.MouseEvent, toNode: string) => {
    e.stopPropagation();
    if (linkingNodeId && linkingNodeId !== toNode) {
      setConnections(prev => [...prev, [linkingNodeId, toNode]]);
    }
    setLinkingNodeId(null);
  };
  
  const getPortPosition = (nodeId: string, side: 'left' | 'right') => {
    const nodeEl = document.getElementById(nodeId);
    if (!nodeEl) return { x: 0, y: 0 };
    const y = nodeEl.offsetTop + nodeEl.offsetHeight / 2;
    const x = side === 'left' ? nodeEl.offsetLeft : nodeEl.offsetLeft + nodeEl.offsetWidth;
    return { x, y };
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-app-bg-highlight to-app-bg-content">
      <FlowSidebar nodes={availableNodes} isLoading={isLoading} error={error} />
      <div className="flex-1 flex flex-col">
        <header className="bg-app-bg-content border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-app-text">Flow Builder</h1>
          <button className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover">Create Flow</button>
        </header>
        <main className="flex-1 flex overflow-hidden">
          <div ref={canvasRef} className="flex-1 relative bg-gray-50 overflow-auto" onClick={() => setSelectedNodeId(null)}>
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {connections.map(([startId, endId]) => <Connector key={`${startId}-${endId}`} from={getPortPosition(startId, 'right')} to={getPortPosition(endId, 'left')} />)}
            </svg>
            {nodes.map(node => (
              <FlowNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={(e: React.MouseEvent, id: string) => { e.stopPropagation(); setSelectedNodeId(id); }}
                onMove={(nodeId: string, position: { x: number; y: number }) => moveNode(nodeId, position)}
                onDelete={deleteNode}
                onConfigure={setConfiguringNodeId}
                onPortMouseDown={handlePortMouseDown}
                onPortMouseUp={handlePortMouseUp}
              />
            ))}
          </div>
          <ConfigurationPanel
            selectedNode={nodes.find(n => n.id === configuringNodeId) || null}
            nodeConfig={{}} // Placeholder for node configuration
            onConfigChange={(newConfig) => console.log(newConfig)} // Placeholder for config change handler
            onClose={() => setConfiguringNodeId(null)}
            onSave={() => console.log('Save configuration')} // Placeholder for save handler
          />
        </main>
      </div>
    </div>
  );
};

export default AgentCreationPage;