import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; 
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
}

const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose, steps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen && steps[currentStep]?.target) {
      const element = document.querySelector(steps[currentStep].target!) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        setElementRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
        console.warn(`Tour target not found: ${steps[currentStep].target}`);
    } else {
      setHighlightedElement(null);
    }
      setElementRect(null);
  }, [currentStep, isOpen, steps]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedElement(null);
      setCurrentStep(0);
      setElementRect(null);
    }
  }, [isOpen]);

  // Update element rect on window resize or scroll
  useEffect(() => {
    if (!highlightedElement) return;

    const updateRect = () => {
      if (highlightedElement) {
        setElementRect(highlightedElement.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [highlightedElement]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Execute action if defined for current step
      if (steps[currentStep]?.action) {
        steps[currentStep].action!();
        setElementRect(null);
      }
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
    localStorage.setItem('automationagent-tour-completed', 'true');
  };

  const completeTour = () => {
    onClose();
    localStorage.setItem('automationagent-tour-completed', 'true');
  };

  if (!isOpen) return null;

  const currentTourStep = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Overlay with spotlight effect */}
      {highlightedElement && elementRect ? (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <svg className="w-full h-full">
            <defs>
              <mask id="spotlight">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={elementRect.left - 8}
                  y={elementRect.top - 8}
                  width={elementRect.width + 16}
                  height={elementRect.height + 16}
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
        <div className="fixed inset-0 bg-black/30 z-40" />
      )}

      {/* Highlight border for targeted elements */}
      {highlightedElement && elementRect && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: elementRect.top - 8,
            left: elementRect.left - 8,
            width: elementRect.width + 16,
            height: elementRect.height + 16,
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
        style={getPositionStyles(currentTourStep, elementRect)}
      >
        {/* Content wrapper with proper overflow handling */}
        <div className="max-h-96 overflow-y-auto">
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
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {currentStep + 1} of {steps.length}
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
          <div className="text-gray-600 mb-6 text-sm leading-relaxed">
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
          </div>
        </div>
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

      <style>{`
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

const getPositionStyles = (step: TourStep, elementRect: DOMRect | null): React.CSSProperties => {
  if (!elementRect || step.position === 'center') {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  }

  const bubbleWidth = 384; // max-w-sm = 384px
  const bubbleHeight = 300; // Increased to accommodate more content

  switch (step.position) {
    case 'bottom':
      return {
        top: elementRect.bottom + 16,
        left: Math.max(16, Math.min(window.innerWidth - bubbleWidth - 16, elementRect.left + elementRect.width/2 - bubbleWidth/2))
      };
    case 'top':
      return {
        top: Math.max(16, elementRect.top - bubbleHeight - 16),
        left: Math.max(16, Math.min(window.innerWidth - bubbleWidth - 16, elementRect.left + elementRect.width/2 - bubbleWidth/2))
      };
    case 'left':
      return {
        top: Math.max(16, Math.min(window.innerHeight - bubbleHeight - 16, elementRect.top + elementRect.height/2 - bubbleHeight/2)),
        left: Math.max(16, elementRect.left - bubbleWidth - 16)
      };
    case 'right':
      return {
        top: Math.max(16, Math.min(window.innerHeight - bubbleHeight - 16, elementRect.top + elementRect.height/2 - bubbleHeight/2)),
        left: Math.min(window.innerWidth - bubbleWidth - 16, elementRect.right + 16)
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
