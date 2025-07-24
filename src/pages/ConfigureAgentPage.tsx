import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import PresetCard from '../components/PresetCard';
import { InputField, TextareaField } from '../components/FormField';
import { WeatherConfigFields, SearchConfigFields, CustomConfigFields } from '../components/PresetConfigs';
import { BackButtonIcon } from '../components/Icons';
import { presetService, agentService } from '../services/api';
import type { Preset } from '../lib/supabase';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation';

interface ConfigureAgentPageProps {
  onNavigate: (page: PageName) => void;
}

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
  const [searchApiKey, setSearchApiKey] = useState('');
  const [searchEngineId, setSearchEngineId] = useState('');
  const [maxResults, setMaxResults] = useState('10');
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

    setIsSaving(true);
    setSaveStatus('Saving configuration...');

    try {
      // Build configuration object based on selected preset
      let configuration: any = {
        preset: selectedPreset,
        systemPrompt,
        limitations
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
            apiKey: searchApiKey,
            engineId: searchEngineId,
            maxResults: parseInt(maxResults)
          };
          break;
        case 'custom':
          configuration.custom = {
            agentType,
            configJson: configJson ? JSON.parse(configJson) : {}
          };
          break;
      }

      // Save agent to Supabase
      const savedAgent = await agentService.create({
        name: agentName,
        description,
        configuration
      });

      console.log('Agent saved successfully:', savedAgent);
      setSaveStatus('Configuration saved successfully!');
      
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
        setSearchApiKey('');
        setSearchEngineId('');
        setMaxResults('10');
        setAgentType('LLM Agent');
        setConfigJson('');
        setSaveStatus('');
      }, 2000);

    } catch (err) {
      console.error('Error saving agent:', err);
      setSaveStatus(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(''), 5000);
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
        return <SearchConfigFields 
          apiKey={searchApiKey} onApiKeyChange={setSearchApiKey}
          engineId={searchEngineId} onEngineIdChange={setSearchEngineId}
          maxResults={maxResults} onMaxResultsChange={setMaxResults} 
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
    <form onSubmit={handleSaveConfiguration} className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg text-app-text font-sans">
      <PageHeader title="Configure Agent" subtitle="Set up and customize your automation agent">
        <div className="flex items-center space-x-4">
          <button 
            type="button" 
            onClick={() => onNavigate('home')} 
            className="text-app-text-subtle hover:opacity-80"
          >
            <BackButtonIcon />
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className={`font-semibold py-2 px-4 rounded-lg transition-colors ${
              isSaving 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
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
      </main> 
    </form>
  );
};

export default ConfigureAgentPage;