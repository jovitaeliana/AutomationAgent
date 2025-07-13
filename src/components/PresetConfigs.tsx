import React from 'react';
import { InputField, SelectField, TextareaField } from './FormField';

// --- Weather Config ---
interface WeatherConfigProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  units: string;
  onUnitsChange: (value: string) => void;
}
export const WeatherConfigFields: React.FC<WeatherConfigProps> = ({ apiKey, onApiKeyChange, location, onLocationChange, units, onUnitsChange }) => (
  <div className="space-y-6">
    <InputField label="API Key" type="password" placeholder="OpenWeatherMap API key" value={apiKey} onChange={onApiKeyChange} />
    <InputField label="Default Location" placeholder="Singapore" value={location} onChange={onLocationChange} />
    <SelectField label="Units" options={['Celsius', 'Fahrenheit', 'Kelvin']} value={units} onChange={onUnitsChange} />
  </div>
);

// --- Search Config ---
interface SearchConfigProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  engineId: string;
  onEngineIdChange: (value: string) => void;
  maxResults: string;
  onMaxResultsChange: (value: string) => void;
}
export const SearchConfigFields: React.FC<SearchConfigProps> = ({ apiKey, onApiKeyChange, engineId, onEngineIdChange, maxResults, onMaxResultsChange }) => (
  <div className="space-y-6">
    <InputField label="Google API Key" type="password" placeholder="Google Custom Search API key" value={apiKey} onChange={onApiKeyChange} />
    <InputField label="Search Engine ID" placeholder="Custom Search Engine ID" value={engineId} onChange={onEngineIdChange} />
    <SelectField label="Max Results" options={['5', '10', '15', '20']} value={maxResults} onChange={onMaxResultsChange} />
  </div>
);

// --- Custom Config ---
interface CustomConfigProps {
  agentType: string;
  onAgentTypeChange: (value: string) => void;
  configJson: string;
  onConfigJsonChange: (value: string) => void;
}
export const CustomConfigFields: React.FC<CustomConfigProps> = ({ agentType, onAgentTypeChange, configJson, onConfigJsonChange }) => (
  <div className="space-y-6">
    <SelectField label="Agent Type" options={['API Integration', 'LLM Agent', 'Data Processing', 'I/O Control']} value={agentType} onChange={onAgentTypeChange} />
    <TextareaField label="Configuration JSON" rows={6} placeholder="Enter custom configuration..." value={configJson} onChange={onConfigJsonChange} />
  </div>
);