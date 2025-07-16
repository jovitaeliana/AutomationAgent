import React from 'react';
import { InputField, SelectField, TextareaField } from './FormField';

// Example form for an LLM Node
export const LLMConfigForm: React.FC = () => {
  // In a real app, you would manage state for these fields
  return (
    <div className="space-y-4">
      <SelectField label="Model" options={['GPT-4', 'GPT-3.5-turbo', 'Claude-3']} value={'GPT-4'} onChange={() => {}} />
      <div>
        <label className="block text-sm font-medium text-app-text mb-2">Temperature</label>
        <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full" />
        <div className="flex justify-between text-xs text-app-text-subtle">
          <span>Conservative</span>
          <span>Creative</span>
        </div>
      </div>
      <TextareaField label="System Prompt" value="You are a helpful assistant." onChange={() => {}} placeholder="You are a helpful assistant..." />
      <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-hover">Save Configuration</button>
    </div>
  );
};

// Example form for a Weather API Node
export const WeatherAPIConfigForm: React.FC = () => {
  return (
    <div className="space-y-4">
      <SelectField label="API Provider" options={['OpenWeatherMap', 'WeatherAPI']} value={'OpenWeatherMap'} onChange={() => {}} />
      <InputField label="API Key" type="password" placeholder="Enter API key" value="" onChange={() => {}} />
      <InputField label="Default Location" placeholder="Singapore" value="Singapore" onChange={() => {}} />
      <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-hover">Save Configuration</button>
    </div>
  );
};