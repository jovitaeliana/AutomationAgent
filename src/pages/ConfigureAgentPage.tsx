import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import PresetCard from '../components/PresetCard';
import { InputField, TextareaField } from '../components/FormField';
import { WeatherConfigFields, SearchConfigFields, CustomConfigFields } from '../components/PresetConfigs';
import { BackButtonIcon } from '../components/Icons';

type Preset = { id: string; emoji: string; title: string; description: string; };

const ConfigureAgentPage: React.FC = () => {
  // State for data fetched from API
  const [presets, setPresets] = useState<Preset[]>([]);
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for user selections and form inputs
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [limitations, setLimitations] = useState('');
  
  // Preset-specific state
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
        const response = await fetch('http://localhost:3001/presets');
        if (!response.ok) {
          throw new Error('Failed to fetch presets from server');
        }
        const data = await response.json();
        setPresets(data);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresets();
  }, []);

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would build a complete data object and POST it
    console.log('Saving configuration...');
    alert('Configuration saved (see console for data).');
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
          <button type="button" className="text-app-text-subtle hover:opacity-80"><BackButtonIcon /></button>
          <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover">Save Configuration</button>
        </div>
      </PageHeader>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-8">
        <SectionCard title="Quick Setup Presets">
          {isLoading && <p>Loading presets...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {presets.map((preset) => (
                <PresetCard key={preset.id} {...preset} isSelected={selectedPreset === preset.id} onClick={() => setSelectedPreset(preset.id)} />
              ))}
            </div>
          )}
        </SectionCard>

        {selectedPreset && (
          <SectionCard title="Agent Configuration">
            <div className="space-y-6">
              <InputField label="Agent Name" placeholder="Enter agent name" value={agentName} onChange={setAgentName} />
              <TextareaField label="Description" placeholder="Describe what this agent does" value={description} onChange={setDescription} />
              <hr className="border-app-border" />
              {renderPresetFields()}
            </div>
          </SectionCard>
        )}

        <SectionCard title="Limitations & Instructions">
          <div className="space-y-6">
            <TextareaField label="System Prompt" rows={4} placeholder="Enter system instructions for the agent..." value={systemPrompt} onChange={setSystemPrompt} />
            <TextareaField label="Limitations" placeholder="Specify any limitations or restrictions..." value={limitations} onChange={setLimitations} />
          </div>
        </SectionCard>
      </main> 
    </form>
  );
};

export default ConfigureAgentPage;