import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { InputField, SelectField, TextareaField } from '../components/FormField';
import ChatPanel from '../components/ChatPanel';
import FileUploadButton from '../components/FileUploadButton';
import { BackButtonIcon } from '../components/Icons';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation';

interface UploadDatasetPageProps {
  onNavigate: (page: PageName) => void;
}

const UploadDatasetPage: React.FC<UploadDatasetPageProps> = ({ onNavigate }) => {
  // State for all the form fields on this page
  const [datasetName, setDatasetName] = useState('');
  const [testType, setTestType] = useState('mcq');
  const [description, setDescription] = useState('');
  const [selectedAutomation, setSelectedAutomation] = useState('');
  
  // State for uploaded files
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Handle file selection
  const handleDatasetFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['.csv', '.json', '.txt', '.xlsx', '.xls', '.pdf', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadStatus(`Invalid file type. Please select: ${allowedTypes.join(', ')}`);
      return;
    }
    
    setDatasetFile(file);
    setUploadStatus(`Dataset file "${file.name}" selected`);
  };

  const handleTestFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['.csv', '.json', '.txt', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadStatus(`Invalid file type. Please select: ${allowedTypes.join(', ')}`);
      return;
    }
    
    setTestFile(file);
    setUploadStatus(`Test file "${file.name}" selected`);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!datasetFile) {
      setUploadStatus('Please select a dataset file before saving');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading dataset...');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('datasetName', datasetName);
      formData.append('testType', testType);
      formData.append('description', description);
      formData.append('datasetFile', datasetFile);
      
      if (testFile) {
        formData.append('testFile', testFile);
      }

      // Upload to your backend
      const response = await fetch('http://localhost:3002/datasets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      setUploadStatus('Dataset uploaded successfully!');
      
      // Reset form after successful upload
      setTimeout(() => {
        setDatasetName('');
        setDescription('');
        setDatasetFile(null);
        setTestFile(null);
        setUploadStatus('');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg text-app-text font-sans">
      <PageHeader title="Upload Dataset" subtitle="Upload and configure your dataset">
        <div className="flex items-center space-x-4">
          <button 
            type="button" 
            onClick={() => onNavigate('home')} 
            className="text-app-text-subtle hover:opacity-80"
          >
            <BackButtonIcon />
          </button>
          <button 
            type="submit" 
            form="dataset-form" 
            disabled={isUploading}
            className={`font-semibold py-2 px-4 rounded-lg transition-colors ${
              isUploading 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Save Dataset'}
          </button>
        </div>
      </PageHeader>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <form id="dataset-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Upload Status */}
          {uploadStatus && (
            <div className={`p-4 rounded-lg border ${
              uploadStatus.includes('successfully') 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : uploadStatus.includes('failed') || uploadStatus.includes('Please select')
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {uploadStatus}
            </div>
          )}

          {/* Dataset Configuration Card */}
          <div className="bg-app-bg-content rounded-xl border border-app-border p-6 hover:shadow-lg transition-all">
            <h2 className="text-2xl font-semibold text-app-text mb-6">Dataset Configuration</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Dataset Name" 
                  placeholder="My Dataset" 
                  value={datasetName} 
                  onChange={setDatasetName}
                />
                <SelectField 
                  label="Test Type" 
                  options={["Multiple Choice Questions (MCQ)", "Question & Answer"]} 
                  value={testType} 
                  onChange={setTestType} 
                />
              </div>
              <TextareaField 
                label="Description" 
                placeholder="Describe the purpose and scope of this dataset" 
                value={description} 
                onChange={setDescription} 
              />
            </div>
          </div>

          {/* File Uploads & Chat Panel */}
          <div className="bg-app-bg-content rounded-xl border border-app-border p-6 hover:shadow-lg transition-all flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-app-text mb-4">Upload Dataset File *</h2>
                <p className="block text-sm font-medium text-app-text mb-2">
                  Upload your dataset file (CSV, JSON, TXT, XLSX, etc.)
                </p>
                <FileUploadButton 
                  id="data-file-upload" 
                  onFileSelect={handleDatasetFileSelect}
                />
                {datasetFile && (
                  <div className="mt-2 text-sm text-app-text-muted">
                    Selected: {datasetFile.name} ({Math.round(datasetFile.size / 1024)}KB)
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold text-app-text mb-4">Upload Test File (Optional)</h2>
                <p className="block text-sm font-medium text-app-text mb-2">
                  Upload your test file for validation (CSV, JSON, TXT, etc.)
                </p>
                <FileUploadButton 
                  id="test-file-upload" 
                  onFileSelect={handleTestFileSelect}
                />
                {testFile && (
                  <div className="mt-2 text-sm text-app-text-muted">
                    Selected: {testFile.name} ({Math.round(testFile.size / 1024)}KB)
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full md:w-96">
              <ChatPanel />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default UploadDatasetPage;