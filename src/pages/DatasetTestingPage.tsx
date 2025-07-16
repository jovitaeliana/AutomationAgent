// src/pages/DatasetTestingPage.tsx
import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { SelectField } from '../components/FormField';
import FileUploadButton from '../components/FileUploadButton';
import { BackButtonIcon } from '../components/Icons';

const automationOptions = [
  "Singapore Weather Automation",
  "Talking Avatar Automation",
  "Car Assistant Automation",
  "Companies T&C RAG Automation",
  "Document Q&A RAG",
  "Contract Analysis RAG",
  "Customer Support RAG"
];

const DatasetTestingPage: React.FC = () => {
  // State for the form fields
  const [selectedAutomation, setSelectedAutomation] = useState<string>('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg text-app-text font-sans">
      <PageHeader title="Test a Dataset" subtitle="Upload and test your dataset against automations">
        <div className="flex items-center space-x-4">
          <button className="text-app-text-subtle hover:opacity-80">
            <BackButtonIcon />
          </button>
          <button className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover">
            Back to Home
          </button>
        </div>
      </PageHeader>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-8">
        {/* Upload Card */}
        <div className="border-2 border-app-border rounded-xl p-6 bg-app-bg-content hover:border-app-border-highlight transition-colors">
          <h2 className="text-2xl font-semibold mb-4 text-app-text">Upload Test Set</h2>
          <p className="block text-sm font-medium mb-2 text-app-text">Select your test set file (CSV, JSON, TXT, etc.)</p>
          <FileUploadButton id="dataset-file-upload" onFileSelect={() => {}} />
          <p className="text-xs mt-2 text-app-text-subtle">Supported formats: CSV, JSON, TXT</p>
        </div>

        {/* Select Automation Card */}
        <div className="border-2 border-app-border rounded-xl p-6 bg-app-bg-content hover:border-app-border-highlight transition-colors">
          <h2 className="text-2xl font-semibold mb-4 text-app-text">Select Automation or RAG Model</h2>
          <SelectField 
            label="Choose what to test your dataset against:"
            options={automationOptions}
            value={selectedAutomation}
            onChange={setSelectedAutomation}
          />
        </div>

        {/* Run Test Card */}
        <div className="border-2 border-app-border rounded-xl p-6 bg-app-bg-content hover:border-app-border-highlight transition-colors">
          <h2 className="text-2xl font-semibold mb-4 text-app-text">Run Test</h2>
          <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover w-full mb-4 font-semibold">
            🚀 Run Test
          </button>
          <div className="rounded-lg p-4 min-h-24 bg-app-bg-highlight border border-app-border">
            <p className="text-sm text-app-text-subtle">Test results will appear here...</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DatasetTestingPage;