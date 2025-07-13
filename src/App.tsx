// src/App.tsx
import React from 'react';
import PageHeader from './components/PageHeader';
import SelectionCard from './components/SelectionCard';
import { AutomationIcon, RagIcon, FlowIcon, TestIcon } from './components/Icons'; // We'll create this file next
import RecentProjects from './components/RecentProjects';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white text-blue-900 font-sans">
      <PageHeader
        title="Automation Platform"
        subtitle="Build, deploy, and manage intelligent automations"
      />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center text-blue-900">
            What would you like to create?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SelectionCard
              icon={<AutomationIcon />}
              title="Create New Automation"
              description="Build automated workflows and processes"
              onClick={() => (window.location.href = 'configure-agent.html')}
            />
            <SelectionCard
              icon={<RagIcon />}
              title="Build RAG Pipeline"
              description="Create knowledge retrieval systems"
              onClick={() => (window.location.href = 'test-dataset.html')}
            />
            <SelectionCard
              icon={<FlowIcon />}
              title="Create New Flow"
              description="Design visual workflow diagrams"
              onClick={() => (window.location.href = 'agentcreation.html')}
            />
            <SelectionCard
              icon={<TestIcon />}
              title="Test Dataset"
              description="Validate and test your data"
              onClick={() => (window.location.href = 'Dataset-Testing.html')}
            />
          </div>
        </section>

        <RecentProjects />
      </main>
    </div>
  );
}

export default App;