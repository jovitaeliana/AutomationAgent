import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import PresetCard from '../components/PresetCard';
import { InputField, TextareaField, SelectField } from '../components/FormField';
import { WeatherConfigFields, CustomConfigFields } from '../components/PresetConfigs';
import { BackButtonIcon } from '../components/Icons';
import { presetService, agentService } from '../services/api';
import type { Preset } from '../lib/supabase';

type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation';

interface ConfigureAgentPageProps {
  onNavigate: (page: PageName) => void;
}

// Enhanced SearchConfigFields component
const AdvancedSearchConfigFields: React.FC<{
  serpApiKey: string;
  onSerpApiKeyChange: (value: string) => void;
  geminiApiKey: string;
  onGeminiApiKeyChange: (value: string) => void;
  searchScope: string;
  onSearchScopeChange: (value: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (value: string) => void;
  maxResults: string;
  onMaxResultsChange: (value: string) => void;
  resultProcessing: string;
  onResultProcessingChange: (value: string) => void;
  filterCriteria: string;
  onFilterCriteriaChange: (value: string) => void;
}> = ({
  serpApiKey, onSerpApiKeyChange,
  geminiApiKey, onGeminiApiKeyChange,
  searchScope, onSearchScopeChange,
  customInstructions, onCustomInstructionsChange,
  maxResults, onMaxResultsChange,
  resultProcessing, onResultProcessingChange,
  filterCriteria, onFilterCriteriaChange
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InputField
        label="SerpAPI Key *"
        placeholder="Enter your SerpAPI key"
        value={serpApiKey}
        onChange={onSerpApiKeyChange}
        type="password"
      />
      <InputField
        label="Gemini API Key *"
        placeholder="Enter your Gemini API key for result processing"
        value={geminiApiKey}
        onChange={onGeminiApiKeyChange}
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
        onChange={onResultProcessingChange}
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

const ConfigureAgentPage: React.FC<ConfigureAgentPageProps> = ({ onNavigate }) => {
  // State for data fetched from Supabase
  const [presets, setPresets] = useState<Preset[]>([]);
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // State for user selections and form inputs
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [limitations, setLimitations] = useState('');
  
  // State for preset-specific fields
  const [weatherApiKey, setWeatherApiKey] = useState('');
  const [location, setLocation] = useState('Singapore');
  const [units, setUnits] = useState('Celsius');
  
  // Enhanced search configuration
  const [serpApiKey, setSerpApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [searchScope, setSearchScope] = useState('General Web Search');
  const [customInstructions, setCustomInstructions] = useState('');
  const [maxResults, setMaxResults] = useState('10');
  const [resultProcessing, setResultProcessing] = useState('Summarize with Gemini');
  const [filterCriteria, setFilterCriteria] = useState('');
  
  const [agentType, setAgentType] = useState('LLM Agent');
  const [configJson, setConfigJson] = useState('');

  // useEffect to fetch presets when the component mounts
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await presetService.getAll();
        setPresets(data);
      } catch (err) {
        console.error('Error fetching presets:', err);
        if (err instanceof Error) setError(err.message);
        else setError('An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPresets();
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
      if (!geminiApiKey.trim()) {
        setSaveStatus('Gemini API key is required for result processing');
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }
    }

    setIsSaving(true);
    setSaveStatus('Saving configuration...');

    try {
      // Build configuration object based on selected preset
      let configuration: any = {
        preset: selectedPreset,
        systemPrompt,
        limitations,
        createdAt: new Date().toISOString(),
        version: '1.0'
      };

      // Add preset-specific configuration
      switch (selectedPreset) {
        case 'weather':
          configuration.weather = {
            apiKey: weatherApiKey,
            location,
            units
          };
          break;
        case 'search':
          configuration.search = {
            serpApiKey: serpApiKey,
            geminiApiKey: geminiApiKey,
            searchScope: searchScope,
            customInstructions: customInstructions,
            maxResults: parseInt(maxResults),
            resultProcessing: resultProcessing,
            filterCriteria: filterCriteria,
            // Enhanced processing instructions for Gemini
            processingPrompt: `Process search results according to these parameters:
- Scope: ${searchScope}
- Custom Instructions: ${customInstructions}
- Filter Criteria: ${filterCriteria}
- Processing Type: ${resultProcessing}
- Max Results: ${maxResults}`
          };
          break;
        case 'custom':
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
          break;
      }

      // Save agent to Supabase
      const savedAgent = await agentService.create({
        name: agentName,
        description,
        configuration
      });

      console.log('Agent saved successfully:', savedAgent);
      setSaveStatus('Configuration saved successfully! Your agent is now ready to use.');
      
      // Reset form after successful save
      setTimeout(() => {
        setAgentName('');
        setDescription('');
        setSystemPrompt('');
        setLimitations('');
        setSelectedPreset(null);
        setWeatherApiKey('');
        setLocation('Singapore');
        setUnits('Celsius');
        setSerpApiKey('');
        setGeminiApiKey('');
        setSearchScope('General Web Search');
        setCustomInstructions('');
        setMaxResults('10');
        setResultProcessing('Summarize with Gemini');
        setFilterCriteria('');
        setAgentType('LLM Agent');
        setConfigJson('');
        setSaveStatus('');
      }, 3000);

    } catch (err) {
      console.error('Error saving agent:', err);
      setSaveStatus(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(''), 8000);
    }
  };

  const renderPresetFields = () => {
    switch (selectedPreset) {
      case 'weather': 
        return <WeatherConfigFields 
          apiKey={weatherApiKey} onApiKeyChange={setWeatherApiKey}
          location={location} onLocationChange={setLocation}
          units={units} onUnitsChange={setUnits} 
        />;
      case 'search': 
        return <AdvancedSearchConfigFields 
          serpApiKey={serpApiKey} onSerpApiKeyChange={setSerpApiKey}
          geminiApiKey={geminiApiKey} onGeminiApiKeyChange={setGeminiApiKey}
          searchScope={searchScope} onSearchScopeChange={setSearchScope}
          customInstructions={customInstructions} onCustomInstructionsChange={setCustomInstructions}
          maxResults={maxResults} onMaxResultsChange={setMaxResults}
          resultProcessing={resultProcessing} onResultProcessingChange={setResultProcessing}
          filterCriteria={filterCriteria} onFilterCriteriaChange={setFilterCriteria}
        />;
      case 'custom': 
        return <CustomConfigFields 
          agentType={agentType} onAgentTypeChange={setAgentType}
          configJson={configJson} onConfigJsonChange={setConfigJson}
        />;
      default: 
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg text-app-text font-sans">
      <PageHeader title="Configure Agent" subtitle="Set up and customize your automation agent">
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

        <SectionCard title="Quick Setup Presets">
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
          <SectionCard title="Agent Configuration" data-section="agent-configuration">
            <div className="space-y-6">
              <InputField 
                label="Agent Name" 
                placeholder="Enter agent name" 
                value={agentName} 
                onChange={setAgentName} 
              />
              <TextareaField 
                label="Description" 
                placeholder="Describe what this agent does" 
                value={description} 
                onChange={setDescription} 
              />
              <hr className="border-app-border" />
              {renderPresetFields()}
            </div>
          </SectionCard>
        )}

        <SectionCard title="Limitations & Instructions">
          <div className="space-y-6">
            <TextareaField 
              label="System Prompt" 
              rows={4} 
              placeholder="Enter system instructions for the agent..." 
              value={systemPrompt} 
              onChange={setSystemPrompt} 
            />
            <TextareaField 
              label="Limitations" 
              placeholder="Specify any limitations or restrictions..." 
              value={limitations} 
              onChange={setLimitations} 
            />
          </div>
        </SectionCard>

        {/* Save Configuration Button at Bottom */}
        <div className="flex justify-center pt-8">
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
      </main> 
    </div>
  );
};

export default ConfigureAgentPage;