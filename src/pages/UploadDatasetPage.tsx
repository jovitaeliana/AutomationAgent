import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { InputField, SelectField, TextareaField } from '../components/FormField';
import FileUploadButton from '../components/FileUploadButton';
import { BackButtonIcon } from '../components/Icons';
import { datasetService } from '../services/api';
import type { Dataset } from '../lib/supabase';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation';

interface UploadDatasetPageProps {
  onNavigate: (page: PageName) => void;
}

// Alert types
type AlertType = 'success' | 'error' | 'info' | 'warning';

interface Alert {
  id: string;
  type: AlertType;
  message: string;
}

const UploadDatasetPage: React.FC<UploadDatasetPageProps> = ({ onNavigate }) => {
  // State for all the form fields on this page
  const [datasetName, setDatasetName] = useState('');
  const [testType, setTestType] = useState('mcq');
  const [description, setDescription] = useState('');
  const [selectedAutomation, setSelectedAutomation] = useState('');
  
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [generatedMCQ, setGeneratedMCQ] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [existingDatasets, setExistingDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  
  // State for form reset key to force component re-render
  const [formResetKey, setFormResetKey] = useState(0);
  
  // Alert system
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY!

  // Alert functions
  const addAlert = (type: AlertType, message: string) => {
    const id = Date.now().toString();
    setAlerts(prev => [...prev, { id, type, message }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeAlert(id);
    }, 5000);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const fetchDatasets = async () => {
    try {
      setIsLoadingDatasets(true);
      const datasets = await datasetService.getAll();
      setExistingDatasets(datasets);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      addAlert('error', 'Failed to load datasets');
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDeleteDataset = async (datasetId: string) => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }

    try {
      await datasetService.delete(datasetId);
      addAlert('success', 'Dataset deleted successfully!');
      fetchDatasets(); // Refresh the list
    } catch (error) {
      console.error('Delete error:', error);
      addAlert('error', `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle file selection
  const handleDatasetFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['.csv', '.json', '.txt', '.xlsx', '.xls', '.pdf', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      addAlert('error', `Invalid file type. Please select: ${allowedTypes.join(', ')}`);
      return;
    }
    
    setDatasetFile(file);
    addAlert('info', `Dataset file "${file.name}" selected`);
  };

  const handleTestFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['.csv', '.json', '.txt', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      addAlert('error', `Invalid file type. Please select: ${allowedTypes.join(', ')}`);
      return;
    }
    
    setTestFile(file);
    addAlert('info', `Test file "${file.name}" selected`);
  };

  const handleGenerateMCQ = async () => {
    if (!datasetFile) {
      addAlert('warning', 'Please select a dataset file first');
      return;
    }
    
    setIsGenerating(true);
    addAlert('info', 'Generating MCQ questions...');
    
    try {
      console.log('Sending request to generate MCQ...');
      
      const result = await datasetService.generateMCQ(datasetFile, GEMINI_API_KEY);
      
      console.log('MCQ generation result:', result);
      
      setGeneratedMCQ(result.questions);
      addAlert('success', `Generated ${result.questions.length} MCQ questions successfully!`);
      
    } catch (error) {
      console.error('MCQ generation error:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        addAlert('error', 'Connection failed: Please check your internet connection');
      } else {
        addAlert('error', `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!datasetName.trim()) {
      addAlert('warning', 'Please enter a dataset name');
      return;
    }
    
    if (generatedMCQ.length === 0) {
      addAlert('warning', 'Please generate MCQ questions first');
      return;
    }

    setIsUploading(true);
    addAlert('info', 'Saving dataset...');

    try {
      await datasetService.create({
        name: datasetName,
        type: testType,
        description,
        questions: generatedMCQ
      });

      addAlert('success', 'Dataset saved successfully!');
      fetchDatasets();
      
      // Reset form - clear all form data and file selections
      setDatasetName('');
      setDescription('');
      setDatasetFile(null);
      setTestFile(null);
      setGeneratedMCQ([]);
      
      // Force FileUploadButton components to reset by changing the key
      setFormResetKey(prev => prev + 1);

    } catch (error) {
      console.error('Save error:', error);
      addAlert('error', `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
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
        </div>
      </PageHeader>

      {/* Fixed Alert System */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-2 font-medium shadow-lg transform transition-all duration-300 ease-in-out ${getAlertStyles(alert.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0">{getAlertIcon(alert.type)}</span>
                <p className="text-sm">{alert.message}</p>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="ml-2 text-lg leading-none opacity-70 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-8 py-12 pb-32">
        <form id="dataset-form" onSubmit={handleSubmit} className="space-y-8">
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

          {/* File Uploads & MCQ Generation */}
          <div className="bg-app-bg-content rounded-xl border border-app-border p-6 hover:shadow-lg transition-all flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-app-text mb-4">Upload Dataset File *</h2>
                <p className="block text-sm font-medium text-app-text mb-2">
                  Upload your dataset file (CSV, JSON, TXT, XLSX, etc.)
                </p>
                <FileUploadButton 
                  key={`data-file-${formResetKey}`}
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
                <button
                  type="button"
                  onClick={handleGenerateMCQ}
                  disabled={isGenerating || !datasetFile}
                  className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
                    isGenerating || !datasetFile
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isGenerating ? '🤖 Generating MCQ...' : '🧠 Generate MCQ with AI'}
                </button>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold text-app-text mb-4">Upload Test File (Optional)</h2>
                <p className="block text-sm font-medium text-app-text mb-2">
                  Upload your test file for validation (CSV, JSON, TXT, etc.)
                </p>
                <FileUploadButton 
                  key={`test-file-${formResetKey}`}
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
            
            {/* Generated MCQ Panel on the Right */}
            <div className="w-full md:w-96">
              {generatedMCQ.length > 0 ? (
                <div className="bg-app-bg-highlight rounded-lg p-4 h-full">
                  <h2 className="text-xl font-semibold text-app-text mb-4">Generated Questions ({generatedMCQ.length})</h2>
                  <div className="overflow-y-auto max-h-130">
                    {generatedMCQ.map((q, index) => (
                      <div key={index} className="mb-4 p-3 bg-white rounded border">
                        <p className="font-medium text-sm">{index + 1}. {q.question}</p>
                        <div className="mt-2 text-xs text-gray-600">
                          {q.options?.map((opt: string, i: number) => (
                            <div key={i} className={opt === q.correctAnswer ? 'font-bold text-green-600' : ''}>
                              • {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-app-bg-highlight rounded-lg p-6 h-full flex items-center justify-center">
                  <div className="text-center text-app-text-muted">
                    <div className="text-4xl mb-4">🤖</div>
                    <p className="text-lg font-medium mb-2">AI-Generated Questions</p>
                    <p className="text-sm">Upload a dataset file and click "Generate MCQ with AI" to see questions appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Existing Datasets Section */}
          <div className="bg-app-bg-content rounded-xl border border-app-border p-6 hover:shadow-lg transition-all">
            <h2 className="text-2xl font-semibold text-app-text mb-6">Existing Datasets</h2>
            
            {isLoadingDatasets ? (
              <div className="text-center py-8">
                <div className="text-app-text-muted">Loading datasets...</div>
              </div>
            ) : existingDatasets.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-app-text-muted">No datasets found</p>
                <p className="text-sm text-app-text-subtle mt-2">Create your first dataset above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {existingDatasets.map((dataset: Dataset) => (
                  <div key={dataset.id} className="border border-app-border rounded-lg p-4 hover:bg-app-bg-highlight transition-colors">
                    <div className="flex flex-wrap md:flex-nowrap items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-app-text">{dataset.name}</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                            {dataset.type.toUpperCase()}
                          </span>
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                            {dataset.total_questions} questions
                          </span>
                        </div>
                        
                        {dataset.description && (
                          <p className="text-app-text-muted text-sm mb-3">{dataset.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-app-text-subtle">
                          <span>Created: {new Date(dataset.created_at).toLocaleDateString()}</span>
                          <span>ID: {dataset.id}</span>
                        </div>
                        
                        {dataset.questions && dataset.questions.length > 0 && (
                          <div className="mt-3">
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                                View All Questions ({dataset.questions.length})
                              </summary>
                              <div className="mt-2 pl-4 border-l-2 border-blue-200 max-h-60 overflow-y-auto bg-gray-50 rounded p-3 w-282">
                                {dataset.questions.map((q: any, index: number) => (
                                  <div key={index} className="mb-3 pb-3 border-b border-gray-200 last:border-b-0 text-sm">
                                    <p className="font-medium text-app-text mb-2">{index + 1}. {q.question}</p>
                                    {q.options && (
                                      <div className="ml-4 space-y-1">
                                        {q.options.map((option: string, optIndex: number) => (
                                          <div 
                                            key={optIndex} 
                                            className={`text-xs ${
                                              option === q.correctAnswer 
                                                ? 'text-green-700 font-semibold bg-green-100 px-2 py-1 rounded' 
                                                : 'text-gray-600'
                                            }`}
                                          >
                                            {String.fromCharCode(65 + optIndex)}. {option} {option === q.correctAnswer && '✓'}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {q.explanation && (
                                      <div className="mt-2 ml-4 text-xs text-gray-500 italic">
                                        💡 {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          type="button"  
                          onClick={() => handleDeleteDataset(dataset.id)}
                          className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </main>

      {/* Fixed Bottom Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex justify-end">
          <button 
            type="submit" 
            form="dataset-form" 
            disabled={isUploading || generatedMCQ.length === 0}
            className={`font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg ${
              isUploading || generatedMCQ.length === 0
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-hover hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Dataset'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDatasetPage;