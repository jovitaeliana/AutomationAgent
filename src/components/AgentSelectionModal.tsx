import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { agentService } from '../services/api';
import type { Agent } from '../lib/supabase';

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (agent: Agent) => Promise<void>;
}

const AgentSelectionModal: React.FC<AgentSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen]);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await agentService.getAll();
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (agent: Agent) => {
    if (isSelecting) return; // Prevent double-clicks

    try {
      setIsSelecting(true);
      await onSelect(agent);
      onClose();
    } catch (error) {
      console.error('Error selecting agent:', error);
      setError('Failed to select agent');
    } finally {
      setIsSelecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Select Agent Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading saved agents...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500">Error: {error}</div>
              <button
                onClick={fetchAgents}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤖</div>
              <div className="text-gray-500 mb-4">No saved agents found</div>
              <p className="text-sm text-gray-400">
                Create an agent configuration first in the Configure Agent page
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors ${isSelecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !isSelecting && handleSelect(agent)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{agent.name}</h3>
                        {agent.description && (
                          <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSelecting) handleSelect(agent);
                        }}
                        disabled={isSelecting}
                        className={`ml-2 px-3 py-1 text-white text-sm rounded transition-colors ${
                          isSelecting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isSelecting ? 'Adding...' : 'Select'}
                      </button>
                    </div>

                    {/* Show configuration preview */}
                    {agent.configuration && (
                      <div className="bg-gray-50 rounded p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs font-medium text-gray-700">Configuration:</span>
                          {agent.configuration.preset && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {agent.configuration.preset}
                            </span>
                          )}
                        </div>
                        
                        {/* Show preset-specific info */}
                        {agent.configuration.weather && (
                          <div className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Weather:</span> {agent.configuration.weather.location}, {agent.configuration.weather.units}
                          </div>
                        )}
                        
                        {agent.configuration.search && (
                          <div className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Search:</span> {agent.configuration.search.searchScope}, max {agent.configuration.search.maxResults} results
                          </div>
                        )}

                        {agent.configuration.customRag && (
                          <div className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Custom RAG:</span> {agent.configuration.customRag.model}, {agent.configuration.customRag.chunkingStrategy}, top-{agent.configuration.customRag.topKResults} results
                          </div>
                        )}

                        {agent.configuration.systemPrompt && (
                          <div className="text-xs text-gray-600 mt-2">
                            <span className="font-medium">System Prompt:</span> {agent.configuration.systemPrompt.substring(0, 100)}
                            {agent.configuration.systemPrompt.length > 100 && '...'}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>Created: {new Date(agent.created_at).toLocaleDateString()}</span>
                      <span>ID: {agent.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentSelectionModal;