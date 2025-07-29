import type { Agent } from '../lib/supabase';

// Helper function to determine if an agent uses RAG configuration
export const isRagAgent = (agentConfig: Agent | null): boolean => {
  if (!agentConfig?.configuration) return false;
  
  const config = agentConfig.configuration;
  return !!(
    config.customRag ||
    config.preset === 'customRag' ||
    (config.preset && config.preset.toLowerCase().includes('rag'))
  );
};
