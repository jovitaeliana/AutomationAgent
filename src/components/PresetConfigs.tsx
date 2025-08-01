import React from 'react';
import { InputField, SelectField, TextareaField } from './FormField';

// --- Weather Config ---
interface WeatherConfigProps {
  openWeatherApiKey: string;
  onOpenWeatherApiKeyChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  units: string;
  onUnitsChange: (value: string) => void;
  maxResults: string;
  onMaxResultsChange: (value: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (value: string) => void;
}
export const WeatherConfigFields: React.FC<WeatherConfigProps> = ({
  openWeatherApiKey, onOpenWeatherApiKeyChange,
  location, onLocationChange,
  units, onUnitsChange,
  maxResults, onMaxResultsChange,
  customInstructions, onCustomInstructionsChange
}) => (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-blue-800 mb-2">Weather Agent Configuration</h4>
      <p className="text-sm text-blue-700">
        This weather agent uses OpenWeather API for fetching weather data and processes responses with the local model server.
      </p>
    </div>
    <div className="grid grid-cols-1 gap-6">
      <InputField
        label="OpenWeather API Key *"
        type="password"
        placeholder="Enter your OpenWeatherMap API key for weather data"
        value={openWeatherApiKey}
        onChange={onOpenWeatherApiKeyChange}
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <InputField
        label="Default Location"
        placeholder="Singapore"
        value={location}
        onChange={onLocationChange}
      />
      <SelectField
        label="Temperature Units"
        options={['Celsius', 'Fahrenheit', 'Kelvin']}
        value={units}
        onChange={onUnitsChange}
      />
      <InputField
        label="Max Search Results"
        type="number"
        placeholder="10"
        value={maxResults}
        onChange={onMaxResultsChange}
      />
    </div>
    <TextareaField
      label="Custom Instructions"
      placeholder="Additional instructions for weather responses (e.g., include clothing recommendations, activity suggestions)"
      value={customInstructions}
      onChange={onCustomInstructionsChange}
      rows={3}
    />
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