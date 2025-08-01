import React, { useState } from 'react';
import StepIndicator from '../components/StepIndicator';
import TemplateSelectionCard from '../components/TemplateSelectionCard';
import { ChatbotIcon, AvatarIcon } from '../components/Icons';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'flow-creation' | 'deployment-status';

interface AppChoicePageProps {
  onNavigate: (page: PageName) => void;
}

// Data for the template selection cards
const templates = [
  {
    id: 'chatbot',
    icon: <ChatbotIcon />,
    title: 'Chatbot Template',
    description: 'A classic chat interface. Ideal for Q&A, customer support, and conversational AI agents.'
  },
  {
    id: 'avatar',
    icon: <AvatarIcon />,
    title: 'Avatar Interaction Template',
    description: 'Engage users with a talking avatar. Best for interactive storytelling or virtual assistants.'
  }
];

const AppChoicePage: React.FC<AppChoicePageProps> = ({ onNavigate }) => {
  // State to track which template is selected, defaulting to 'chatbot'
  const [selectedTemplate, setSelectedTemplate] = useState<string>('chatbot');

  return (
    <div className="bg-app-bg-content text-app-text font-sans">
      <main className="w-[80%] max-w-6xl mx-auto my-10 p-10 rounded-xl border border-app-border shadow-lg">
        {/* Main two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          
          {/* Left Column: Step Indicator */}
          <div className="md:col-span-2">
            <StepIndicator currentStep={3} />
          </div>

          {/* Right Column: Selections */}
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold text-app-text mb-2">Choose an App Template</h2>
            <p className="text-app-text-subtle text-sm mb-6">
              Choose a pre-built template to instantly create a user interface for your agent. Each template provides a different user experience.
            </p>
            <div className="space-y-6">
              {templates.map((template) => (
                <TemplateSelectionCard
                  key={template.id}
                  {...template}
                  isSelected={selectedTemplate === template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-6 border-t border-app-border flex justify-end items-center space-x-4">
          <button
            onClick={() => onNavigate('flow-creation')}
            className="px-6 py-2 bg-secondary text-app-text font-semibold rounded-lg hover:bg-secondary-hover transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => onNavigate('deployment-status')}
            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
          >
            Finish & Deploy
          </button>
        </div>
      </main>
    </div>
  );
};

export default AppChoicePage;