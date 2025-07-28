import React, { useState, useEffect } from 'react';
import { Brain, FileText, ExternalLink } from 'lucide-react';
import { knowledgeBaseService } from '../services/api';
import type { KnowledgeBase } from '../lib/supabase';

interface AgentKnowledgeBaseConfigProps {
  agentId: string;
  connectedKnowledgeBaseNodes: string[]; // Array of knowledge base node IDs connected to this agent
  onConfigChange?: (config: any) => void;
}

const AgentKnowledgeBaseConfig: React.FC<AgentKnowledgeBaseConfigProps> = ({
  agentId,
  connectedKnowledgeBaseNodes,
  onConfigChange
}) => {
  const [connectedKnowledgeBases, setConnectedKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConnectedKnowledgeBases();
  }, [connectedKnowledgeBaseNodes]);

  const loadConnectedKnowledgeBases = async () => {
    try {
      setIsLoading(true);

      if (connectedKnowledgeBaseNodes.length === 0) {
        setConnectedKnowledgeBases([]);
        return;
      }

      // Get all knowledge bases and filter by connected node IDs
      const allKnowledgeBases = await knowledgeBaseService.getAll();
      const connectedKBs = allKnowledgeBases.filter(kb =>
        kb.metadata &&
        typeof kb.metadata === 'object' &&
        connectedKnowledgeBaseNodes.includes(kb.metadata.nodeId)
      );

      setConnectedKnowledgeBases(connectedKBs);
    } catch (error) {
      console.error('Error loading connected knowledge bases:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Connected Knowledge Bases</h4>
        <p className="text-sm text-gray-600">
          Knowledge bases are connected by linking Knowledge Base nodes to this Agent node in the flow diagram.
        </p>
      </div>

      {/* Connected Knowledge Bases List */}
      <div>
        <h5 className="font-medium text-gray-900 mb-3">
          Connected Sources ({connectedKnowledgeBases.length})
        </h5>

        {isLoading ? (
          <div className="text-center py-4 text-gray-500">
            Loading connected knowledge bases...
          </div>
        ) : connectedKnowledgeBases.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
            <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p>No knowledge bases connected yet.</p>
            <p className="text-sm">Connect knowledge bases to enhance your agent's responses.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connectedKnowledgeBases.map((kb) => (
              <div key={kb.id} className="border border-gray-200 rounded-lg p-3 bg-green-50">
                <div className="flex items-center gap-3">
                  {kb.source_type === 'url' ? (
                    <ExternalLink className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h6 className="font-medium text-green-900 truncate">{kb.name}</h6>
                      <span className="px-2 py-0.5 bg-green-100 rounded text-xs font-medium flex-shrink-0">
                        Connected via Flow
                      </span>
                    </div>
                    {kb.description && (
                      <p className="text-sm text-green-700 mb-2 line-clamp-2">{kb.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-green-600">
                      <span className="px-2 py-0.5 bg-green-100 rounded text-xs font-medium">
                        {kb.source_type === 'url' ? 'URL' : 'File'}
                      </span>
                      {kb.source_type === 'file' ? (
                        <>
                          <span className="truncate">{kb.file_name || 'Unknown file'}</span>
                          <span className="flex-shrink-0">{kb.file_size ? formatFileSize(kb.file_size) : 'N/A'}</span>
                        </>
                      ) : (
                        <span className="truncate" title={kb.source_url}>
                          {kb.source_url || 'No URL'}
                        </span>
                      )}
                      <span className="flex-shrink-0">Added {formatDate(kb.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentKnowledgeBaseConfig;
