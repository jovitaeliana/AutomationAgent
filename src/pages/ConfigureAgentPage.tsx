import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import PresetCard from '../components/PresetCard';
import { InputField, TextareaField } from '../components/FormField';
import { WeatherConfigFields, SearchConfigFields, CustomConfigFields } from '../components/PresetConfigs';
import { BackButtonIcon } from '../components/Icons';

type Preset = { id: string; emoji: string; title: string; description: string; };

const ConfigureAgentPage: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // State for ALL form fields, managed by the parent page
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [limitations, setLimitations] = useState('');
  
  // Weather state
  const [weatherApiKey, setWeatherApiKey] = useState('');
  const [location, setLocation] = useState('Singapore');
  const [units, setUnits] = useState('Celsius');

  // Search state
  const [searchApiKey, setSearchApiKey] = useState('');
  const [searchEngineId, setSearchEngineId] = useState('');
  const [maxResults, setMaxResults] = useState('10');

  const [agentType, setAgentType] = useState('LLM Agent');
  const [configJson, setConfigJson] = useState('');

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    // Now you can build a complete data object with all the state
    const agentData = { agentName, description, systemPrompt, limitations /* ... etc */ };
    console.log("Saving Agent:", agentData);
    alert("Agent configuration logged to console.");
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
    </form>
  );
};

export default ConfigureAgentPage;