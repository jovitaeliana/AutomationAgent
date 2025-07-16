import React from 'react';
import { InputField, SelectField, TextareaField } from './FormField';

// --- Form for LLM Node ---
interface LLMConfigProps {
  config: { model: string; temperature: number; systemPrompt: string; };
  onConfigChange: (newConfig: any) => void;
}
export const LLMConfigForm: React.FC<LLMConfigProps> = ({ config, onConfigChange }) => (
  <div className="space-y-4">
    <SelectField label="Model" options={['GPT-4', 'GPT-3.5-turbo', 'Claude-3']} value={config.model} onChange={(model) => onConfigChange({ ...config, model })} />
    <div>
      <label className="block text-sm font-medium text-app-text mb-2">Temperature: {config.temperature}</label>
      <input type="range" min="0" max="1" step="0.1" value={config.temperature} onChange={(e) => onConfigChange({ ...config, temperature: parseFloat(e.target.value) })} className="w-full" />
    </div>
    <TextareaField label="System Prompt" placeholder="You are a helpful assistant..." value={config.systemPrompt} onChange={(systemPrompt) => onConfigChange({ ...config, systemPrompt })} />
  </div>
);

// --- Form for Weather API Node ---
interface WeatherConfigProps {
  config: { provider: string; apiKey: string; location: string; };
  onConfigChange: (newConfig: any) => void;
}
export const WeatherAPIConfigForm: React.FC<WeatherConfigProps> = ({ config, onConfigChange }) => (
  <div className="space-y-4">
    <SelectField label="API Provider" options={['OpenWeatherMap', 'WeatherAPI']} value={config.provider} onChange={(provider) => onConfigChange({ ...config, provider })} />
    <InputField label="API Key" type="password" placeholder="Enter API key" value={config.apiKey} onChange={(apiKey) => onConfigChange({ ...config, apiKey })} />
    <InputField label="Default Location" placeholder="e.g., Singapore" value={config.location} onChange={(location) => onConfigChange({ ...config, location })} />
  </div>
);