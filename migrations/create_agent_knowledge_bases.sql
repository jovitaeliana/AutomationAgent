-- Create agent_knowledge_bases table to link agents with knowledge bases
CREATE TABLE IF NOT EXISTS agent_knowledge_bases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, knowledge_base_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_bases_agent_id ON agent_knowledge_bases(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_bases_knowledge_base_id ON agent_knowledge_bases(knowledge_base_id);

-- Add RLS policies
ALTER TABLE agent_knowledge_bases ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this based on your auth requirements)
CREATE POLICY "Allow all operations on agent_knowledge_bases" ON agent_knowledge_bases
  FOR ALL USING (true);
