import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { HelpCircle } from 'lucide-react';
import FlowSidebar, { ItemTypes } from '../components/FlowSidebar';
import type { FlowNodeData } from '../components/FlowNode';
import ConfigurationPanel from '../components/ConfigurationPanel';
import Connector from '../components/Connector';
import type { NodeCategory } from '../components/FlowSidebar';
import FlowNode from '../components/FlowNode';
import { BackButtonIcon } from '../components/Icons';
import DatasetSelectionModal from '../components/DatasetSelectionModal';
import AgentSelectionModal from '../components/AgentSelectionModal';
import DatasetTestingPanel from '../components/DatasetTestingPanel';
import KnowledgeBaseUploadModal from '../components/KnowledgeBaseUploadModal';
import GeminiChatPanel from '../components/AgentChatPanel';
import GuidedTour, { type TourStep } from '../components/GuidedTour';
import { flowService, availableNodesService, nodeConfigService, knowledgeBaseService, agentKnowledgeBaseService } from '../services/api';
import type { Dataset, Agent } from '../lib/supabase';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'flow-creation' | 'deployment-status';

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
  
  // Loading states for operations
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  
  // Panel states - removed left panel states as FlowSidebar now handles its own collapse
  
  // Dataset selection modal state
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [pendingNodeData, setPendingNodeData] = useState<any>(null);
  const [nodeDatasets, setNodeDatasets] = useState<{[nodeId: string]: Dataset}>({});

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [pendingAgentNodeData, setPendingAgentNodeData] = useState<any>(null);
  const [nodeAgents, setNodeAgents] = useState<{[nodeId: string]: Agent}>({});
  const [allNodeConfigs, setAllNodeConfigs] = useState<{[nodeId: string]: any}>({});

  // Knowledge base modal state
  const [isKnowledgeBaseModalOpen, setIsKnowledgeBaseModalOpen] = useState(false);
  const [pendingKnowledgeBaseNodeData, setPendingKnowledgeBaseNodeData] = useState<any>(null);
  const [isKnowledgeBaseUploading, setIsKnowledgeBaseUploading] = useState(false);

  const [testingNodeId, setTestingNodeId] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<'dataset' | 'chat' | null>(null);

  // Drag line state for visual connection feedback
  const [dragLine, setDragLine] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [isTestPanelCollapsed, setIsTestPanelCollapsed] = useState(false);
  const [testPanelWidth, setTestPanelWidth] = useState(400);

  // Guided tour state
  const [showTour, setShowTour] = useState(false);

  const flowCreationTourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Flow Builder! 🔧',
      content: 'This tour will guide you through creating visual workflows by connecting different components together.',
      position: 'center'
    },
    {
      id: 'flow-components',
      title: 'Step 1: Flow Components Sidebar',
      content: 'This sidebar contains all available components you can drag into your flow. Components are organized into categories: Automations, RAG Models, and Triggers.',
      target: '[data-tour="flow-components"]',
      position: 'right'
    },
    {
      id: 'triggers-category',
      title: 'Triggers Category',
      content: 'Triggers are entry points for your flow. They define how your automation starts - like API webhooks, scheduled events, or manual triggers.',
      target: '[data-tour="triggers-category"]',
      position: 'right'
    },
    {
      id: 'rag-models-category',
      title: 'RAG Models Category',
      content: 'RAG (Retrieval-Augmented Generation) models help your agents answer questions using uploaded documents and knowledge bases.',
      target: '[data-tour="rag-models-category"]',
      position: 'right'
    },
    {
      id: 'agents-category',
      title: 'Agents Category',
      content: 'Agents are the core processing units that handle tasks like weather queries, web searches, or custom AI interactions.',
      target: '[data-tour="agents-category"]',
      position: 'right'
    },
    {
      id: 'canvas-area',
      title: 'Step 2: Canvas Area',
      content: 'This is your workspace where you build flows. Drag components from the sidebar here, connect them with lines, and configure each component.',
      target: '[data-tour="canvas-area"]',
      position: 'left'
    },
    {
      id: 'canvas-controls',
      title: 'Canvas Controls',
      content: 'Use these controls to navigate your flow: zoom in/out with Ctrl+scroll, pan with Alt+drag, reset view, or fit all nodes to screen.',
      target: '[data-tour="canvas-controls"]',
      position: 'bottom'
    },
    {
      id: 'drag-drop-instructions',
      title: 'Step 3: How to Build Flows',
      content: 'Drag components from the sidebar to the canvas. Click and drag from the connection ports (small circles) on nodes to create connections between them.',
      position: 'center'
    },
    {
      id: 'node-actions',
      title: 'Step 4: Node Actions',
      content: 'Each node has actions: Configure to set up the component, Test to try it out (for agents), and a delete button to remove it.',
      position: 'center'
    },
    {
      id: 'complete',
      title: 'You\'re Ready to Build! 🚀',
      content: 'Start by dragging a Trigger from the sidebar, then add agents and knowledge bases. Connect them together to create your automation flow.',
      position: 'center'
    }
  ];

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

  // Panel resize handlers removed - FlowSidebar now handles its own collapse

  // Fetch initial data from Supabase and restore all configurations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load available nodes for sidebar
        const availableNodesData = await availableNodesService.getAll();
        const transformedNodes = availableNodesData.map(node => ({
          category: node.category,
          items: node.items
        }));
        setAvailableNodes(transformedNodes);
        
        // Try to load saved flow
        const savedFlow = await flowService.getCurrent();
        setNodes(savedFlow.nodes);
        setConnections(savedFlow.connections);
        setNodeDatasets(savedFlow.nodeDatasets || {});
        
        // Load all node configurations from database
        const nodeConfigurations = await nodeConfigService.getAllConfigurations();
        console.log('📊 Loaded node configurations:', nodeConfigurations);
        setAllNodeConfigs(nodeConfigurations);
        
        // Separate agent configurations from other configs
        const agentConfigs: {[nodeId: string]: Agent} = {};
        Object.entries(nodeConfigurations).forEach(([nodeId, config]) => {
          if (config?.type === 'agent' && config?.agent) {
            agentConfigs[nodeId] = config.agent;
          }
        });
        setNodeAgents(agentConfigs);
        console.log('🤖 Restored agent configurations:', agentConfigs);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Create node function using Supabase with persistent configuration
  const createNode = async (newNode: FlowNodeData, dataset?: Dataset, initialConfig?: any) => {
    try {
      await flowService.addNode(newNode, dataset);
      
      if (initialConfig) {
        // Save configuration to database
        await nodeConfigService.saveConfiguration(
          newNode.id, 
          initialConfig, 
          newNode.type
        );
        
        // Update local state
        setAllNodeConfigs(prev => ({ ...prev, [newNode.id]: initialConfig }));
        
        // If it's an agent configuration, also update nodeAgents
        if (initialConfig.type === 'agent' && initialConfig.agent) {
          setNodeAgents(prev => ({ ...prev, [newNode.id]: initialConfig.agent }));
        }
        
        console.log('✅ Node configuration saved:', { nodeId: newNode.id, config: initialConfig });
      }
      
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

  // Handle mouse move for panning and drag line
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

    // Update drag line position when dragging a connection
    if (isDraggingConnection && dragLine && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setDragLine(prev => prev ? {
        ...prev,
        to: { x: (e.clientX - canvasRect.left - pan.x) / zoom, y: (e.clientY - canvasRect.top - pan.y) / zoom }
      } : null);
    }
  }, [isPanning, lastPanPoint, isDraggingConnection, dragLine]);

  // Handle mouse up for panning and drag line
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    // Clear drag line if mouse up happens outside a port
    if (isDraggingConnection) {
      setIsDraggingConnection(false);
      setDragLine(null);
      setLinkingNodeId(null);
    }
  }, [isDraggingConnection]);

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
        
        // Check if this is a Knowledge Base node
        if (item.title.toLowerCase().includes('knowledge base') || item.id === 'knowledge-base') {
          setPendingKnowledgeBaseNodeData({
            item,
            position
          });
          setIsKnowledgeBaseModalOpen(true);
        }
        // Check if this is a Document Q&A node
        else if (item.title.toLowerCase().includes('document q&a') || item.title.toLowerCase().includes('qa')) {
          setPendingNodeData({
            item,
            position
          });
          setIsDatasetModalOpen(true);
        }
        // Check if this is a Saved Agent node
        else if (item.title.toLowerCase().includes('saved agent') || item.id === 'agent-saved') {
          setPendingAgentNodeData({
            item,
            position
          });
          setIsAgentModalOpen(true);
        }
        else {
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

  // Enhanced handleAgentSelect with persistent configuration
  const handleAgentSelect = async (agent: Agent) => {
    if (pendingAgentNodeData) {
      const nodeId = `node-${Date.now()}`;
      const newNode: FlowNodeData = {
        id: nodeId,
        title: `🤖 ${agent.name}`,
        type: `Agent type: ${agent.configuration?.preset || 'Custom'}`,
        position: pendingAgentNodeData.position,
      };
      
      // Create comprehensive agent configuration
      const agentConfig = {
        type: 'agent',
        agent: agent,
        configuration: agent.configuration,
        name: agent.name,
        createdAt: new Date().toISOString()
      };
      
      // Save to Supabase with configuration
      await createNode(newNode, undefined, agentConfig);
      
      // Update local state
      setNodes(prev => [...prev, newNode]);
      setNodeAgents(prev => ({ ...prev, [nodeId]: agent }));
      setPendingAgentNodeData(null);
      
      console.log('✅ Agent node created with persistent configuration:', {
        nodeId,
        agentName: agent.name,
        configuration: agent.configuration
      });
    }
  };

  // Handle knowledge base document upload
  const handleKnowledgeBaseUpload = async (data: {
    type: 'file' | 'url';
    file?: File;
    url?: string;
    name: string;
    description?: string;
  }) => {
    if (pendingKnowledgeBaseNodeData) {
      setIsKnowledgeBaseUploading(true);

      try {
        // Create the node first
        const nodeId = `node-${Date.now()}`;
        const newNode: FlowNodeData = {
          id: nodeId,
          title: `${pendingKnowledgeBaseNodeData.item.icon} ${pendingKnowledgeBaseNodeData.item.title}`,
          type: pendingKnowledgeBaseNodeData.item.description,
          position: pendingKnowledgeBaseNodeData.position,
        };

        let content = '';
        let documentData: any = {
          name: data.name,
          description: data.description,
          source_type: data.type,
          content: '',
          metadata: { nodeId }
        };

        if (data.type === 'file' && data.file) {
          // Read file content
          content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(data.file!);
          });

          documentData = {
            ...documentData,
            file_name: data.file.name,
            file_type: data.file.type || 'text/plain',
            file_size: data.file.size,
            content
          };
        } else if (data.type === 'url' && data.url) {
          documentData = {
            ...documentData,
            source_url: data.url,
            content: data.url // Store URL as content for now
          };
        }

        // Save knowledge base document
        await knowledgeBaseService.create(documentData);

        // Save node to database
        await createNode(newNode);

        // Update local state
        setNodes(prev => [...prev, newNode]);
        setPendingKnowledgeBaseNodeData(null);
        setIsKnowledgeBaseModalOpen(false);

        console.log('Knowledge base document uploaded and node created');
      } catch (error) {
        console.error('Error uploading knowledge base document:', error);
        alert('Failed to upload knowledge base document. Please try again.');
      } finally {
        setIsKnowledgeBaseUploading(false);
      }
    }
  };

  // Handle knowledge base existing source selection
  const handleKnowledgeBaseSelect = async (source: any) => {
    if (pendingKnowledgeBaseNodeData) {
      try {
        // Create the node
        const nodeId = `node-${Date.now()}`;
        const newNode: FlowNodeData = {
          id: nodeId,
          title: `${pendingKnowledgeBaseNodeData.item.icon} ${pendingKnowledgeBaseNodeData.item.title}`,
          type: pendingKnowledgeBaseNodeData.item.description,
          position: pendingKnowledgeBaseNodeData.position,
        };

        // Update the existing source to include this nodeId in metadata
        const updatedMetadata = {
          ...(source.metadata || {}),
          nodeId
        };

        await knowledgeBaseService.update(source.id, {
          metadata: updatedMetadata
        });

        // Save node to database
        await createNode(newNode);

        // Update local state
        setNodes(prev => [...prev, newNode]);
        setPendingKnowledgeBaseNodeData(null);
        setIsKnowledgeBaseModalOpen(false);

        console.log('Knowledge base source connected to node');
      } catch (error) {
        console.error('Error connecting knowledge base source:', error);
        alert('Failed to connect knowledge base source. Please try again.');
      }
    }
  };

  // Enhanced delete node with loading indication
  const deleteNode = async (nodeId: string) => {
    // Start loading state
    setDeletingNodeId(nodeId);
    
    try {
      // Check if this is a knowledge base node and clean up node references
      const nodeToDelete = nodes.find(n => n.id === nodeId);
      if (nodeToDelete?.title.includes('🧠')) {
        // Find knowledge bases associated with this node and remove the node reference
        try {
          const allKnowledgeBases = await knowledgeBaseService.getAll();
          const associatedKBs = allKnowledgeBases.filter(kb =>
            kb.metadata &&
            typeof kb.metadata === 'object' &&
            kb.metadata.nodeId === nodeId
          );

          // Remove nodeId from metadata instead of deleting the entire knowledge base
          for (const kb of associatedKBs) {
            const updatedMetadata = { ...kb.metadata };
            delete updatedMetadata.nodeId;

            await knowledgeBaseService.update(kb.id, {
              metadata: updatedMetadata
            });
          }

          console.log(`Removed node reference from ${associatedKBs.length} knowledge bases (documents preserved)`);
        } catch (error) {
          console.error('Error cleaning up knowledge base node references:', error);
        }
      }

      // Perform deletion operations
      await flowService.deleteNode(nodeId);
      await nodeConfigService.deleteByNodeId(nodeId);

      console.log('Node and configuration deleted from Supabase');
      
      // Update local state after successful deletion
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setConnections(prev => prev.filter(c => c[0] !== nodeId && c[1] !== nodeId));
      setNodeDatasets(prev => {
        const newDatasets = { ...prev };
        delete newDatasets[nodeId];
        return newDatasets;
      });
      setNodeAgents(prev => {
        const newAgents = { ...prev };
        delete newAgents[nodeId];
        return newAgents;
      });
      setAllNodeConfigs(prev => {
        const newConfigs = { ...prev };
        delete newConfigs[nodeId];
        return newConfigs;
      });
      
    } catch (error) {
      console.error('Error deleting node:', error);
      // Optionally show an error message to the user
      alert('Error deleting node. Please try again.');
    } finally {
      // Clear loading state
      setDeletingNodeId(null);
    }
  };

  const handlePortMouseDown = useCallback((e: React.MouseEvent, fromNode: string) => {
    e.stopPropagation();
    setLinkingNodeId(fromNode);
    setIsDraggingConnection(true);

    // Get the starting position for the drag line
    const fromNodeElement = nodes.find(n => n.id === fromNode);
    if (fromNodeElement && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const nodeWidth = 192; // w-48 = 192px
      const portOffset = 6; // ConnectionPort is 12px wide (w-3 h-3), translated 50% right = 6px
      
      // Get actual node height dynamically
      const nodeElement = document.getElementById(fromNode);
      const nodeHeight = nodeElement ? nodeElement.offsetHeight : 80; // fallback to estimated height
      
      // Coordinates should be in canvas space (not screen space) since the drag line is inside the transformed SVG
      const startX = fromNodeElement.position.x + nodeWidth + portOffset;
      const startY = fromNodeElement.position.y + nodeHeight / 2;

      setDragLine({
        from: { x: startX, y: startY },
        to: { x: (e.clientX - canvasRect.left - pan.x) / zoom, y: (e.clientY - canvasRect.top - pan.y) / zoom }
      });
    }
  }, [nodes, zoom, pan]);

  // Handle connections using Supabase
  const handlePortMouseUp = useCallback(async (e: React.MouseEvent, toNode: string) => {
    e.stopPropagation();
    
    // Clear drag state immediately
    setLinkingNodeId(null);
    setIsDraggingConnection(false);
    setDragLine(null);
    
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
  }, [linkingNodeId, connections]);

  // Enhanced configuration change handler with persistence
  const handleConfigChange = async (newConfig: any) => {
    if (configuringNodeId && newConfig) {
      try {
        // Get existing configuration to merge with
        const existingConfig = allNodeConfigs[configuringNodeId] || nodeAgents[configuringNodeId] || {};
        
        // Merge configurations instead of overwriting
        let mergedConfig;
        if ('questions' in newConfig) {
          // Dataset configuration
          mergedConfig = { ...existingConfig, ...newConfig };
        } else if ('agent' in newConfig || newConfig.type === 'agent') {
          // Agent configuration - deep merge to preserve API keys and other settings
          if (existingConfig.type === 'agent' && existingConfig.agent) {
            mergedConfig = {
              ...existingConfig,
              agent: {
                ...existingConfig.agent,
                ...newConfig.agent,
                search: {
                  ...existingConfig.agent.search,
                  ...newConfig.agent?.search
                }
              }
            };
          } else {
            mergedConfig = newConfig;
          }
        } else {
          // Other configuration types
          mergedConfig = { ...existingConfig, ...newConfig };
        }
        
        // Save merged configuration to database
        const selectedNode = nodes.find(n => n.id === configuringNodeId);
        await nodeConfigService.saveConfiguration(
          configuringNodeId, 
          mergedConfig, 
          selectedNode?.type || 'unknown'
        );
        
        // Update local state with merged configuration
        if ('questions' in mergedConfig) {
          setNodeDatasets(prev => ({ ...prev, [configuringNodeId]: mergedConfig }));
        } else if ('agent' in mergedConfig || mergedConfig.type === 'agent') {
          setNodeAgents(prev => ({ ...prev, [configuringNodeId]: mergedConfig.agent || mergedConfig }));
          setAllNodeConfigs(prev => ({ ...prev, [configuringNodeId]: mergedConfig }));
        } else {
          setAllNodeConfigs(prev => ({ ...prev, [configuringNodeId]: mergedConfig }));
        }
        
        console.log('✅ Configuration auto-saved with merge:', { nodeId: configuringNodeId, config: mergedConfig });
      } catch (error) {
        console.error('Error saving configuration:', error);
      }
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-app-bg-highlight to-app-bg-content">
      {/* Help/Tour Button */}
      <button
        onClick={() => setShowTour(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
        title="Take a guided tour"
      >
        <HelpCircle size={24} />
      </button>

      {/* Left Panel - FlowSidebar */}
      <div className="bg-white border-r border-app-border flex-shrink-0 relative" data-tour="flow-components">
        <FlowSidebar nodes={availableNodes} isLoading={isLoading} error={error} />
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-app-bg-content border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-app-text">Flow Builder</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-app-text-subtle" data-tour="canvas-controls">
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
            <button
              onClick={() => onNavigate('choice')}
              className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover"
            >
              Create Flow
            </button>
          </div>
        </header>
        
        <main className="flex-1 flex overflow-hidden">
          <div 
            ref={canvasRef} 
            className="flex-1 relative overflow-hidden select-none" 
            data-tour="canvas-area"
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

                {/* Drag line for visual feedback when connecting nodes */}
                {dragLine && (
                  <path
                    d={`M ${dragLine.from.x} ${dragLine.from.y} C ${dragLine.from.x + 60} ${dragLine.from.y}, ${dragLine.to.x - 60} ${dragLine.to.y}, ${dragLine.to.x} ${dragLine.to.y}`}
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.8"
                  />
                )}
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
                  onTest={(id) => {
                    setTestingNodeId(id);
                    setTestMode(null); // or 'chat'/'dataset' if you want to default
                    setConfiguringNodeId(null); // close config panel if open
                  }}
                />
              ))}
            </div>
            
            {/* Zoom/Pan Instructions */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white text-xs px-3 py-2 rounded-lg" data-tour="drag-drop-instructions">
              <div>Ctrl/Cmd + Scroll: Zoom</div>
              <div>Alt + Drag or Middle Click: Pan</div>
              <div>Drag from sidebar to add nodes</div>
              <div>Drag between ports to connect</div>
            </div>
            
            {/* Full-Screen Delete Loading Overlay */}
            {deletingNodeId && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center space-y-4 min-w-[300px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-app-text mb-2">Deleting Node</h3>
                    <p className="text-sm text-app-text-subtle">
                      Removing node and cleaning up configurations...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Configuration Panel */}
          {configuringNodeId && (
            <ConfigurationPanel
              selectedNode={nodes.find(n => n.id === configuringNodeId) || null}
              nodeConfig={configuringNodeId ? (
                nodeDatasets[configuringNodeId] ||
                allNodeConfigs[configuringNodeId] ||
                nodeAgents[configuringNodeId]
              ) : null}
              connections={connections}
              nodes={nodes}
              onConfigChange={handleConfigChange}
              onClose={() => setConfiguringNodeId(null)}
              onSave={async (updatedConfig?: any) => {
                if (configuringNodeId) {
                  setIsConfigSaving(true);

                  // Use the passed config if available, otherwise fall back to state
                  const config = updatedConfig ||
                              nodeDatasets[configuringNodeId] ||
                              nodeAgents[configuringNodeId] ||
                              allNodeConfigs[configuringNodeId];

                  try {
                    const selectedNode = nodes.find(n => n.id === configuringNodeId);
                    await nodeConfigService.saveConfiguration(
                      configuringNodeId,
                      config,
                      selectedNode?.type || 'unknown'
                    );

                    console.log('✅ Configuration saved for node:', configuringNodeId);
                    console.log('Config data:', config);

                    // Update local state with the saved config
                    if (config?.type === 'agent' && config?.agent) {
                      setNodeAgents(prev => ({ ...prev, [configuringNodeId]: config.agent }));
                      setAllNodeConfigs(prev => ({ ...prev, [configuringNodeId]: config }));
                    } else {
                      setAllNodeConfigs(prev => ({ ...prev, [configuringNodeId]: config }));
                    }

                    setConfiguringNodeId(null);
                  } catch (error) {
                    console.error('Error saving configuration:', error);
                    alert('Error saving configuration. Please try again.');
                  } finally {
                    setIsConfigSaving(false);
                  }
                }
              }}
              initialWidth={400}
              minWidth={300}
              maxWidth={800}
            />
          )}
          
          {testingNodeId && (
            <div
              className={`bg-white border-l border-app-border shadow-lg flex flex-col transition-all duration-300 ease-in-out ${isTestPanelCollapsed ? 'w-12' : ''}`}
              style={{ width: isTestPanelCollapsed ? '48px' : `${testPanelWidth}px` }}
            >
              {isTestPanelCollapsed ? (
                <div className="h-full flex flex-col items-center py-4">
                  <button
                    onClick={() => setIsTestPanelCollapsed(false)}
                    className="w-8 h-8 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors flex items-center justify-center mb-2"
                    title="Expand Test Panel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="text-xs text-app-text-subtle transform -rotate-90 whitespace-nowrap mt-4">
                    Test
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border-b border-app-border">
                    <h2 className="text-lg font-semibold text-app-text">Test Agent</h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsTestPanelCollapsed(true)}
                        className="w-6 h-6 text-app-text-subtle hover:text-app-text transition-colors"
                        title="Collapse Test Panel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setTestingNodeId(null);
                          setTestMode(null);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Close Test Panel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {!testMode ? (
                      <div className="p-4 space-y-4">
                        <p className="text-sm text-app-text-subtle">Select a test mode:</p>
                        <button
                          onClick={() => setTestMode('dataset')}
                          className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
                        >
                          Test with Dataset
                        </button>
                        <button
                          onClick={() => setTestMode('chat')}
                          className="w-full py-2 px-4 border border-app-border text-app-text rounded hover:bg-gray-100 transition-colors"
                        >
                          Chat with Agent
                        </button>
                      </div>
                    ) : testMode === 'dataset' ? (
                      <DatasetTestingPanel
                        nodeId={testingNodeId}
                        agentConfig={testingNodeId ? (nodeAgents[testingNodeId] || null) : null}
                        connectedKnowledgeBaseNodes={testingNodeId ?
                          connections
                            .filter(([from, to]) => to === testingNodeId)
                            .map(([from]) => from)
                            .filter(nodeId => {
                              const node = nodes.find(n => n.id === nodeId);
                              return node?.title.includes('🧠');
                            }) : []
                        }
                        onBack={() => setTestMode(null)}
                      />
                    ) : (
                      <GeminiChatPanel
                        nodeId={testingNodeId}
                        agentConfig={testingNodeId ? (nodeAgents[testingNodeId] || null) : null}
                        connectedKnowledgeBaseNodes={testingNodeId ?
                          connections
                            .filter(([from, to]) => to === testingNodeId)
                            .map(([from]) => from)
                            .filter(nodeId => {
                              const node = nodes.find(n => n.id === nodeId);
                              return node?.title.includes('🧠');
                            }) : []
                        }
                        onBack={() => setTestMode(null)}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
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

      {/* Agent Selection Modal */}
      <AgentSelectionModal
        isOpen={isAgentModalOpen}
        onClose={() => {
          setIsAgentModalOpen(false);
          setPendingAgentNodeData(null);
        }}
        onSelect={handleAgentSelect}
      />

      {/* Knowledge Base Upload Modal */}
      <KnowledgeBaseUploadModal
        isOpen={isKnowledgeBaseModalOpen}
        onClose={() => {
          setIsKnowledgeBaseModalOpen(false);
          setPendingKnowledgeBaseNodeData(null);
        }}
        onUpload={handleKnowledgeBaseUpload}
        onSelectExisting={handleKnowledgeBaseSelect}
        isUploading={isKnowledgeBaseUploading}
      />

      {/* Guided Tour */}
      <GuidedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        steps={flowCreationTourSteps}
      />
    </div>
  );
};

export default AgentCreationPage;