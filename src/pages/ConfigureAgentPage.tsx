import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import PresetCard from '../components/PresetCard';
import { InputField, TextareaField, SelectField } from '../components/FormField';
import { WeatherConfigFields, CustomConfigFields } from '../components/PresetConfigs';
import { BackButtonIcon } from '../components/Icons';
import { presetService, agentService } from '../services/api';
import { useToast } from '../components/ToastContainer';
import GuidedTour, { type TourStep } from '../components/GuidedTour';
import type { Preset, Agent } from '../lib/supabase';

type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'flow-creation' | 'deployment-status';

interface ConfigureAgentPageProps {
  onNavigate: (page: PageName) => void;
}

// Enhanced SearchConfigFields component
const AdvancedSearchConfigFields: React.FC<{
  serpApiKey: string;
  onSerpApiKeyChange: (value: string) => void;
  searchScope: string;
  onSearchScopeChange: (value: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (value: string) => void;
  maxResults: string;
  onMaxResultsChange: (value: string) => void;
  filterCriteria: string;
  onFilterCriteriaChange: (value: string) => void;
}> = ({
  serpApiKey, onSerpApiKeyChange,
  searchScope, onSearchScopeChange,
  customInstructions, onCustomInstructionsChange,
  maxResults, onMaxResultsChange,
  filterCriteria, onFilterCriteriaChange
}) => (
  <div className="space-y-6">
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-green-800 mb-2">Search Agent Configuration</h4>
      <p className="text-sm text-green-700">
        This search agent uses SerpAPI for fetching search results and processes responses with the local model server.
      </p>
    </div>
    <div className="grid grid-cols-1 gap-6">
      <InputField
        label="SerpAPI Key *"
        placeholder="Enter your SerpAPI key"
        value={serpApiKey}
        onChange={onSerpApiKeyChange}
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
      onChange={onSearchScopeChange}
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InputField
        label="Max Results"
        placeholder="10"
        value={maxResults}
        onChange={onMaxResultsChange}
        type="number"
      />
    </div>

    <TextareaField
      label="Custom Instructions"
      placeholder="e.g., 'Focus only on restaurant information with ratings and opening hours' or 'Extract only price information and availability'"
      value={customInstructions}
      onChange={onCustomInstructionsChange}
      rows={3}
    />

    <TextareaField
      label="Filter Criteria"
      placeholder="e.g., 'Only include results from the last 30 days' or 'Exclude promotional content'"
      value={filterCriteria}
      onChange={onFilterCriteriaChange}
      rows={2}
    />

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• SerpAPI fetches search results based on your queries</li>
        <li>• Gemini AI processes and filters results according to your custom instructions</li>
        <li>• Results are formatted and presented according to your specified scope</li>
        <li>• Both API keys are required for the enhanced search functionality</li>
      </ul>
    </div>
  </div>
);

// Custom RAG Configuration Fields component
const CustomRAGConfigFields: React.FC<{
  ragModel: string;
  onRagModelChange: (value: string) => void;
  chunkingStrategy: string;
  onChunkingStrategyChange: (value: string) => void;
  chunkSize: string;
  onChunkSizeChange: (value: string) => void;
  chunkOverlap: string;
  onChunkOverlapChange: (value: string) => void;
  chunkUnit: string;
  onChunkUnitChange: (value: string) => void;
  embeddingModel: string;
  onEmbeddingModelChange: (value: string) => void;
  topKResults: number;
  onTopKResultsChange: (value: number) => void;
  uploadedDocuments: File[];
  onUploadedDocumentsChange: (files: File[]) => void;
}> = ({
  ragModel, onRagModelChange,
  chunkingStrategy, onChunkingStrategyChange,
  chunkSize, onChunkSizeChange,
  chunkOverlap, onChunkOverlapChange,
  chunkUnit, onChunkUnitChange,
  embeddingModel, onEmbeddingModelChange,
  topKResults, onTopKResultsChange,
  uploadedDocuments, onUploadedDocumentsChange
}) => (
  <div className="space-y-6">
    {/* Local Model Information */}
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-medium text-green-900 mb-2 text-sm">🚀 Local Model Setup</h4>
      <div className="text-xs text-green-800 space-y-1">
        <p><strong>No API keys required!</strong> This RAG agent uses local GGUF models with GPU acceleration.</p>
        <p>• Models run locally on your machine for privacy and cost efficiency</p>
        <p>• Make sure your local model server is running on port 8000</p>
        <p>• Run <code className="bg-green-100 px-1 rounded">./start_local_models.sh</code> to start the server</p>
      </div>
    </div>

    {/* Document Upload */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Documents *
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.json,.csv"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onUploadedDocumentsChange(files);
          }}
          className="hidden"
          id="document-upload"
        />
        <label htmlFor="document-upload" className="cursor-pointer">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PDF, TXT, DOCX, JSON, CSV files
          </p>
        </label>
      </div>
      {uploadedDocuments.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-700 mb-1">Uploaded files:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {uploadedDocuments.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                <button
                  onClick={() => {
                    onUploadedDocumentsChange(uploadedDocuments.filter((_, i) => i !== index));
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    {/* RAG Model Selection */}
    <SelectField
      label="RAG Model"
      options={[
        'Mistral-7B-Instruct',
        'Llama-3-8B-Instruct',
        'TinyLlama-1.1B-Chat',
        'OpenHermes-2.5-Mistral'
      ]}
      value={ragModel}
      onChange={onRagModelChange}
    />

    {/* Model descriptions */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <h4 className="font-medium text-gray-900 mb-2 text-sm">Model Information:</h4>
      <div className="text-xs text-gray-700 space-y-1">
        {ragModel === 'Mistral-7B-Instruct' && (
          <p><strong>Mistral-7B-Instruct:</strong> Fast, accurate, well-tuned for retrieval-based tasks (7B, 32k context)</p>
        )}
        {ragModel === 'Llama-3-8B-Instruct' && (
          <p><strong>Llama-3-8B-Instruct:</strong> Strong factuality, great for QA or summaries (8B, 8k-16k context)</p>
        )}
        {ragModel === 'TinyLlama-1.1B-Chat' && (
          <p><strong>TinyLlama-1.1B-Chat:</strong> Runs on low-resource machines, good for basic retrieval (1.1B, 4k context)</p>
        )}
        {ragModel === 'OpenHermes-2.5-Mistral' && (
          <p><strong>OpenHermes-2.5-Mistral:</strong> Tuned for dialog, solid for multi-turn RAG chat (7B, 32k context)</p>
        )}
      </div>
    </div>

    {/* Chunking Configuration */}
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
        onChange={onChunkingStrategyChange}
      />
      <SelectField
        label="Chunk Unit"
        options={[
          'Sentences',
          'Paragraphs',
          'Pages'
        ]}
        value={chunkUnit}
        onChange={onChunkUnitChange}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <SelectField
        label="Chunk Size (tokens)"
        options={['256', '512', '1024', 'custom']}
        value={chunkSize}
        onChange={onChunkSizeChange}
      />
      <SelectField
        label="Overlap (tokens)"
        options={['0', '50', '100', 'custom']}
        value={chunkOverlap}
        onChange={onChunkOverlapChange}
      />
    </div>

    {/* Embedding Model Selection */}
    <SelectField
      label="Embedding Model"
      options={[
        'BAAI/bge-small-en',
        'BAAI/bge-base-en-v1.5',
        'intfloat/e5-small-v2'
      ]}
      value={embeddingModel}
      onChange={onEmbeddingModelChange}
    />

    {/* Embedding model descriptions */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <h4 className="font-medium text-gray-900 mb-2 text-sm">Embedding Model Information:</h4>
      <div className="text-xs text-gray-700 space-y-1">
        {embeddingModel === 'BAAI/bge-small-en' && (
          <p><strong>BAAI/bge-small-en:</strong> Fast, high accuracy per size, CPU-friendly (384 dim) - Default choice for general RAG</p>
        )}
        {embeddingModel === 'BAAI/bge-base-en-v1.5' && (
          <p><strong>BAAI/bge-base-en-v1.5:</strong> Stronger embeddings, high-quality retrieval (768 dim) - Best for GPU-enabled setups</p>
        )}
        {embeddingModel === 'intfloat/e5-small-v2' && (
          <p><strong>intfloat/e5-small-v2:</strong> Instruction-tuned, good performance (384 dim) - Best for instruction-style search</p>
        )}
      </div>
    </div>

    {/* Top K Results Slider */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Top K Results: {topKResults}
      </label>
      <input
        type="range"
        min="1"
        max="20"
        value={topKResults}
        onChange={(e) => onTopKResultsChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>1</span>
        <span>20</span>
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <h4 className="font-medium text-blue-900 mb-1 text-sm">How it works:</h4>
      <ul className="text-xs text-blue-800 space-y-1">
        <li>• Documents are chunked using your selected strategy and size</li>
        <li>• Text chunks are converted to embeddings using the selected model</li>
        <li>• When queried, the most relevant chunks are retrieved based on similarity</li>
        <li>• The local RAG model generates responses using the retrieved context</li>
        <li>• All processing happens locally with GPU acceleration for privacy and speed</li>
      </ul>
    </div>
  </div>
);

const ConfigureAgentPage: React.FC<ConfigureAgentPageProps> = ({ onNavigate }) => {
  // State for data fetched from Supabase
  const [presets, setPresets] = useState<Preset[]>([]);
  const [existingAgents, setExistingAgents] = useState<Agent[]>([]);

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Toast notifications
  const { showSuccess, showError } = useToast();

  // Guided tour state
  const [showTour, setShowTour] = useState(false);

  // Helper function to read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file);
    });
  };

  // Helper function to process uploaded documents and return their content
  const processUploadedDocuments = async (): Promise<Array<{
    name: string;
    content: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>> => {
    const processedDocuments = [];

    for (const file of uploadedDocuments) {
      try {
        const content = await readFileContent(file);

        processedDocuments.push({
          name: file.name,
          content: content,
          type: file.type || 'text/plain',
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
        showError('Document Processing Error', `Failed to process file: ${file.name}`);
      }
    }

    return processedDocuments;
  };

  // State for user selections and form inputs
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [limitations, setLimitations] = useState('');
  
  // State for preset-specific fields
  // Weather configuration
  const [openWeatherApiKey, setOpenWeatherApiKey] = useState('');
  const [location, setLocation] = useState('Singapore');
  const [units, setUnits] = useState('Celsius');
  const [weatherMaxResults, setWeatherMaxResults] = useState('10');
  const [weatherCustomInstructions, setWeatherCustomInstructions] = useState('');

  // Enhanced search configuration
  const [serpApiKey, setSerpApiKey] = useState('');
  const [searchScope, setSearchScope] = useState('General Web Search');
  const [customInstructions, setCustomInstructions] = useState('');
  const [maxResults, setMaxResults] = useState('10');
  const [resultProcessing, setResultProcessing] = useState('Local Model Processing');
  const [filterCriteria, setFilterCriteria] = useState('');

  // Custom RAG configuration
  const [ragModel, setRagModel] = useState('Mistral-7B-Instruct');
  const [chunkingStrategy, setChunkingStrategy] = useState('SimpleNodeParser');
  const [chunkSize, setChunkSize] = useState('512');
  const [chunkOverlap, setChunkOverlap] = useState('50');
  const [chunkUnit, setChunkUnit] = useState('Sentences');
  const [embeddingModel, setEmbeddingModel] = useState('BAAI/bge-small-en');
  const [topKResults, setTopKResults] = useState(10);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);

  const [agentType, setAgentType] = useState('LLM Agent');
  const [configJson, setConfigJson] = useState('');

  const configureAgentTourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Agent Configuration! 🤖',
      content: 'This tour will guide you through creating and configuring your AI agent step by step.',
      position: 'center'
    },
    {
      id: 'existing-agents',
      title: 'Step 1: View Existing Agents',
      content: 'Here you can see all your previously created agents. You can delete them or use them as reference for new configurations.',
      target: '[data-tour="existing-agents"]',
      position: 'bottom'
    },
    {
      id: 'preset-selection',
      title: 'Step 2: Choose a Preset',
      content: 'Select from pre-configured agent types: Weather API for weather data, Google Search for web searches, or Custom for your own configuration.',
      target: '[data-tour="preset-selection"]',
      position: 'bottom'
    },
    {
      id: 'agent-name',
      title: 'Step 3: Name Your Agent',
      content: 'Give your agent a descriptive name that reflects its purpose and functionality.',
      target: '[data-tour="agent-name"]',
      position: 'bottom'
    },
    {
      id: 'preset-config',
      title: 'Step 4: Configure Settings',
      content: 'Configure the specific settings for your chosen preset. This includes API keys, parameters, and custom instructions.',
      target: '[data-tour="preset-config"]',
      position: 'top'
    },
    {
      id: 'system-prompt',
      title: 'Step 5: Set Instructions & Limitations',
      content: 'Define how your agent should behave with system prompts and set any limitations on what it can or cannot do.',
      target: '[data-tour="system-prompt"]',
      position: 'top'
    },
    {
      id: 'save-config',
      title: 'Step 6: Save Your Configuration',
      content: 'Once everything is configured, save your agent. It will be available for use in flows and testing.',
      target: '[data-tour="save-config"]',
      position: 'top'
    }
  ];

  // useEffect to fetch presets and agents when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch presets and agents in parallel
        const [presetsData, agentsData] = await Promise.all([
          presetService.getAll(),
          agentService.getAll()
        ]);

        setPresets(presetsData);
        setExistingAgents(agentsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err instanceof Error) setError(err.message);
        else setError('An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle preset configuration
  const handleConfigurePreset = (presetId: string) => {
    console.log('Configuring preset:', presetId);
    
    // Check what preset is being configured
    const preset = presets.find(p => p.id === presetId);
    console.log('Found preset:', preset);
    
    // Handle different preset types
    if (presetId === 'document-qa' || 
        presetId === 'document_qa' || 
        presetId === 'documentqa' ||
        preset?.title.toLowerCase().includes('document')) {
      // Navigate to upload dataset page for document Q&A
      onNavigate('upload-dataset');
      return;
    }
    
    // For other presets, select them and scroll to configuration
    setSelectedPreset(presetId);
    
    // Scroll to configuration section
    setTimeout(() => {
      const configSection = document.querySelector('[data-section="agent-configuration"]');
      if (configSection) {
        configSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agentName.trim()) {
      setSaveStatus('Please enter an agent name');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (!selectedPreset) {
      setSaveStatus('Please select a preset');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    // Validate search preset requirements
    if (selectedPreset === 'search') {
      if (!serpApiKey.trim()) {
        setSaveStatus('SerpAPI key is required for search functionality');
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }
    }

    // Validate weather preset requirements
    if (selectedPreset === 'weather') {
      if (!openWeatherApiKey.trim()) {
        showError('Validation Error', 'OpenWeather API key is required for weather functionality');
        return;
      }
    }

    // Validate custom RAG preset requirements
    const selectedPresetData = presets.find(p => p.id === selectedPreset);
    if (selectedPresetData && (selectedPresetData.title.toLowerCase().includes('rag') || selectedPresetData.id.toLowerCase().includes('rag'))) {
      if (uploadedDocuments.length === 0) {
        setSaveStatus('Please upload at least one document for the RAG model');
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }
    }

    setIsSaving(true);
    setSaveStatus('Saving configuration...');

    try {
      // Build configuration object based on selected preset
      const configuration: any = {
        preset: selectedPreset,
        systemPrompt,
        limitations,
        createdAt: new Date().toISOString(),
        version: '1.0'
      };

      // Add preset-specific configuration
      const selectedPresetData = presets.find(p => p.id === selectedPreset);
      const isRagPreset = selectedPresetData && (selectedPresetData.title.toLowerCase().includes('rag') || selectedPresetData.id.toLowerCase().includes('rag'));

      if (selectedPreset === 'weather') {
        configuration.weather = {
          openWeatherApiKey,
          location,
          units,
          maxResults: parseInt(weatherMaxResults),
          customInstructions: weatherCustomInstructions
        };
      } else if (selectedPreset === 'search') {
        configuration.search = {
          serpApiKey: serpApiKey,
          searchScope: searchScope,
          customInstructions: customInstructions,
          maxResults: parseInt(maxResults),
          resultProcessing: resultProcessing,
          filterCriteria: filterCriteria,
          // Enhanced processing instructions for local model
          processingPrompt: `Process search results according to these parameters:
- Scope: ${searchScope}
- Custom Instructions: ${customInstructions}
- Filter Criteria: ${filterCriteria}
- Processing Type: ${resultProcessing}
- Max Results: ${maxResults}`
        };
      } else if (isRagPreset) {
        // Process uploaded documents to get their content
        const processedDocuments = await processUploadedDocuments();

        configuration.customRag = {
          model: ragModel,
          chunkingStrategy,
          chunkSize: parseInt(chunkSize),
          chunkOverlap: parseInt(chunkOverlap),
          chunkUnit,
          embeddingModel,
          topKResults,
          documents: processedDocuments
        };
      } else if (selectedPreset === 'custom') {
        try {
          configuration.custom = {
            agentType,
            configJson: configJson ? JSON.parse(configJson) : {}
          };
        } catch (jsonError) {
          setSaveStatus('Invalid JSON in custom configuration');
          setIsSaving(false);
          setTimeout(() => setSaveStatus(''), 3000);
          return;
        }
      }

      // Save agent to Supabase
      const savedAgent = await agentService.create({
        name: agentName,
        description,
        configuration
      });

      // Show success message with document count for RAG agents
      if (isRagPreset && uploadedDocuments.length > 0) {
        showSuccess('Configuration Saved', `Agent "${agentName}" created with ${uploadedDocuments.length} documents processed!`);
      } else {
        showSuccess('Configuration Saved', `Agent "${agentName}" has been created successfully!`);
      }

      // Refresh the agents list
      const updatedAgents = await agentService.getAll();
      setExistingAgents(updatedAgents);

      // Reset form after successful save
      setTimeout(() => {
        setAgentName('');
        setDescription('');
        setSystemPrompt('');
        setLimitations('');
        setSelectedPreset(null);
        setOpenWeatherApiKey('');
        setLocation('Singapore');
        setUnits('Celsius');
        setWeatherMaxResults('10');
        setWeatherCustomInstructions('');
        setSerpApiKey('');
        setSearchScope('General Web Search');
        setCustomInstructions('');
        setMaxResults('10');
        setResultProcessing('Local Model Processing');
        setFilterCriteria('');
        setAgentType('LLM Agent');
        setConfigJson('');
        setSaveStatus('');
      }, 1000);

    } catch (err) {
      console.error('Error saving agent:', err);
      showError('Save Failed', `Failed to save agent configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle agent deletion
  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete the agent "${agentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await agentService.delete(agentId);
      showSuccess('Agent Deleted', `Agent "${agentName}" has been deleted successfully.`);

      // Refresh the agents list
      const updatedAgents = await agentService.getAll();
      setExistingAgents(updatedAgents);
    } catch (error) {
      console.error('Error deleting agent:', error);
      showError('Delete Failed', `Failed to delete agent "${agentName}". Please try again.`);
    }
  };

  const renderPresetFields = () => {
    const selectedPresetData = presets.find(p => p.id === selectedPreset);
    const isRagPreset = selectedPresetData && (selectedPresetData.title.toLowerCase().includes('rag') || selectedPresetData.id.toLowerCase().includes('rag'));

    if (selectedPreset === 'weather') {
      return <WeatherConfigFields
        openWeatherApiKey={openWeatherApiKey} onOpenWeatherApiKeyChange={setOpenWeatherApiKey}
        location={location} onLocationChange={setLocation}
        units={units} onUnitsChange={setUnits}
        maxResults={weatherMaxResults} onMaxResultsChange={setWeatherMaxResults}
        customInstructions={weatherCustomInstructions} onCustomInstructionsChange={setWeatherCustomInstructions}
      />;
    } else if (selectedPreset === 'search') {
      return <AdvancedSearchConfigFields
        serpApiKey={serpApiKey} onSerpApiKeyChange={setSerpApiKey}
        searchScope={searchScope} onSearchScopeChange={setSearchScope}
        customInstructions={customInstructions} onCustomInstructionsChange={setCustomInstructions}
        maxResults={maxResults} onMaxResultsChange={setMaxResults}
        filterCriteria={filterCriteria} onFilterCriteriaChange={setFilterCriteria}
      />;
    } else if (isRagPreset) {
      return <CustomRAGConfigFields
        ragModel={ragModel} onRagModelChange={setRagModel}
        chunkingStrategy={chunkingStrategy} onChunkingStrategyChange={setChunkingStrategy}
        chunkSize={chunkSize} onChunkSizeChange={setChunkSize}
        chunkOverlap={chunkOverlap} onChunkOverlapChange={setChunkOverlap}
        chunkUnit={chunkUnit} onChunkUnitChange={setChunkUnit}
        embeddingModel={embeddingModel} onEmbeddingModelChange={setEmbeddingModel}
        topKResults={topKResults} onTopKResultsChange={setTopKResults}
        uploadedDocuments={uploadedDocuments} onUploadedDocumentsChange={setUploadedDocuments}
      />;
    } else if (selectedPreset === 'custom') {
      return <CustomConfigFields
        agentType={agentType} onAgentTypeChange={setAgentType}
        configJson={configJson} onConfigJsonChange={setConfigJson}
      />;
    } else {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg text-app-text font-sans">
      {/* Help/Tour Button */}
      <button
        onClick={() => setShowTour(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
        title="Take a guided tour"
      >
        <HelpCircle size={24} />
      </button>

      <PageHeader title="Configure Agent" subtitle="Set up and customise your automation agent">
        <div className="flex items-center space-x-4">
          <button 
            type="button" 
            onClick={() => onNavigate('home')} 
            className="text-app-text-subtle hover:opacity-80"
          >
            <BackButtonIcon />
          </button>
        </div>
      </PageHeader>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-8">
        {/* Save Status */}
        {saveStatus && (
          <div className={`p-4 rounded-lg border-2 font-medium ${
            saveStatus.toLowerCase().includes('success')
              ? 'bg-green-100 border-green-500 text-green-800'
              : saveStatus.toLowerCase().includes('failed') || saveStatus.toLowerCase().startsWith('please')
              ? 'bg-red-100 border-red-500 text-red-800'
              : 'bg-blue-100 border-blue-500 text-blue-800'
          }`}>
            {saveStatus}
          </div>
        )}

        {/* Existing Agents Section */}
        <SectionCard title="Existing Agents" data-tour="existing-agents">
          {isLoading && <p>Loading agents...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && (
            <>
              {existingAgents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No agents created yet. Create your first agent using the presets below.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingAgents.map((agent) => (
                    <div key={agent.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
                        <button
                          onClick={() => handleDeleteAgent(agent.id, agent.name)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium ml-2 flex-shrink-0"
                          title="Delete agent"
                        >
                          Delete
                        </button>
                      </div>
                      {agent.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{agent.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        {agent.configuration?.preset && (
                          <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                            {agent.configuration.preset}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard title="Quick Setup Presets" data-tour="preset-selection">
          {isLoading && <p>Loading presets...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  id={preset.id}
                  emoji={preset.emoji}
                  title={preset.title}
                  description={preset.description}
                  isSelected={selectedPreset === preset.id} 
                  onClick={() => setSelectedPreset(preset.id)}
                  onConfigure={handleConfigurePreset}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {selectedPreset && (
          <SectionCard title="Agent Configuration" className="" data-tour="preset-config">
            <div className="space-y-6">
              <div data-tour="agent-name">
                <InputField 
                  label="Agent Name" 
                  placeholder="Enter agent name" 
                  value={agentName} 
                  onChange={setAgentName}
                />
              </div>
              <TextareaField 
                label="Description" 
                placeholder="Describe what this agent does" 
                value={description} 
                onChange={setDescription} 
              />
              <hr className="border-app-border" />
              <div data-tour="preset-config-fields">
                {renderPresetFields()}
              </div>
            </div>
          </SectionCard>
        )}

        {selectedPreset && (
          <SectionCard title="Limitations & Instructions" className="" data-tour="system-prompt">
            <div className="space-y-6">
              <TextareaField
                label="System Prompt"
                rows={4}
                placeholder="Enter system instructions for the agent..."
                value={systemPrompt}
                onChange={setSystemPrompt}
              />
              <TextareaField
                label="Agent Name" 
                placeholder="Specify any limitations or restrictions..."
                value={limitations}
                onChange={setLimitations}
              />
            </div>
          </SectionCard>
        )}

        {/* Save Configuration Button at Bottom */}
        <div className="flex justify-center pt-8">
          <div data-tour="save-config">
            <button 
              type="button"
              onClick={handleSaveConfiguration}
              disabled={isSaving || !selectedPreset}
              className={`font-semibold py-3 px-8 rounded-lg transition-colors text-lg ${
                isSaving || !selectedPreset
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary-hover shadow-lg hover:shadow-xl'
              }`}
            >
              {isSaving ? 'Saving Configuration...' : 'Save Configuration'}
            </button>
          </div>
        }
            type="button"
            onClick={handleSaveConfiguration}
            disabled={isSaving || !selectedPreset}
            data-tour="save-config"
            className={`font-semibold py-3 px-8 rounded-lg transition-colors text-lg ${
              isSaving || !selectedPreset
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-hover shadow-lg hover:shadow-xl'
            }`}
          >
            {isSaving ? 'Saving Configuration...' : 'Save Configuration'}
          </button>
        </div>
      </main> 

      {/* Guided Tour */}
      <GuidedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        steps={configureAgentTourSteps}
      />
    </div>
  );
};

export default ConfigureAgentPage;