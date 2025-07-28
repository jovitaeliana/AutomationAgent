import React, { useState } from 'react';
import { X } from 'lucide-react';
import FileUploadButton from './FileUploadButton';

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
  isUploading?: boolean;
}

const KnowledgeBaseUploadModal: React.FC<KnowledgeBaseUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isUploading = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');
  const [sourceUrl, setSourceUrl] = useState('');

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
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-app-bg-content rounded-xl border border-app-border p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-app-text">Upload Knowledge Base Document</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="w-8 h-8 text-app-text-subtle hover:text-app-text transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
      </div>
    </div>
  );
};

export default KnowledgeBaseUploadModal;
