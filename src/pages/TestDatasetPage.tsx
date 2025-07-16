import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { InputField, SelectField, TextareaField } from '../components/FormField';
import ChatPanel from '../components/ChatPanel';
import FileUploadButton from '../components/FileUploadButton';
import { BackButtonIcon } from '../components/Icons';

const TestDatasetPage: React.FC = () => {
  // State for all the form fields on this page
  const [datasetName, setDatasetName] = useState('');
  const [testType, setTestType] = useState('mcq');
  const [description, setDescription] = useState('');
  const [selectedAutomation, setSelectedAutomation] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg text-app-text font-sans">
      <PageHeader title="Create Test Dataset" subtitle="Upload and configure your test data">
        <div className="flex items-center space-x-4">
          <button type="button" className="text-app-text-subtle hover:opacity-80">
            <BackButtonIcon />
          </button>
          <button type="submit" form="test-dataset-form" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover">
            Save Dataset
          </button>
        </div>
      </PageHeader>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <form id="test-dataset-form" onSubmit={(e) => e.preventDefault()} className="space-y-8">
          {/* Dataset Configuration Card */}
          <div className="bg-app-bg-content rounded-xl border border-app-border p-6 hover:shadow-lg transition-all">
            <h2 className="text-2xl font-semibold text-app-text mb-6">Dataset Configuration</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Dataset Name" placeholder="My Test Dataset" value={datasetName} onChange={setDatasetName} />
                <SelectField label="Test Type" options={["Multiple Choice Questions (MCQ)", "Question & Answer"]} value={testType} onChange={setTestType} />
              </div>
              <TextareaField label="Description" placeholder="Describe the purpose and scope of this test dataset" value={description} onChange={setDescription} />
            </div>
          </div>

          {/* Uploads & Chat Panel */}
          <div className="bg-app-bg-content rounded-xl border border-app-border p-6 hover:shadow-lg transition-all flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-app-text mb-4">Upload Data Files</h2>
                <p className="block text-sm font-medium text-app-text mb-2">Upload your data file (CSV, JSON, TXT, etc.)</p>
                <FileUploadButton id="data-file-upload" onFileSelect={() => {}} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-app-text mb-4">Upload Test Files</h2>
                <p className="block text-sm font-medium text-app-text mb-2">Upload your test file (CSV, JSON, TXT, etc.)</p>
                <FileUploadButton id="test-file-upload" onFileSelect={() => {}} />
              </div>
            </div>
            <div className="w-full md:w-96">
              <ChatPanel />
            </div>
          </div>
          
          {/* Run Test & Stats */}
          <div className="bg-app-bg-content rounded-xl border border-app-border p-6 hover:shadow-lg transition-all">
            <h2 className="text-2xl font-semibold text-app-text mb-6">Test Your Dataset</h2>
            <div className="space-y-6">
              <div className="bg-app-bg-highlight rounded-lg p-6">
                <h3 className="text-lg font-semibold text-app-text mb-4">Run AI Against Your Dataset</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <SelectField
                      label="Select Automation"
                      options={["Singapore Weather Automation", "Talking Avatar Automation", "Car Assistant Automation", "Companies T&C RAG Automation"]}
                      value={selectedAutomation}
                      onChange={setSelectedAutomation}
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="button" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover w-full font-semibold">
                      🚀 Run Test
                    </button>
                  </div>
                </div>
                <div className="bg-app-bg-content border border-app-border rounded-lg p-4 min-h-24">
                  <p className="text-app-text-subtle text-sm">Test results will appear here...</p>
                </div>
              </div>
              <div className="bg-app-bg-highlight rounded-lg p-6">
                <h3 className="text-lg font-semibold text-app-text mb-4">Dataset Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div><p className="text-2xl font-bold text-primary">0</p><p className="text-sm text-app-text-subtle">Total Entries</p></div>
                  <div><p className="text-2xl font-bold text-primary">0%</p><p className="text-sm text-app-text-subtle">Accuracy</p></div>
                  <div><p className="text-2xl font-bold text-primary">0</p><p className="text-sm text-app-text-subtle">Tests Run</p></div>
                  <div><p className="text-2xl font-bold text-primary">0</p><p className="text-sm text-app-text-subtle">Automations Tested</p></div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TestDatasetPage;