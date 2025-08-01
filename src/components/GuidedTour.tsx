import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation' | 'deployment-status';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageName) => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const tourSteps: TourStep[] = [
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
    if (isOpen && tourSteps[currentStep]?.target) {
      const element = document.querySelector(tourSteps[currentStep].target!) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedElement(null);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    onClose();
    // Mark tour as completed in localStorage
    localStorage.setItem('automationagent-tour-completed', 'true');
  };

  const completeTour = () => {
    onClose();
    localStorage.setItem('automationagent-tour-completed', 'true');
  };

  if (!isOpen) return null;

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Overlay with spotlight effect */}
      {highlightedElement ? (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Create a spotlight effect by using multiple divs to cover everything except the highlighted area */}
          <svg className="w-full h-full">
            <defs>
              <mask id="spotlight">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={highlightedElement.offsetLeft - 8}
                  y={highlightedElement.offsetTop - 8}
                  width={highlightedElement.offsetWidth + 16}
                  height={highlightedElement.offsetHeight + 16}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.5)"
              mask="url(#spotlight)"
            />
          </svg>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black/20 z-40" />
      )}

      {/* Highlight border for targeted elements */}
      {highlightedElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: highlightedElement.offsetTop - 8,
            left: highlightedElement.offsetLeft - 8,
            width: highlightedElement.offsetWidth + 16,
            height: highlightedElement.offsetHeight + 16,
            border: '3px solid #3B82F6',
            borderRadius: '8px',
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
            animation: 'pulse 2s infinite'
          }}
        />
      )}

      {/* Tour bubble */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm"
        style={getPositionStyles(currentTourStep, highlightedElement)}
      >
        {/* Close button */}
        <button
          onClick={skipTour}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {currentStep + 1} of {tourSteps.length}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {currentTourStep.title}
        </h3>
        <p className="text-gray-600 mb-6">
          {currentTourStep.content}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm ${
              isFirstStep
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>

          <button
            onClick={skipTour}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip Tour
          </button>

          <button
            onClick={isLastStep ? completeTour : nextStep}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <span>{isLastStep ? 'Get Started' : 'Next'}</span>
            {!isLastStep && <ArrowRight size={16} />}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
};

// Helper function to calculate position styles
const getPositionStyles = (step: TourStep, element: HTMLElement | null): React.CSSProperties => {
  if (!element || step.position === 'center') {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  }

  const rect = element.getBoundingClientRect();
  const bubbleWidth = 384; // max-w-sm is roughly 384px
  const bubbleHeight = 200; // approximate height

  switch (step.position) {
    case 'bottom':
      return {
        top: rect.bottom + 16,
        left: Math.max(16, rect.left + rect.width/2 - bubbleWidth/2)
      };
    case 'top':
      return {
        top: rect.top - bubbleHeight - 16,
        left: Math.max(16, rect.left + rect.width/2 - bubbleWidth/2)
      };
    case 'left':
      return {
        top: rect.top + rect.height/2 - bubbleHeight/2,
        left: rect.left - bubbleWidth - 16
      };
    case 'right':
      return {
        top: rect.top + rect.height/2 - bubbleHeight/2,
        left: rect.right + 16
      };
    default:
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
  }
};

export default GuidedTour;
