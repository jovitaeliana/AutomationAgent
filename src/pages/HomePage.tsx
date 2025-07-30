import React from 'react';
import PageHeader from '../components/PageHeader';
import SelectionCard from '../components/SelectionCard';
import { AutomationIcon, RagIcon, FlowIcon, TestIcon } from '../components/Icons';
import RecentProjects from '../components/RecentProjects';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation' | 'deployment-status';

interface HomePageProps {
  onNavigate: (page: PageName) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg text-app-text font-sans">
      <PageHeader
        title="Automation Platform"
        subtitle="Build, deploy, and manage intelligent automations"
      />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center text-app-text">
            What would you like to create?
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="w-full sm:w-80">
              <SelectionCard
                icon={<AutomationIcon />}
                title="Create New Agent"
                description="Build automated workflows"
                onClick={() => onNavigate('configure')}
              />
            </div>
            <div className="w-full sm:w-80">
              <SelectionCard
                icon={<FlowIcon />}
                title="Create New Flow"
                description="Design visual workflow diagrams"
                onClick={() => onNavigate('agent-creation')}
              />
            </div>
            <div className="w-full sm:w-80"> 
              <SelectionCard
                icon={<TestIcon />}
                title="Upload Dataset"
                description="Upload and create test datasets"
                onClick={() => onNavigate('upload-dataset')}
              />
            </div>
          </div>
        </section>

        <RecentProjects onNavigate={onNavigate} />
      </main>
    </div>
  );
};

export default HomePage;