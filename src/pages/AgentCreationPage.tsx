import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import FlowSidebar, { ItemTypes } from '../components/FlowSidebar';
import type { FlowNodeData } from '../components/FlowNode';
import ConfigurationPanel from '../components/ConfigurationPanel';
import Connector from '../components/Connector';
import type { NodeCategory } from '../components/FlowSidebar';
import FlowNode from '../components/FlowNode';
import { BackButtonIcon } from '../components/Icons';
import DatasetSelectionModal from '../components/DatasetSelectionModal';
import { flowService, availableNodesService } from '../services/api';
import type { Dataset } from '../lib/supabase';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation';

interface AgentCreationPageProps {
  onNavigate: (page: PageName) => void;
}

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;
  return function executedFunction(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
};

const AgentCreationPage: React.FC<AgentCreationPageProps> = ({ onNavigate }) => {
  const [nodes, setNodes] = useState<FlowNodeData[]>([]);
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [availableNodes, setAvailableNodes] = useState<NodeCategory[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configuringNodeId, setConfiguringNodeId] = useState<string | null>(null);
  const [linkingNodeId, setLinkingNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Dataset selection modal state
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [pendingNodeData, setPendingNodeData] = useState<any>(null);
  const [nodeDatasets, setNodeDatasets] = useState<{[nodeId: string]: Dataset}>({});

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Create a debounced save function for positions
  const debouncedSavePosition = useCallback(
    debounce(async (nodeId: string, position: { x: number; y: number }) => {
      try {
        await flowService.updatePosition(nodeId, position);
        console.log('Node position saved to Supabase');
      } catch (error) {
        console.error('Error saving node position:', error);
      }
    }, 500),
    []
  );

  // Fetch initial data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load available nodes for sidebar
        const availableNodesData = await availableNodesService.getAll();
        // Transform the data structure to match your existing format
        const transformedNodes = availableNodesData.map(node => ({
          category: node.category,
          items: node.items
        }));
        setAvailableNodes(transformedNodes);
        
        // Try to load saved flow
        const savedFlow = await flowService.getCurrent();
        setNodes(savedFlow.nodes);
        setConnections(savedFlow.connections);
        setNodeDatasets(savedFlow.nodeDatasets);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Create node function using Supabase
  const createNode = async (newNode: FlowNodeData, dataset?: Dataset) => {
    try {
      await flowService.addNode(newNode, dataset);
      console.log('Node saved to Supabase');
    } catch (error) {
      console.error('Error saving node:', error);
    }
  };

  // Optimized moveNode function with position saving
  const moveNode = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, position } : node))
    );
    
    // Save position to backend with debouncing
    debouncedSavePosition(nodeId, position);
  }, [debouncedSavePosition]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newZoom = Math.min(Math.max(0.1, zoom + delta), 3);
      setZoom(newZoom);
    }
  }, [zoom]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse button or Alt + left click
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  // Handle mouse up for panning
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset zoom and pan
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Zoom to fit all nodes
  const zoomToFit = useCallback(() => {
    if (nodes.length === 0) return;
    
    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 200); // Assume node width ~200px
      maxY = Math.max(maxY, node.position.y + 100); // Assume node height ~100px
    });
    
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const padding = 50;
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const canvasWidth = canvas.clientWidth - padding * 2;
      const canvasHeight = canvas.clientHeight - padding * 2;
      
      const scaleX = canvasWidth / contentWidth;
      const scaleY = canvasHeight / contentHeight;
      const newZoom = Math.min(scaleX, scaleY, 1);
      
      setZoom(newZoom);
      
      // Center the content
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const canvasCenterX = canvas.clientWidth / 2;
      const canvasCenterY = canvas.clientHeight / 2;
      
      setPan({
        x: canvasCenterX - centerX * newZoom,
        y: canvasCenterY - centerY * newZoom
      });
    }
  }, [nodes]);

  // Updated drop handler using Supabase
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
        // Adjust position for zoom and pan
        const position = { 
          x: (offset.x - canvasRect.left - pan.x) / zoom, 
          y: (offset.y - canvasRect.top - pan.y) / zoom 
        };
        
        // Check if this is a Document Q&A node
        if (item.title.toLowerCase().includes('document q&a') || item.title.toLowerCase().includes('qa')) {
          // Store pending node data and open dataset selection modal
          setPendingNodeData({
            item,
            position
          });
          setIsDatasetModalOpen(true);
        } else {
          // Create node directly for other types
          const newNode: FlowNodeData = {
            id: `node-${Date.now()}`,
            title: `${item.icon} ${item.title}`,
            type: item.description,
            position,
          };
          
          // Save to Supabase using the service
          createNode(newNode);
          setNodes(prev => [...prev, newNode]);
        }
      }
    },
  }), [moveNode, zoom, pan]);

  // Handle dataset selection using Supabase
  const handleDatasetSelect = async (dataset: Dataset) => {
    if (pendingNodeData) {
      const nodeId = `node-${Date.now()}`;
      const newNode: FlowNodeData = {
        id: nodeId,
        title: `${pendingNodeData.item.icon} ${pendingNodeData.item.title}`,
        type: pendingNodeData.item.description,
        position: pendingNodeData.position,
      };
      
      // Save to Supabase using the service
      await createNode(newNode, dataset);
      
      // Update local state
      setNodes(prev => [...prev, newNode]);
      setNodeDatasets(prev => ({ ...prev, [nodeId]: dataset }));
      setPendingNodeData(null);
    }
  };

  drop(canvasRef);

  // Delete node using Supabase
  const deleteNode = async (nodeId: string) => {
    try {
      await flowService.deleteNode(nodeId);
      console.log('Node deleted from Supabase');
    } catch (error) {
      console.error('Error deleting node:', error);
    }
    
    // Update local state
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c[0] !== nodeId && c[1] !== nodeId));
    setNodeDatasets(prev => {
      const newDatasets = { ...prev };
      delete newDatasets[nodeId];
      return newDatasets;
    });
  };

  const handlePortMouseDown = useCallback((e: React.MouseEvent, fromNode: string) => {
    e.stopPropagation();
    setLinkingNodeId(fromNode);
  }, []);

  // Handle connections using Supabase
  const handlePortMouseUp = useCallback(async (e: React.MouseEvent, toNode: string) => {
    e.stopPropagation();
    if (linkingNodeId && linkingNodeId !== toNode) {
      const newConnection: [string, string] = [linkingNodeId, toNode];
      const newConnections: [string, string][] = [...connections, newConnection];
      setConnections(newConnections);
      
      // Save connections to Supabase
      try {
        await flowService.updateConnections(newConnections);
        console.log('Connections saved to Supabase');
      } catch (error) {
        console.error('Error saving connections:', error);
      }
    }
    setLinkingNodeId(null);
  }, [linkingNodeId, connections]);

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-app-bg-highlight to-app-bg-content">
      <FlowSidebar nodes={availableNodes} isLoading={isLoading} error={error} />
      <div className="flex-1 flex flex-col">
        <header className="bg-app-bg-content border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-app-text">Flow Builder</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-app-text-subtle">
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <button
                onClick={resetView}
                className="px-2 py-1 bg-app-bg-highlight rounded hover:bg-app-border transition-colors"
                title="Reset View (1:1)"
              >
                Reset
              </button>
              <button
                onClick={zoomToFit}
                className="px-2 py-1 bg-app-bg-highlight rounded hover:bg-app-border transition-colors"
                title="Fit to Screen"
              >
                Fit
              </button>
            </div>
            <button 
              onClick={() => onNavigate('home')} 
              className="text-app-text-subtle hover:opacity-80"
            >
              <BackButtonIcon />
            </button>
            <button className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover">Create Flow</button>
          </div>
        </header>
        <main className="flex-1 flex overflow-hidden">
          <div 
            ref={canvasRef} 
            className="flex-1 relative overflow-hidden select-none" 
            style={{
              backgroundImage: `radial-gradient(circle, rgba(0, 0, 0, 0.2) 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              backgroundColor: '#f8fafc',
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedNodeId(null)}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                width: '100%',
                height: '100%',
                position: 'relative'
              }}
            >
              <svg 
                className="absolute top-0 left-0 pointer-events-none" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  overflow: 'visible'
                }}
              >
                {connections.map(([startId, endId]) => {
                  const startNode = nodes.find(n => n.id === startId);
                  const endNode = nodes.find(n => n.id === endId);
                  
                  if (!startNode || !endNode) return null;
                  
                  // Get actual node elements to measure their height
                  const startNodeEl = document.getElementById(startId);
                  const endNodeEl = document.getElementById(endId);
                  
                  if (!startNodeEl || !endNodeEl) return null;
                  
                  const startNodeHeight = startNodeEl.offsetHeight;
                  const endNodeHeight = endNodeEl.offsetHeight;
                  const nodeWidth = 192; // w-48 = 192px
                  
                  // Calculate port positions at the vertical center of each node
                  const from = {
                    x: startNode.position.x + nodeWidth, // Right edge
                    y: startNode.position.y + startNodeHeight / 2 // Vertical center
                  };
                  
                  const to = {
                    x: endNode.position.x, // Left edge
                    y: endNode.position.y + endNodeHeight / 2 // Vertical center
                  };
                  
                  return (
                    <Connector 
                      key={`${startId}-${endId}`} 
                      from={from} 
                      to={to}
                    />
                  );
                })}
              </svg>
              
              {nodes.map(node => (
                <FlowNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={(e: React.MouseEvent, id: string) => { 
                    e.stopPropagation(); 
                    setSelectedNodeId(id); 
                  }}
                  onMove={moveNode}
                  onDelete={deleteNode}
                  onConfigure={setConfiguringNodeId}
                  onPortMouseDown={handlePortMouseDown}
                  onPortMouseUp={handlePortMouseUp}
                />
              ))}
            </div>
            
            {/* Zoom/Pan Instructions */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs px-3 py-2 rounded-lg">
              <div>Ctrl/Cmd + Scroll: Zoom</div>
              <div>Alt + Drag or Middle Click: Pan</div>
            </div>
          </div>
          <ConfigurationPanel
            selectedNode={nodes.find(n => n.id === configuringNodeId) || null}
            nodeConfig={configuringNodeId ? nodeDatasets[configuringNodeId] : null}
            onConfigChange={(newConfig) => {
              if (configuringNodeId && newConfig) {
                setNodeDatasets(prev => ({ ...prev, [configuringNodeId]: newConfig }));
              }
            }}
            onClose={() => setConfiguringNodeId(null)}
            onSave={() => {
              if (configuringNodeId) {
                console.log('Configuration saved for node:', configuringNodeId);
                console.log('Dataset:', nodeDatasets[configuringNodeId]);
                
                // Optional: Show success message
                alert('Configuration saved successfully!');
                
                // Optional: Auto-close the panel after saving
                setConfiguringNodeId(null);
              }
            }}
          />
        </main>
      </div>
      
      {/* Dataset Selection Modal */}
      <DatasetSelectionModal
        isOpen={isDatasetModalOpen}
        onClose={() => {
          setIsDatasetModalOpen(false);
          setPendingNodeData(null);
        }}
        onSelect={handleDatasetSelect}
      />
    </div>
  );
};

export default AgentCreationPage;