import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SelectionCard from '../components/SelectionCard';
import { AutomationIcon, RagIcon, FlowIcon, TestIcon } from '../components/Icons';
import RecentProjects from '../components/RecentProjects';
import GuidedTour, { type TourStep } from '../components/GuidedTour';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'flow-creation' | 'deployment-status';

interface HomePageProps {
  onNavigate: (page: PageName) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [showTour, setShowTour] = useState(false);

  const homePageTourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AutomationAgent! 🎉',
      content: 'Let\'s take a quick tour to get you started with creating and testing AI agents.',
      position: 'center'
    },
    {
      id: 'create-agent',
      title: 'Step 1: Create an Agent',
      content: 'Start by creating your first AI agent. Click here to configure an agent with specific capabilities like weather, search, or custom RAG.',
      target: '[data-tour="create-agent"]',
      position: 'bottom'
    },
    {
      id: 'create-dataset',
      title: 'Step 2: Create Test Dataset (Optional)',
      content: 'Upload test datasets to evaluate your agent\'s performance. This helps ensure your agent responds correctly to various questions.',
      target: '[data-tour="create-dataset"]',
      position: 'bottom'
    },
    {
      id: 'create-flow',
      title: 'Step 3: Create a Flow',
      content: 'Build flows to connect your agents with datasets and knowledge bases. This is where you design your automation workflow.',
      target: '[data-tour="create-flow"]',
      position: 'bottom'
    },
    {
      id: 'recent-projects',
      title: 'Step 4: Access Your Work',
      content: 'Find all your created agents, datasets, and flows in the Recent Projects section. You can quickly access and modify your previous work.',
      target: '[data-tour="recent-projects"]',
      position: 'top'
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🚀',
      content: 'You now know the basics of AutomationAgent. Start by creating your first agent and explore the powerful features available.',
      position: 'center'
    }
  ];

  useEffect(() => {
    // Check if user has completed the tour
    const tourCompleted = localStorage.getItem('automationagent-tour-completed');
    if (!tourCompleted) {
      // Show tour after a short delay to let the page load
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg text-app-text font-sans">
      <PageHeader
        title="Automation Platform"
        subtitle="Build, deploy, and manage intelligent automations"
      />

      {/* Help/Tour Button */}
      <button
        onClick={() => setShowTour(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
        title="Take a guided tour"
      >
        <HelpCircle size={24} />
      </button>
      <main className="max-w-7xl mx-auto px-8 py-12">
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center text-app-text">
            What would you like to create?
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="w-full sm:w-80" data-tour="create-agent">
              <SelectionCard
                icon={<AutomationIcon />}
                title="Create New Agent"
                description="Build automated workflows"
                onClick={() => onNavigate('configure')}
              />
            </div>
            <div className="w-full sm:w-80" data-tour="create-dataset">
              <SelectionCard
                icon={<TestIcon />}
                title="Create Test Dataset"
                description="Upload and create test datasets"
                onClick={() => onNavigate('upload-dataset')}
              />
            </div>
            <div className="w-full sm:w-80" data-tour="create-flow">
              <SelectionCard
                icon={<FlowIcon />}
                title="Create New Flow"
                description="Design visual workflow diagrams"
                onClick={() => onNavigate('flow-creation')}
              />
            </div>
          </div>
        </section>

        <div data-tour="recent-projects">
          <RecentProjects onNavigate={onNavigate} />
        </div>
      </main>

      {/* Guided Tour */}
      <GuidedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        steps={homePageTourSteps}
      />
    </div>
  );
};

export default HomePage;