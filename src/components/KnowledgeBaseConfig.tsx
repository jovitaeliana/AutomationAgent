import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import FileUploadButton from './FileUploadButton';
import { knowledgeBaseService } from '../services/api';
import type { KnowledgeBase } from '../lib/supabase';

interface KnowledgeBaseConfigProps {
  nodeId: string;
  onConfigChange?: (config: any) => void;
  onSaveRequired?: (saveFunction: () => Promise<void>) => void;
}

const KnowledgeBaseConfig: React.FC<KnowledgeBaseConfigProps> = ({
  nodeId,
  onConfigChange,
  onSaveRequired
}) => {
  const [documents, setDocuments] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing documents for this node
  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      // Get all documents - show all available sources, not just the one connected to this node
      const allDocs = await knowledgeBaseService.getAll();
      setDocuments(allDocs);

      // Find the document currently connected to this node
      const currentNodeDoc = allDocs.find(doc =>
        doc.metadata &&
        typeof doc.metadata === 'object' &&
        doc.metadata.nodeId === nodeId
      );

      // Auto-select the currently connected document, or the first available if none connected
      if (currentNodeDoc) {
        setSelectedDocumentId(currentNodeDoc.id);
        setPendingDocumentId(currentNodeDoc.id); // Set pending to current
      } else if (allDocs.length > 0 && !selectedDocumentId) {
        setSelectedDocumentId(allDocs[0].id);
        setPendingDocumentId(allDocs[0].id); // Set pending to first available
      }

      // Reset unsaved changes flag when loading
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading knowledge base documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [nodeId]);

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
    if (!uploadName) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
      setUploadName(nameWithoutExtension);
    }
  };

  const handleUpload = async () => {
    if (!uploadName.trim()) {
      alert('Please enter a name');
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

    setIsUploading(true);

    try {
      let content = '';
      let documentData: any = {
        name: uploadName.trim(),
        description: uploadDescription.trim() || undefined,
        source_type: sourceType,
        content: '',
        metadata: { nodeId }
      };

      if (sourceType === 'file' && selectedFile) {
        // Read file content
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(selectedFile);
        });

        documentData = {
          ...documentData,
          file_name: selectedFile.name,
          file_type: selectedFile.type || 'text/plain',
          file_size: selectedFile.size,
          content
        };
      } else if (sourceType === 'url') {
        // For URL, we'll store the URL as content for now
        // In a real implementation, you might want to fetch the URL content
        documentData = {
          ...documentData,
          source_url: sourceUrl.trim(),
          content: sourceUrl.trim() // Store URL as content for now
        };
      }

      // Upload document
      const newDocument = await knowledgeBaseService.create(documentData);

      // Update documents list and select the new document
      setDocuments(prev => [newDocument, ...prev]);
      setSelectedDocumentId(newDocument.id);
      setPendingDocumentId(newDocument.id);
      setHasUnsavedChanges(false); // New document is already connected

      // Reset form
      setSelectedFile(null);
      setUploadName('');
      setUploadDescription('');
      setSourceUrl('');
      setShowUploadForm(false);

      // Notify parent of config change
      if (onConfigChange) {
        onConfigChange({ documentsCount: documents.length + 1 });
      }

      console.log('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentSelection = (documentId: string) => {
    // Just update the pending selection, don't save immediately
    setPendingDocumentId(documentId);
    setSelectedDocumentId(documentId);

    // Check if this is different from the currently connected document
    const currentlyConnected = documents.find(doc =>
      doc.metadata &&
      typeof doc.metadata === 'object' &&
      doc.metadata.nodeId === nodeId
    );

    const hasChanges = !currentlyConnected || currentlyConnected.id !== documentId;
    setHasUnsavedChanges(hasChanges);
  };

  const saveDocumentConnection = async () => {
    if (!pendingDocumentId || !hasUnsavedChanges) {
      return;
    }

    try {
      // First, disconnect any currently connected document from this node
      const currentlyConnected = documents.find(doc =>
        doc.metadata &&
        typeof doc.metadata === 'object' &&
        doc.metadata.nodeId === nodeId
      );

      if (currentlyConnected && currentlyConnected.id !== pendingDocumentId) {
        // Remove nodeId from the currently connected document
        const updatedMetadata = { ...currentlyConnected.metadata };
        delete updatedMetadata.nodeId;

        await knowledgeBaseService.update(currentlyConnected.id, {
          metadata: updatedMetadata
        });
      }

      // Connect the selected document to this node
      const selectedDoc = documents.find(doc => doc.id === pendingDocumentId);
      if (selectedDoc) {
        const updatedMetadata = {
          ...(selectedDoc.metadata || {}),
          nodeId
        };

        await knowledgeBaseService.update(pendingDocumentId, {
          metadata: updatedMetadata
        });
      }

      // Refresh the documents list to reflect the changes
      await loadDocuments();

      console.log('Document connection saved successfully');
    } catch (error) {
      console.error('Error saving document connection:', error);
      alert('Failed to save document connection. Please try again.');
    }
  };

  // Notify parent when save function is available
  useEffect(() => {
    if (onSaveRequired) {
      onSaveRequired(saveDocumentConnection);
    }
  }, [onSaveRequired]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await knowledgeBaseService.delete(documentId);
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);

      // If the deleted document was selected, select the first remaining document
      if (selectedDocumentId === documentId) {
        setSelectedDocumentId(updatedDocuments.length > 0 ? updatedDocuments[0].id : null);
      }

      // Notify parent of config change
      if (onConfigChange) {
        onConfigChange({ documentsCount: updatedDocuments.length });
      }

      console.log('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Knowledge Base Sources</h4>
        <p className="text-sm text-gray-600">
          Upload JSON, CSV, or TXT documents or reference URLs to build your knowledge base for RAG processing.
        </p>
      </div>

      {/* Current Selected Document */}
      {selectedDocument && (
        <div className={`border rounded-lg p-3 ${
          selectedDocument.metadata?.nodeId === nodeId && !hasUnsavedChanges
            ? 'bg-green-50 border-green-200'
            : hasUnsavedChanges
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              selectedDocument.metadata?.nodeId === nodeId && !hasUnsavedChanges
                ? 'bg-green-500'
                : hasUnsavedChanges
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}></div>
            <h5 className={`font-medium ${
              selectedDocument.metadata?.nodeId === nodeId && !hasUnsavedChanges
                ? 'text-green-900'
                : hasUnsavedChanges
                ? 'text-yellow-900'
                : 'text-blue-900'
            }`}>
              {selectedDocument.metadata?.nodeId === nodeId && !hasUnsavedChanges
                ? 'Connected Source'
                : hasUnsavedChanges
                ? 'Pending Connection (Click Save to Apply)'
                : 'Selected Source'}
            </h5>
          </div>
          <div className="flex items-center gap-3">
            <FileText className={`w-4 h-4 flex-shrink-0 ${
              selectedDocument.metadata?.nodeId === nodeId && !hasUnsavedChanges
                ? 'text-green-600'
                : hasUnsavedChanges
                ? 'text-yellow-600'
                : 'text-blue-600'
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${
                selectedDocument.metadata?.nodeId === nodeId && !hasUnsavedChanges
                  ? 'text-green-900'
                  : hasUnsavedChanges
                  ? 'text-yellow-900'
                  : 'text-blue-900'
              }`}>{selectedDocument.name}</p>
              <div className={`flex items-center gap-3 text-xs mt-1 ${
                selectedDocument.metadata?.nodeId === nodeId && !hasUnsavedChanges
                  ? 'text-green-700'
                  : hasUnsavedChanges
                  ? 'text-yellow-700'
                  : 'text-blue-700'
              }`}>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedDocument.metadata?.nodeId === nodeId && !hasUnsavedChanges
                    ? 'bg-green-100 text-green-800'
                    : hasUnsavedChanges
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedDocument.source_type === 'url' ? 'URL' : 'File'}
                </span>
                {selectedDocument.source_type === 'file' ? (
                  <>
                    <span className="truncate">{selectedDocument.file_name || 'Unknown file'}</span>
                    <span className="flex-shrink-0">{selectedDocument.file_size ? formatFileSize(selectedDocument.file_size) : 'N/A'}</span>
                  </>
                ) : (
                  <span className="truncate" title={selectedDocument.source_url}>
                    {selectedDocument.source_url || 'No URL'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between p-3">
          <h5 className="font-medium text-gray-900">Add New Source</h5>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Source
          </button>
        </div>

        {showUploadForm && (
          <div className="border-t border-gray-200 p-3 space-y-3">
            {/* Source Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document File *
                </label>
                <FileUploadButton
                  id={`kb-upload-${nodeId}`}
                  onFileSelect={handleFileSelect}
                />
              </div>
            )}

            {/* URL Input Section */}
            {sourceType === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document URL *
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com/document.pdf"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the URL of the document you want to reference
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Name *
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter document name"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Describe the content of this document"
                rows={2}
                disabled={isUploading}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  setUploadName('');
                  setUploadDescription('');
                  setSourceUrl('');
                }}
                disabled={isUploading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  !uploadName.trim() ||
                  (sourceType === 'file' && !selectedFile) ||
                  (sourceType === 'url' && !sourceUrl.trim()) ||
                  isUploading
                }
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div>
        <h5 className="font-medium text-gray-900 mb-2">
          Uploaded Sources ({documents.length})
        </h5>
        
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No documents uploaded yet. Upload your first document to get started.
          </div>
        ) : (
          <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedDocumentId === doc.id
                  ? 'border-blue-300 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleDocumentSelection(doc.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Selection indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      selectedDocumentId === doc.id ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="text-xs font-medium text-gray-500">
                      {selectedDocumentId === doc.id ? 'Selected for this node' : 'Click to select'}
                    </span>
                    {doc.metadata?.nodeId && doc.metadata.nodeId !== nodeId && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        Used by another node
                      </span>
                    )}
                    {doc.metadata?.nodeId === nodeId && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {pendingDocumentId === doc.id && hasUnsavedChanges ? 'Currently Connected' : 'Connected to this node'}
                      </span>
                    )}
                    {!doc.metadata?.nodeId && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        Available
                      </span>
                    )}
                    {pendingDocumentId === doc.id && hasUnsavedChanges && doc.metadata?.nodeId !== nodeId && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        Pending Connection
                      </span>
                    )}
                  </div>
                  {/* Title row with icon */}
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <h6 className="font-medium text-gray-900 truncate">{doc.name}</h6>
                  </div>
                  
                  {/* Description aligned with icon */}
                  {doc.description && (
                    <div className="ml-7"> {/* ml-7 = w-5 + gap-2 = 20px + 8px = 28px */}
                      <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                    </div>
                  )}
                  
                  {/* Metadata aligned with icon */}
                  <div className="mt-2"> {/* ml-7 = w-5 + gap-2 */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {doc.source_type === 'url' ? 'URL' : 'File'}
                      </span>
                      {doc.source_type === 'file' ? (
                        <>
                          <span className="truncate">{doc.file_name || 'Unknown file'}</span>
                          <span>{doc.file_size ? formatFileSize(doc.file_size) : 'N/A'}</span>
                        </>
                      ) : (
                        <span className="truncate max-w-[200px]" title={doc.source_url}>
                          {doc.source_url || 'No URL'}
                        </span>
                      )}
                      <span className="whitespace-nowrap">{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 ml-2 flex-shrink-0"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium text-yellow-800">
              You have unsaved changes to the knowledge base source. Click "Save Configuration" below to apply changes.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseConfig;
