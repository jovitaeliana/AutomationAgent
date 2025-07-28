import React, { useState, useEffect } from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import FileUploadButton from './FileUploadButton';
import { knowledgeBaseService } from '../services/api';
import type { KnowledgeBase } from '../lib/supabase';

interface KnowledgeBaseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: {
    type: 'file' | 'url';
    file?: File;
    url?: string;
    name: string;
    description?: string;
  }) => void;
  onSelectExisting?: (source: KnowledgeBase) => void;
  isUploading?: boolean;
}

const KnowledgeBaseUploadModal: React.FC<KnowledgeBaseUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onSelectExisting,
  isUploading = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');
  const [sourceUrl, setSourceUrl] = useState('');
  const [existingSources, setExistingSources] = useState<KnowledgeBase[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('upload');

  // Load existing sources when modal opens
  useEffect(() => {
    if (isOpen) {
      loadExistingSources();
    }
  }, [isOpen]);

  const loadExistingSources = async () => {
    try {
      setIsLoadingSources(true);
      const sources = await knowledgeBaseService.getAll();
      setExistingSources(sources);
    } catch (error) {
      console.error('Error loading existing sources:', error);
    } finally {
      setIsLoadingSources(false);
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

  const handleFileSelect = (file: File) => {
    // Validate file type for knowledge base (JSON, CSV, TXT)
    const allowedTypes = ['.json', '.csv', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert(`Invalid file type. Please select: ${allowedTypes.join(', ')}`);
      return;
    }
    
    setSelectedFile(file);
    // Auto-fill name from filename if not already set
    if (!name) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
      setName(nameWithoutExtension);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a name for the knowledge base');
      return;
    }

    if (sourceType === 'file' && !selectedFile) {
      alert('Please select a file');
      return;
    }

    if (sourceType === 'url' && !sourceUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    if (sourceType === 'file' && selectedFile) {
      onUpload({
        type: 'file',
        file: selectedFile,
        name: name.trim(),
        description: description.trim() || undefined
      });
    } else if (sourceType === 'url') {
      onUpload({
        type: 'url',
        url: sourceUrl.trim(),
        name: name.trim(),
        description: description.trim() || undefined
      });
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setName('');
      setDescription('');
      setSourceUrl('');
      setSourceType('file');
      setActiveTab('upload');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-app-bg-content rounded-xl border border-app-border p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-app-text">Knowledge Base Source</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="w-8 h-8 text-app-text-subtle hover:text-app-text transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-app-border mb-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'upload'
                ? 'text-primary border-b-2 border-primary'
                : 'text-app-text-subtle hover:text-app-text'
            }`}
          >
            Upload New
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'existing'
                ? 'text-primary border-b-2 border-primary'
                : 'text-app-text-subtle hover:text-app-text'
            }`}
          >
            Select Existing ({existingSources.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'upload' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Type Selection */}
          <div>
            <label className="block text-sm font-medium text-app-text mb-2">
              Source Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="file"
                  checked={sourceType === 'file'}
                  onChange={(e) => setSourceType(e.target.value as 'file' | 'url')}
                  className="mr-2"
                  disabled={isUploading}
                />
                File Upload
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="url"
                  checked={sourceType === 'url'}
                  onChange={(e) => setSourceType(e.target.value as 'file' | 'url')}
                  className="mr-2"
                  disabled={isUploading}
                />
                URL Reference
              </label>
            </div>
          </div>

          {/* File Upload Section */}
          {sourceType === 'file' && (
            <div>
              <label className="block text-sm font-medium text-app-text mb-2">
                Document File *
              </label>
              <p className="text-xs text-app-text-subtle mb-3">
                Upload JSON, CSV, or TXT files for RAG processing
              </p>
              <FileUploadButton
                id="knowledge-base-upload"
                onFileSelect={handleFileSelect}
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-app-text-subtle">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                </div>
              )}
            </div>
          )}

          {/* URL Input Section */}
          {sourceType === 'url' && (
            <div>
              <label className="block text-sm font-medium text-app-text mb-2">
                Document URL *
              </label>
              <p className="text-xs text-app-text-subtle mb-3">
                Enter the URL of the document you want to reference
              </p>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg-highlight text-app-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com/document.pdf"
                disabled={isUploading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-app-text mb-2">
              Knowledge Base Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg-highlight text-app-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter knowledge base name"
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg-highlight text-app-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Describe the content of this knowledge base"
              rows={3}
              disabled={isUploading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2 border border-app-border rounded-lg text-app-text hover:bg-app-bg-highlight transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !name.trim() ||
                (sourceType === 'file' && !selectedFile) ||
                (sourceType === 'url' && !sourceUrl.trim()) ||
                isUploading
              }
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
          ) : (
            /* Existing Sources Tab */
            <div className="space-y-4">
              <p className="text-sm text-app-text-subtle">
                Select from previously uploaded knowledge base sources:
              </p>

              {isLoadingSources ? (
                <div className="text-center py-8 text-app-text-subtle">
                  Loading sources...
                </div>
              ) : existingSources.length === 0 ? (
                <div className="text-center py-8 text-app-text-subtle">
                  No existing sources found. Upload your first source to get started.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {existingSources.map((source) => (
                    <div
                      key={source.id}
                      className="border border-app-border rounded-lg p-3 hover:bg-app-bg-highlight cursor-pointer transition-colors"
                      onClick={() => {
                        if (onSelectExisting) {
                          onSelectExisting(source);
                          handleClose();
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {source.source_type === 'url' ? (
                          <ExternalLink className="w-5 h-5 text-app-text-subtle flex-shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-app-text-subtle flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h6 className="font-medium text-app-text truncate">{source.name}</h6>
                            <span className="px-2 py-0.5 bg-app-bg-highlight rounded text-xs font-medium flex-shrink-0">
                              {source.source_type === 'url' ? 'URL' : 'File'}
                            </span>
                          </div>
                          {source.description && (
                            <p className="text-sm text-app-text-subtle mb-2 line-clamp-2">{source.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-app-text-subtle">
                            {source.source_type === 'file' ? (
                              <>
                                <span className="truncate">{source.file_name || 'Unknown file'}</span>
                                <span className="flex-shrink-0">{source.file_size ? formatFileSize(source.file_size) : 'N/A'}</span>
                              </>
                            ) : (
                              <span className="truncate" title={source.source_url}>
                                {source.source_url || 'No URL'}
                              </span>
                            )}
                            <span className="flex-shrink-0">{formatDate(source.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseUploadModal;
