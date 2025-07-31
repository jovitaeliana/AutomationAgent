// src/components/ConfigurationPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { InputField, TextareaField, SelectField } from './FormField';
import type { FlowNodeData } from './FlowNode';
import type { Dataset, Agent } from '../lib/supabase';
import KnowledgeBaseConfig from './KnowledgeBaseConfig';
import AgentKnowledgeBaseConfig from './AgentKnowledgeBaseConfig';
import { nodeConfigService } from '../services/api';
import { useToast } from './ToastContainer';

interface ConfigurationPanelProps {
  selectedNode: FlowNodeData | null;
  nodeConfig: Dataset | Agent | any | null; // Allow any for node configurations
  connections: [string, string][];
  nodes: FlowNodeData[];
  onConfigChange: (config: any) => void;
  onClose: () => void;
  onSave: (config?: any) => void;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  selectedNode,
  nodeConfig,
  connections,
  nodes,
  onConfigChange,
  onClose,
  onSave,
  initialWidth = 400,
  minWidth = 300,
  maxWidth = 800
}) => {
  // Panel state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [knowledgeBaseSaveFunction, setKnowledgeBaseSaveFunction] = useState<(() => Promise<void>) | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Toast notifications
  const { showSuccess, showError } = useToast();

  // State for agent configuration fields
  const [serpApiKey, setSerpApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [searchScope, setSearchScope] = useState('General Web Search');
  const [maxResults, setMaxResults] = useState('10');
  const [resultProcessing, setResultProcessing] = useState('Summarize with Gemini');
  const [customInstructions, setCustomInstructions] = useState('');
  const [filterCriteria, setFilterCriteria] = useState('');
  
  // Track if user has manually edited these fields
  const [systemPromptEdited, setSystemPromptEdited] = useState(false);
  const [limitationsEdited, setLimitationsEdited] = useState(false);

  // Weather configuration state
  const [weatherOpenWeatherApiKey, setWeatherOpenWeatherApiKey] = useState('');
  const [weatherGeminiApiKey, setWeatherGeminiApiKey] = useState('');
  const [weatherLocation, setWeatherLocation] = useState('Singapore');
  const [weatherUnits, setWeatherUnits] = useState('Celsius');
  const [weatherMaxResults, setWeatherMaxResults] = useState('10');
  const [weatherCustomInstructions, setWeatherCustomInstructions] = useState('');

  // RAG document upload state
  const [ragDocuments, setRagDocuments] = useState<any[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [limitations, setLimitations] = useState('');
  
  // Debug wrapper for setLimitations
  const setLimitationsWithDebug = (value: string, isUserEdit = false) => {
    console.log('📝 Setting limitations:', { from: limitations, to: value, isUserEdit, stack: new Error().stack?.split('\n')[2] });
    setLimitations(value);
    if (isUserEdit) {
      setLimitationsEdited(true);
    }
  };
  
  // Debug wrapper for setSystemPrompt
  const setSystemPromptWithDebug = (value: string, isUserEdit = false) => {
    console.log('📝 Setting systemPrompt:', { from: systemPrompt, to: value, isUserEdit });
    setSystemPrompt(value);
    if (isUserEdit) {
      setSystemPromptEdited(true);
    }
  };
  
  // State for RAG configuration fields
  const [ragModel, setRagModel] = useState('Mistral-7B-Instruct');
  const [chunkingStrategy, setChunkingStrategy] = useState('SimpleNodeParser');
  const [chunkSize, setChunkSize] = useState('512');
  const [chunkOverlap, setChunkOverlap] = useState('50');
  const [chunkUnit, setChunkUnit] = useState('Sentences');
  const [embeddingModel, setEmbeddingModel] = useState('BAAI/bge-small-en');
  const [topKResults, setTopKResults] = useState(10);

  // Resize handler
  const handleResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, window.innerWidth - moveEvent.clientX));
      setPanelWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [minWidth, maxWidth]);

  // Function to fetch configuration directly from database
  const fetchConfigurationFromDB = async (nodeId: string) => {
    try {
      setIsLoadingConfig(true);
      const allConfigs = await nodeConfigService.getAllConfigurations();
      const nodeConfiguration = allConfigs[nodeId];

      if (nodeConfiguration) {
        console.log('📥 Fetched configuration from DB:', nodeConfiguration);
        loadConfigurationIntoForm(nodeConfiguration);
      } else {
        console.log('⚠️ No configuration found in DB for node:', nodeId);
        resetConfigurationForm();
      }
    } catch (error) {
      console.error('❌ Error fetching configuration from DB:', error);
      resetConfigurationForm();
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Function to load configuration into form fields
  const loadConfigurationIntoForm = (config: any) => {
    if (!config) {
      resetConfigurationForm();
      return;
    }
    
    console.log('📎 Loading configuration into form:', { config, systemPromptEdited, limitationsEdited });

    // Check if it's a direct node configuration object with search
    if (config.search) {
      setSerpApiKey(config.search.serpApiKey || '');
      setGeminiApiKey(config.search.geminiApiKey || '');
      setSearchScope(config.search.searchScope || 'General Web Search');
      setMaxResults(config.search.maxResults?.toString() || '10');
      setResultProcessing(config.search.resultProcessing || 'Summarize with Gemini');
      setCustomInstructions(config.search.customInstructions || '');
      setFilterCriteria(config.search.filterCriteria || '');
      if (!systemPromptEdited) setSystemPrompt(config.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(config.limitations || '');
    }
    // Check if it's a direct node configuration object with customRag
    else if (config.customRag) {
      setRagModel(config.customRag.model || 'Mistral-7B-Instruct');
      setChunkingStrategy(config.customRag.chunkingStrategy || 'SimpleNodeParser');
      setChunkSize(config.customRag.chunkSize?.toString() || '512');
      setChunkOverlap(config.customRag.chunkOverlap?.toString() || '50');
      setChunkUnit(config.customRag.chunkUnit || 'Sentences');
      setEmbeddingModel(config.customRag.embeddingModel || 'BAAI/bge-small-en');
      setTopKResults(config.customRag.topKResults || 10);
      setRagDocuments(config.customRag.documents || []);
      if (!systemPromptEdited) setSystemPrompt(config.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(config.limitations || '');
    }
    // Check if it's the new agent structure with type and agent properties
    else if (config.type === 'agent' && config.agent && config.agent.search) {
      const agentConfig = config.agent;
      setSerpApiKey(agentConfig.search.serpApiKey || '');
      setGeminiApiKey(agentConfig.search.geminiApiKey || '');
      setSearchScope(agentConfig.search.searchScope || 'General Web Search');
      setMaxResults(agentConfig.search.maxResults?.toString() || '10');
      setResultProcessing(agentConfig.search.resultProcessing || 'Summarize with Gemini');
      setCustomInstructions(agentConfig.search.customInstructions || '');
      setFilterCriteria(agentConfig.search.filterCriteria || '');
      if (!systemPromptEdited) setSystemPrompt(agentConfig.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(agentConfig.limitations || '');
    }
    // Check if it's the new agent structure with type and agent properties for RAG
    else if (config.type === 'agent' && config.agent && config.agent.customRag) {
      const agentConfig = config.agent;
      setRagModel(agentConfig.customRag.model || 'Mistral-7B-Instruct');
      setChunkingStrategy(agentConfig.customRag.chunkingStrategy || 'SimpleNodeParser');
      setChunkSize(agentConfig.customRag.chunkSize?.toString() || '512');
      setChunkOverlap(agentConfig.customRag.chunkOverlap?.toString() || '50');
      setChunkUnit(agentConfig.customRag.chunkUnit || 'Sentences');
      setEmbeddingModel(agentConfig.customRag.embeddingModel || 'BAAI/bge-small-en');
      setTopKResults(agentConfig.customRag.topKResults || 10);
      setRagDocuments(agentConfig.customRag.documents || []);
      if (!systemPromptEdited) setSystemPrompt(agentConfig.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(agentConfig.limitations || '');
    }
    // Check if it's an Agent object with configuration
    else if (config.configuration && config.configuration.search) {
      const agentConfig = config.configuration;
      setSerpApiKey(agentConfig.search.serpApiKey || '');
      setGeminiApiKey(agentConfig.search.geminiApiKey || '');
      setSearchScope(agentConfig.search.searchScope || 'General Web Search');
      setMaxResults(agentConfig.search.maxResults?.toString() || '10');
      setResultProcessing(agentConfig.search.resultProcessing || 'Summarize with Gemini');
      setCustomInstructions(agentConfig.search.customInstructions || '');
      setFilterCriteria(agentConfig.search.filterCriteria || '');
      if (!systemPromptEdited) setSystemPrompt(agentConfig.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(agentConfig.limitations || '');
    }
    // Check if it's an Agent object with RAG configuration
    else if (config.configuration && config.configuration.customRag) {
      const agentConfig = config.configuration;
      setRagModel(agentConfig.customRag.model || 'Mistral-7B-Instruct');
      setChunkingStrategy(agentConfig.customRag.chunkingStrategy || 'SimpleNodeParser');
      setChunkSize(agentConfig.customRag.chunkSize?.toString() || '512');
      setChunkOverlap(agentConfig.customRag.chunkOverlap?.toString() || '50');
      setChunkUnit(agentConfig.customRag.chunkUnit || 'Sentences');
      setEmbeddingModel(agentConfig.customRag.embeddingModel || 'BAAI/bge-small-en');
      setTopKResults(agentConfig.customRag.topKResults || 10);
      setRagDocuments(agentConfig.customRag.documents || []);
      if (!systemPromptEdited) setSystemPrompt(agentConfig.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(agentConfig.limitations || '');
    }
    // Check if agent has nested configuration structure for RAG
    else if (config.type === 'agent' && config.agent && config.agent.configuration && config.agent.configuration.customRag) {
      const ragConfig = config.agent.configuration.customRag;
      setRagModel(ragConfig.model || 'Mistral-7B-Instruct');
      setChunkingStrategy(ragConfig.chunkingStrategy || 'SimpleNodeParser');
      setChunkSize(ragConfig.chunkSize?.toString() || '512');
      setChunkOverlap(ragConfig.chunkOverlap?.toString() || '50');
      setChunkUnit(ragConfig.chunkUnit || 'Sentences');
      setEmbeddingModel(ragConfig.embeddingModel || 'BAAI/bge-small-en');
      setTopKResults(ragConfig.topKResults || 10);
      setRagDocuments(ragConfig.documents || []);
      if (!systemPromptEdited) setSystemPrompt(config.agent.configuration.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(config.agent.configuration.limitations || '');
    }
    // Check if it's a weather configuration
    else if (config.configuration && config.configuration.weather) {
      const weatherConfig = config.configuration.weather;
      setWeatherOpenWeatherApiKey(weatherConfig.openWeatherApiKey || '');
      setWeatherGeminiApiKey(weatherConfig.geminiApiKey || '');
      setWeatherLocation(weatherConfig.location || 'Singapore');
      setWeatherUnits(weatherConfig.units || 'Celsius');
      setWeatherMaxResults(weatherConfig.maxResults?.toString() || '10');
      setWeatherCustomInstructions(weatherConfig.customInstructions || '');
      if (!systemPromptEdited) setSystemPrompt(config.configuration.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(config.configuration.limitations || '');
    }
    // Check if it's the new agent structure with weather
    else if (config.type === 'agent' && config.agent && config.agent.weather) {
      const weatherConfig = config.agent.weather;
      setWeatherOpenWeatherApiKey(weatherConfig.openWeatherApiKey || '');
      setWeatherGeminiApiKey(weatherConfig.geminiApiKey || '');
      setWeatherLocation(weatherConfig.location || 'Singapore');
      setWeatherUnits(weatherConfig.units || 'Celsius');
      setWeatherMaxResults(weatherConfig.maxResults?.toString() || '10');
      setWeatherCustomInstructions(weatherConfig.customInstructions || '');
      if (!systemPromptEdited) setSystemPrompt(config.agent.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(config.agent.limitations || '');
    }
    // If it's just system prompt and limitations
    else if (config.systemPrompt !== undefined || config.limitations !== undefined) {
      if (!systemPromptEdited) setSystemPrompt(config.systemPrompt || '');
      if (!limitationsEdited) setLimitationsWithDebug(config.limitations || '');
    }
    else {
      resetConfigurationForm();
    }
  };

  // Function to reset configuration form
  const resetConfigurationForm = () => {
    setSerpApiKey('');
    setGeminiApiKey('');
    setSearchScope('General Web Search');
    setMaxResults('10');
    setResultProcessing('Summarize with Gemini');
    setCustomInstructions('');
    setFilterCriteria('');
    setSystemPrompt('');
    setLimitationsWithDebug('');
    
    // Reset RAG fields
    setRagModel('Mistral-7B-Instruct');
    setChunkingStrategy('SimpleNodeParser');
    setChunkSize('512');
    setChunkOverlap('50');
    setChunkUnit('Sentences');
    setEmbeddingModel('BAAI/bge-small-en');
    setTopKResults(10);
    setRagDocuments([]);

    // Reset weather fields
    setWeatherOpenWeatherApiKey('');
    setWeatherGeminiApiKey('');
    setWeatherLocation('Singapore');
    setWeatherUnits('Celsius');
    setWeatherMaxResults('10');
    setWeatherCustomInstructions('');
  };

  // Fetch configuration from DB when selectedNode changes
  useEffect(() => {
    if (selectedNode && selectedNode.title.includes('🤖')) {
      fetchConfigurationFromDB(selectedNode.id);
    }
  }, [selectedNode?.id]);

  // Load existing configuration when nodeConfig changes (fallback)
  useEffect(() => {
    // Only use nodeConfig as fallback if we're not loading from DB and it's not an agent node
    if (nodeConfig && !isLoadingConfig && (!selectedNode || !selectedNode.title.includes('🤖'))) {
      loadConfigurationIntoForm(nodeConfig);
    }
  }, [nodeConfig, selectedNode, isLoadingConfig]);

  // Helper function to determine if the current configuration is RAG-based
  const isRagConfiguration = (config: any) => {
    if (!config) return false;

    console.log('🔍 Checking if RAG configuration:', config);

    // Check various ways RAG config can be stored
    const hasRag = !!(
      config.customRag ||
      (config.agent && config.agent.customRag) ||
      (config.configuration && config.configuration.customRag) ||
      (config.type === 'agent' && config.agent && config.agent.customRag) ||
      (config.agent && config.agent.configuration && config.agent.configuration.customRag) ||
      // Additional check for direct agent configuration
      (config.type === 'agent' && config.agent && config.agent.configuration && config.agent.configuration.customRag)
    );

    console.log('🔍 Has RAG configuration:', hasRag);
    return hasRag;
  };

  // Helper function to determine if the current configuration is weather-based
  const isWeatherConfiguration = (config: any) => {
    if (!config) return false;

    console.log('🌤️ Checking if Weather configuration:', config);

    // Check various ways weather config can be stored
    const hasWeather = !!(
      config.weather ||
      (config.agent && config.agent.weather) ||
      (config.configuration && config.configuration.weather) ||
      (config.type === 'agent' && config.agent && config.agent.weather) ||
      (config.agent && config.agent.configuration && config.agent.configuration.weather) ||
      // Check for preset type
      (config.configuration && config.configuration.preset === 'weather') ||
      (config.agent && config.agent.configuration && config.agent.configuration.preset === 'weather')
    );

    console.log('🌤️ Has Weather configuration:', hasWeather);
    return hasWeather;
  };

  // Document upload handler
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDocument(true);
    const newDocuments: any[] = [];

    try {
      for (const file of Array.from(files)) {
        // Read file content
        const content = await readFileContent(file);

        const document = {
          name: file.name,
          content: content,
          type: file.type || 'text/plain',
          size: file.size,
          uploadedAt: new Date().toISOString()
        };

        newDocuments.push(document);
      }

      // Add to existing documents
      setRagDocuments(prev => [...prev, ...newDocuments]);

      // Clear the input
      event.target.value = '';

    } catch (error) {
      console.error('Error uploading documents:', error);
      showError('Upload Failed', 'Failed to upload one or more documents. Please try again.');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  // Helper function to read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Remove document function
  const removeDocument = (index: number) => {
    setRagDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      console.log('🔄 Starting configuration save...');
      console.log('📋 Current form values:', {
        systemPrompt: `"${systemPrompt}"`,
        limitations: `"${limitations}"`,
        ragModel,
        serpApiKey: serpApiKey ? '[SET]' : '[NOT SET]',
        geminiApiKey: geminiApiKey ? '[SET]' : '[NOT SET]'
      });
      
      if (!limitations) {
        console.warn('⚠️ ALERT: limitations field is empty!', { limitationsLength: limitations.length, limitationsType: typeof limitations });
      }
      
      // First, save knowledge base changes if any
      if (knowledgeBaseSaveFunction) {
        try {
          await knowledgeBaseSaveFunction();
        } catch (error) {
          console.error('Error saving knowledge base configuration:', error);
          showError('Knowledge Base Save Failed', 'Failed to save knowledge base configuration. Other settings will still be saved.');
          // Continue with other saves even if KB save fails
        }
      }
    if (selectedNode && selectedNode.title.includes('🤖')) {
      // This is an agent node - save agent configuration
      // Preserve existing configuration structure if it exists
      const existingConfig = nodeConfig || {};
      const isRag = isRagConfiguration(existingConfig);

      let agentConfig;
      
      const isWeather = isWeatherConfiguration(existingConfig);

      if (isRag) {
        // RAG configuration
        agentConfig = {
          preset: 'customRag',
          customRag: {
            model: ragModel,
            chunkingStrategy,
            chunkSize: parseInt(chunkSize),
            chunkOverlap: parseInt(chunkOverlap),
            chunkUnit,
            embeddingModel,
            topKResults,
            documents: ragDocuments
          },
          systemPrompt,
          limitations,
          updatedAt: new Date().toISOString()
        };
      } else if (isWeather) {
        // Weather configuration
        agentConfig = {
          preset: 'weather',
          weather: {
            openWeatherApiKey: weatherOpenWeatherApiKey,
            geminiApiKey: weatherGeminiApiKey,
            location: weatherLocation,
            units: weatherUnits,
            maxResults: parseInt(weatherMaxResults),
            customInstructions: weatherCustomInstructions
          },
          systemPrompt,
          limitations,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Search configuration
        agentConfig = {
          preset: 'search',
          search: {
            serpApiKey,
            geminiApiKey,
            searchScope,
            maxResults: parseInt(maxResults),
            resultProcessing,
            customInstructions,
            filterCriteria,
            processingPrompt: `Process search results according to these parameters:
- Scope: ${searchScope}
- Custom Instructions: ${customInstructions}
- Filter Criteria: ${filterCriteria}
- Processing Type: ${resultProcessing}
- Max Results: ${maxResults}`
          },
          systemPrompt,
          limitations,
          updatedAt: new Date().toISOString()
        };
      }

      // Create updated config by merging with existing configuration
      let updatedConfig;
      if (existingConfig.type === 'agent' && existingConfig.agent) {
        // Merge with existing agent config to preserve any additional fields
        updatedConfig = {
          ...existingConfig,
          agent: {
            ...existingConfig.agent,
            ...agentConfig
          }
        };
      } else {
        // Use new structure if no existing config or different structure
        updatedConfig = {
          type: 'agent',
          agent: agentConfig
        };
      }
      
      console.log('📦 Final configuration to save:', JSON.stringify(updatedConfig, null, 2));

      // Update local state first
      onConfigChange(updatedConfig);

      // Pass the updated config directly to onSave to ensure it's saved correctly
      if (typeof onSave === 'function') {
        await onSave(updatedConfig);
        showSuccess('Configuration Saved', 'Agent configuration has been saved successfully.');
      } else {
        showSuccess('Configuration Saved', 'Agent configuration has been updated.');
      }
    } else {
      // For non-agent nodes, just call onSave normally
      if (typeof onSave === 'function') {
        await onSave();
        showSuccess('Configuration Saved', 'Configuration has been saved successfully.');
      } else {
        showSuccess('Configuration Saved', 'Configuration has been updated.');
      }
    }
    } catch (error) {
      console.error('Error saving configuration:', error);
      showError('Save Failed', 'Failed to save configuration. Please try again.');
    }
  };

  if (!selectedNode) return null;

  const isAgentNode = selectedNode.title.includes('🤖');
  const isDatasetNode = selectedNode.title.includes('📄') || selectedNode.type.toLowerCase().includes('document');
  const isKnowledgeBaseNode = selectedNode.title.includes('🧠') && selectedNode.title.toLowerCase().includes('knowledge base');
  const hasConfigurableOptions = isAgentNode || isDatasetNode || isKnowledgeBaseNode;

  // Find connected knowledge base nodes for agent nodes
  const connectedKnowledgeBaseNodes = isAgentNode ?
    connections
      .filter(([, to]) => to === selectedNode.id)
      .map(([from]) => from)
      .filter(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        return node?.title.includes('🧠');
      }) : [];

  return (
    <div 
      className={`bg-white border-l border-gray-200 flex flex-col max-h-screen relative transition-all duration-300 ease-in-out ${isCollapsed ? 'w-12' : ''}`}
      style={{ width: isCollapsed ? '48px' : `${panelWidth}px` }}
    >
      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-10 ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
          onMouseDown={handleResize}
        />
      )}

      {isCollapsed ? (
        /* Collapsed State */
        <div className="h-full flex flex-col items-center py-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-8 h-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center mb-2"
            title="Expand Configuration Panel"
          >
            <ChevronLeft size={16} />
          </button>
          <div 
            className="text-xs text-gray-500 transform -rotate-90 origin-center whitespace-nowrap"
            style={{ writingMode: 'horizontal-tb', marginTop: '10px' }}
          >
            Config
          </div>
        </div>
      ) : (
        /* Expanded State */
        <>
          {/* Fixed Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {isAgentNode ? 'Agent Configuration' :
               isDatasetNode ? 'Dataset Configuration' :
               isKnowledgeBaseNode ? 'Knowledge Base Configuration' :
               'Node Information'}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCollapsed(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Collapse Panel"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close Panel"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="space-y-6">
              {/* Node Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Node Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Title:</span> {selectedNode.title}</div>
                  <div>
                    <span className="font-medium">Type:</span> {
                      (() => {
                        const type = selectedNode.type;
                        // If it's an agent type, extract just the actual type (e.g., "Weather" from "Agent type: Weather")
                        if (type.startsWith('Agent type:')) {
                          return type.replace('Agent type:', '').trim();
                        }
                        // For other types, use the original formatting
                        const formatted = type
                          .split(':')
                          .map(part => part.trim())
                          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                          .join(': ');

                        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                      })()
                    }
                  </div>
                </div>
              </div>

              {/* Agent Configuration */}
              {isAgentNode && (
                <>
                  {isLoadingConfig && (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Loading configuration...</span>
                      </div>
                    </div>
                  )}
                  <div className={isLoadingConfig ? 'opacity-50 pointer-events-none' : ''}>
                    {isRagConfiguration(nodeConfig) ? (
                      // RAG Configuration
                      <>
                        <h4 className="font-medium text-gray-900 mb-4">Local RAG Model Configuration</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <h5 className="text-sm font-medium text-blue-800 mb-2">Local Model Setup</h5>
                          <p className="text-sm text-blue-700">
                            Using local GGUF models with GPU acceleration. Make sure your local model server is running on port 8000.
                          </p>
                        </div>
                        <div className="space-y-4">
                          <SelectField
                            label="Local RAG Model"
                            options={[
                              'Mistral-7B-Instruct',
                              'Llama-3-8B-Instruct',
                              'TinyLlama-1.1B-Chat',
                              'OpenHermes-2.5-Mistral'
                            ]}
                            value={ragModel}
                            onChange={setRagModel}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <SelectField
                              label="Chunking Strategy"
                              options={[
                                'SimpleNodeParser',
                                'FixedSize',
                                'SlidingWindow',
                                'Semantic'
                              ]}
                              value={chunkingStrategy}
                              onChange={setChunkingStrategy}
                            />
                            <SelectField
                              label="Chunk Unit"
                              options={[
                                'Sentences',
                                'Paragraphs',
                                'Pages'
                              ]}
                              value={chunkUnit}
                              onChange={setChunkUnit}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <SelectField
                              label="Chunk Size (tokens)"
                              options={['256', '512', '1024']}
                              value={chunkSize}
                              onChange={setChunkSize}
                            />
                            <SelectField
                              label="Overlap (tokens)"
                              options={['0', '50', '100']}
                              value={chunkOverlap}
                              onChange={setChunkOverlap}
                            />
                          </div>
                          
                          <SelectField
                            label="Embedding Model"
                            options={[
                              'BAAI/bge-small-en',
                              'BAAI/bge-base-en-v1.5',
                              'intfloat/e5-small-v2'
                            ]}
                            value={embeddingModel}
                            onChange={setEmbeddingModel}
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Top K Results: {topKResults}
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="20"
                              value={topKResults}
                              onChange={(e) => setTopKResults(parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>1</span>
                              <span>20</span>
                            </div>
                          </div>
                        </div>

                        {/* Document Upload Section */}
                        <div className="mt-6">
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Knowledge Base Documents</h5>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <input
                              type="file"
                              multiple
                              accept=".txt,.pdf,.doc,.docx,.json,.csv"
                              onChange={handleDocumentUpload}
                              className="hidden"
                              id="rag-document-upload"
                              disabled={isUploadingDocument}
                            />
                            <label
                              htmlFor="rag-document-upload"
                              className={`cursor-pointer flex flex-col items-center justify-center py-4 ${isUploadingDocument ? 'opacity-50' : ''}`}
                            >
                              <div className="text-gray-400 mb-2">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600 text-center">
                                {isUploadingDocument ? 'Uploading...' : 'Click to upload documents or drag and drop'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Supports: TXT, PDF, DOC, DOCX, JSON, CSV
                              </p>
                            </label>
                          </div>

                          {/* Display uploaded documents */}
                          {ragDocuments.length > 0 && (
                            <div className="mt-4">
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents ({ragDocuments.length})</h6>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {ragDocuments.map((doc, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <div className="flex items-center">
                                      <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                      <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                                      <span className="text-xs text-gray-500 ml-2">({(doc.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button
                                      onClick={() => removeDocument(index)}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                          <h4 className="font-medium text-blue-900 mb-1 text-sm">How it works:</h4>
                          <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Upload documents directly to this RAG agent</li>
                            <li>• Documents are chunked using your selected strategy and size</li>
                            <li>• Text chunks are converted to embeddings using the selected model</li>
                            <li>• When queried, the most relevant chunks are retrieved based on similarity</li>
                            <li>• The RAG model generates responses using the retrieved context</li>
                            <li>• All models run through Hugging Face's inference API</li>
                          </ul>
                        </div>
                      </>
                    ) : isWeatherConfiguration(nodeConfig) ? (
                      // Weather Configuration
                      <>
                        <h4 className="font-medium text-gray-900 mb-4">Weather Agent Configuration</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">Weather Agent Configuration</h4>
                          <p className="text-sm text-blue-700">
                            This weather agent requires both API keys: OpenWeather for fetching weather data, and Gemini for processing and responding to weather queries with natural language.
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                              label="OpenWeather API Key *"
                              placeholder="Enter your OpenWeatherMap API key for weather data"
                              value={weatherOpenWeatherApiKey}
                              onChange={setWeatherOpenWeatherApiKey}
                              type="password"
                            />
                            <InputField
                              label="Gemini API Key *"
                              placeholder="Enter your Gemini API key to process weather results"
                              value={weatherGeminiApiKey}
                              onChange={setWeatherGeminiApiKey}
                              type="password"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField
                              label="Default Location"
                              placeholder="Singapore"
                              value={weatherLocation}
                              onChange={setWeatherLocation}
                            />
                            <SelectField
                              label="Temperature Units"
                              options={['Celsius', 'Fahrenheit', 'Kelvin']}
                              value={weatherUnits}
                              onChange={setWeatherUnits}
                            />
                            <InputField
                              label="Max Search Results"
                              type="number"
                              placeholder="10"
                              value={weatherMaxResults}
                              onChange={setWeatherMaxResults}
                            />
                          </div>
                          <TextareaField
                            label="Custom Instructions"
                            placeholder="Additional instructions for weather responses (e.g., include clothing recommendations, activity suggestions)"
                            value={weatherCustomInstructions}
                            onChange={setWeatherCustomInstructions}
                            rows={3}
                          />
                        </div>
                      </>
                    ) : (
                      // Search Configuration
                      <>
                        <h4 className="font-medium text-gray-900 mb-4">Search Configuration</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <InputField
                          label="SerpAPI Key *"
                          placeholder="Enter your SerpAPI key"
                          value={serpApiKey}
                          onChange={setSerpApiKey}
                          type="password"
                        />
                        <InputField
                          label="Gemini API Key *"
                          placeholder="Enter your Gemini API key"
                          value={geminiApiKey}
                          onChange={setGeminiApiKey}
                          type="password"
                        />
                      </div>

                      <SelectField
                        label="Search Scope"
                        options={[
                          "General Web Search",
                          "Places & Locations",
                          "Business & Services", 
                          "News & Current Events",
                          "Academic & Research",
                          "Shopping & Products",
                          "Images & Visual Content",
                          "Local Services",
                          "Custom (defined below)"
                        ]}
                        value={searchScope}
                        onChange={setSearchScope}
                      />

                      <div className="grid grid-cols-1 gap-4">
                        <InputField
                          label="Max Results"
                          placeholder="10"
                          value={maxResults}
                          onChange={setMaxResults}
                          type="number"
                        />
                        <SelectField
                          label="Result Processing"
                          options={[
                            "Summarize with Gemini",
                            "Extract Key Information",
                            "Answer Specific Questions",
                            "Filter by Relevance",
                            "Custom Processing"
                          ]}
                          value={resultProcessing}
                          onChange={setResultProcessing}
                        />
                      </div>

                          <TextareaField
                            label="Custom Instructions"
                            placeholder="e.g., 'Focus only on restaurant information with ratings and opening hours'"
                            value={customInstructions}
                            onChange={setCustomInstructions}
                            rows={3}
                          />

                          <TextareaField
                            label="Filter Criteria"
                            placeholder="e.g., 'Only include results from the last 30 days'"
                            value={filterCriteria}
                            onChange={setFilterCriteria}
                            rows={2}
                          />

                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="font-medium text-blue-900 mb-1 text-sm">How it works:</h4>
                          <ul className="text-xs text-blue-800 space-y-1">
                            <li>• SerpAPI fetches search results based on your queries</li>
                            <li>• Gemini AI processes and filters results according to your custom instructions</li>
                            <li>• Results are formatted and presented according to your specified scope</li>
                            <li>• Both API keys are required for the enhanced search functionality</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>

                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Limitations & Instructions</h4>
                    <div className="space-y-4">
                      <TextareaField
                        label="System Prompt"
                        placeholder="Enter system instructions for the agent..."
                        value={systemPrompt}
                        onChange={(value) => {
                          setSystemPromptWithDebug(value, true);
                        }}
                        rows={4}
                      />
                      <TextareaField
                        label="Limitations"
                        placeholder="Specify any limitations or restrictions..."
                        value={limitations}
                        onChange={(value) => {
                          setLimitationsWithDebug(value, true);
                        }}
                        rows={3}
                      />
                    </div>

                    {/* Connected Knowledge Bases */}
                    <AgentKnowledgeBaseConfig
                      agentId={selectedNode.id}
                      connectedKnowledgeBaseNodes={connectedKnowledgeBaseNodes}
                      connections={connections}
                      onConfigChange={onConfigChange}
                    />
                  </div>
                </>
              )}

              {/* Dataset Configuration */}
              {isDatasetNode && nodeConfig && nodeConfig.questions && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Dataset Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {nodeConfig.name}</div>
                      <div><span className="font-medium">Type:</span> {nodeConfig.type}</div>
                      <div><span className="font-medium">Questions:</span> {nodeConfig.total_questions}</div>
                      <div><span className="font-medium">Created:</span> {new Date(nodeConfig.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Knowledge Base Configuration */}
              {isKnowledgeBaseNode && (
                <KnowledgeBaseConfig
                  nodeId={selectedNode.id}
                  onConfigChange={onConfigChange}
                  onSaveRequired={setKnowledgeBaseSaveFunction}
                />
              )}

              {/* Default node information */}
              {!isAgentNode && !isDatasetNode && !isKnowledgeBaseNode && (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      This node type doesn't have additional configuration options available.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer with Save Button - Only show if there are configurable options */}
          {hasConfigurableOptions && (
            <div className="border-t border-gray-200 p-6 flex-shrink-0">
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConfigurationPanel;