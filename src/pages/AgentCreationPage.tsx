import React, { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import FlowSidebar, { ItemTypes } from '../components/FlowSidebar';
import type { NodeItem, NodeCategory } from '../components/FlowSidebar';
import type { FlowNodeData } from '../components/FlowNode';
import FlowNode from '../components/FlowNode';
import ConfigurationPanel from '../components/ConfigurationPanel';

const Connector: React.FC<{ from: { x: number, y: number }, to: { x: number, y: number } }> = ({ from, to }) => (
  <path d={`M ${from.x} ${from.y} C ${from.x + 60} ${from.y}, ${to.x - 60} ${to.y}, ${to.x} ${to.y}`} stroke="#CBD5E1" strokeWidth="2" fill="none" />
);

const AgentCreationPage: React.FC = () => {
  const [nodes, setNodes] = useState<FlowNodeData[]>([]);
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [availableNodes, setAvailableNodes] = useState<NodeCategory[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configuringNodeId, setConfiguringNodeId] = useState<string | null>(null);
  const [linkingState, setLinkingState] = useState<{ fromNode: string; toMouse: {x: number, y: number} } | null>(null);
  
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
      const offset = monitor.getClientOffset();
      if (!canvasRef.current || !offset) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newNode: FlowNodeData = {
        id: `node-${Date.now()}`,
        title: `${item.icon} ${item.title}`,
        type: item.description,
        position: { x: offset.x - canvasRect.left, y: offset.y - canvasRect.top },
      };
      setNodes(prev => [...prev, newNode]);
    },
  }));
  drop(canvasRef);

  const moveNode = (nodeId: string, position: { x: number, y: number }) => setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, position } : n)));
  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c[0] !== nodeId && c[1] !== nodeId));
  };

  const handlePortMouseDown = (e: React.MouseEvent, fromNode: string) => {
    e.stopPropagation();
    setLinkingState({ fromNode, toMouse: { x: e.clientX, y: e.clientY } });

    const handleMouseMove = (moveEvent: MouseEvent) => setLinkingState(prev => prev ? { ...prev, toMouse: { x: moveEvent.clientX, y: moveEvent.clientY } } : null);
    const handleMouseUp = () => {
      setLinkingState(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handlePortMouseUp = (e: React.MouseEvent, toNode: string) => {
    e.stopPropagation();
    if (linkingState && linkingState.fromNode !== toNode) {
      setConnections(prev => [...prev, [linkingState.fromNode, toNode]]);
    }
    setLinkingState(null);
  };
  
  const getPortPosition = (nodeId: string) => {
    const nodeEl = document.getElementById(nodeId);
    if (!nodeEl) return { x: 0, y: 0 };
    return { x: nodeEl.offsetLeft + nodeEl.offsetWidth / 2, y: nodeEl.offsetTop + 40 };
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
              {connections.map(([startId, endId]) => <Connector key={`${startId}-${endId}`} from={getPortPosition(startId)} to={getPortPosition(endId)} />)}
              {linkingState && <Connector from={getPortPosition(linkingState.fromNode)} to={{x: linkingState.toMouse.x - canvasRef.current!.getBoundingClientRect().left, y: linkingState.toMouse.y - canvasRef.current!.getBoundingClientRect().top}} />}
            </svg>
            {nodes.map(node => (
              <FlowNode key={node.id} node={node} isSelected={selectedNodeId === node.id}
                onSelect={(e, id) => { e.stopPropagation(); setSelectedNodeId(id); }}
                onMove={moveNode}
                onDelete={deleteNode}
                onConfigure={setConfiguringNodeId}
                onPortMouseDown={handlePortMouseDown}
                onPortMouseUp={handlePortMouseUp}
              />
            ))}
          </div>
          <ConfigurationPanel selectedNode={nodes.find(n => n.id === configuringNodeId) || null} onClose={() => setConfiguringNodeId(null)} />
        </main>
      </div>
    </div>
  );
};

export default AgentCreationPage;