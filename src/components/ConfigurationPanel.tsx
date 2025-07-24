// src/components/ConfigurationPanel.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { InputField, TextareaField, SelectField } from './FormField';
import type { FlowNodeData } from './FlowNode';
import type { Dataset, Agent } from '../lib/supabase';

interface ConfigurationPanelProps {
  selectedNode: FlowNodeData | null;
  nodeConfig: Dataset | Agent | any | null; // Allow any for node configurations
  onConfigChange: (config: any) => void;
  onClose: () => void;
  onSave: () => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  selectedNode,
  nodeConfig,
  onConfigChange,
  onClose,
  onSave
}) => {
  // State for agent configuration fields
  const [serpApiKey, setSerpApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [searchScope, setSearchScope] = useState('General Web Search');
  const [maxResults, setMaxResults] = useState('10');
  const [resultProcessing, setResultProcessing] = useState('Summarize with Gemini');
  const [customInstructions, setCustomInstructions] = useState('');
  const [filterCriteria, setFilterCriteria] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [limitations, setLimitations] = useState('');

  // Load existing configuration when nodeConfig changes
  useEffect(() => {
    if (nodeConfig) {
      // Check if it's a direct node configuration object with search
      if (nodeConfig.search) {
        setSerpApiKey(nodeConfig.search.serpApiKey || '');
        setGeminiApiKey(nodeConfig.search.geminiApiKey || '');
        setSearchScope(nodeConfig.search.searchScope || 'General Web Search');
        setMaxResults(nodeConfig.search.maxResults?.toString() || '10');
        setResultProcessing(nodeConfig.search.resultProcessing || 'Summarize with Gemini');
        setCustomInstructions(nodeConfig.search.customInstructions || '');
        setFilterCriteria(nodeConfig.search.filterCriteria || '');
        setSystemPrompt(nodeConfig.systemPrompt || '');
        setLimitations(nodeConfig.limitations || '');
      }
      // Check if it's an Agent object with configuration
      else if (nodeConfig.configuration && nodeConfig.configuration.search) {
        const config = nodeConfig.configuration;
        setSerpApiKey(config.search.serpApiKey || '');
        setGeminiApiKey(config.search.geminiApiKey || '');
        setSearchScope(config.search.searchScope || 'General Web Search');
        setMaxResults(config.search.maxResults?.toString() || '10');
        setResultProcessing(config.search.resultProcessing || 'Summarize with Gemini');
        setCustomInstructions(config.search.customInstructions || '');
        setFilterCriteria(config.search.filterCriteria || '');
        setSystemPrompt(config.systemPrompt || '');
        setLimitations(config.limitations || '');
      }
      // If it's just system prompt and limitations
      else if (nodeConfig.systemPrompt !== undefined || nodeConfig.limitations !== undefined) {
        setSystemPrompt(nodeConfig.systemPrompt || '');
        setLimitations(nodeConfig.limitations || '');
      }
    } else {
      // Reset form for new configurations
      setSerpApiKey('');
      setGeminiApiKey('');
      setSearchScope('General Web Search');
      setMaxResults('10');
      setResultProcessing('Summarize with Gemini');
      setCustomInstructions('');
      setFilterCriteria('');
      setSystemPrompt('');
      setLimitations('');
    }
  }, [nodeConfig]);

  const handleSave = () => {
    if (selectedNode && selectedNode.title.includes('🤖')) {
      // This is an agent node - save agent configuration
      const updatedConfig = {
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
      
      onConfigChange(updatedConfig);
    }
    onSave();
  };

  if (!selectedNode) return null;

  const isAgentNode = selectedNode.title.includes('🤖');
  const isDatasetNode = selectedNode.title.includes('📄') || selectedNode.type.toLowerCase().includes('document');
  const hasConfigurableOptions = isAgentNode || isDatasetNode;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col max-h-screen">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">
          {isAgentNode ? 'Agent Configuration' : isDatasetNode ? 'Dataset Configuration' : 'Node Information'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
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
                  selectedNode.type
                    .split(':')
                    .map(part => part.trim())
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                    .join(': ')
                }
              </div>
            </div>
          </div>

          {/* Agent Configuration */}
          {isAgentNode && (
            <>
              <div>
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

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Limitations & Instructions</h4>
                <div className="space-y-4">
                  <TextareaField
                    label="System Prompt"
                    placeholder="Enter system instructions for the agent..."
                    value={systemPrompt}
                    onChange={setSystemPrompt}
                    rows={4}
                  />
                  <TextareaField
                    label="Limitations"
                    placeholder="Specify any limitations or restrictions..."
                    value={limitations}
                    onChange={setLimitations}
                    rows={3}
                  />
                </div>
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

          {/* Default node information */}
          {!isAgentNode && !isDatasetNode && (
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
    </div>
  );
};

export default ConfigurationPanel;