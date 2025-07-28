import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Updated type definitions
export interface Dataset {
  id: string;
  name: string;
  type: string;
  description?: string;
  questions: any[];
  total_questions: number;
  created_at: string;
  updated_at: string;
}

export interface FlowNode {
  id: string;
  title: string;
  type: string;
  position: { x: number; y: number };
  created_at: string;
  updated_at: string;
}

export interface FlowConnection {
  id: string;
  from_node: string;
  to_node: string;
  created_at: string;
}

export interface NodeDataset {
  id: string;
  node_id: string;
  dataset_id: string;
  created_at: string;
}

export interface Preset {
  id: string;
  emoji: string;
  title: string;
  description: string;
  created_at: string;
}

export interface AvailableNode {
  id: string;
  category: string;
  items: any[];
  created_at: string;
}

export interface Automation {
  id: number;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
}

export interface RagModel {
  id: number;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  configuration: any;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  source_type: string; // 'file' or 'url'
  source_url?: string;
  file_name?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  content: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}