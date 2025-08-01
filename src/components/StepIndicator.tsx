import React from 'react';

// A sub-component for a single step
const Step: React.FC<{ title: string; isActive?: boolean }> = ({ title, isActive = false }) => {
  const activeClasses = "bg-app-bg-highlight border-l-4 border-primary text-primary";
  const inactiveClasses = "bg-gray-50 border border-gray-200 text-app-text-subtle";

  return (
    <div className={`p-4 rounded-r-lg ${isActive ? activeClasses : inactiveClasses}`}>
      <p className="font-semibold">{title}</p>
    </div>
  );
};


interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, title: '1. CREATE AGENT' },
    { number: 2, title: '2. CREATE FLOW' },
    { number: 3, title: '3. CREATE UI' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-app-text mb-6">Deploy Agents</h2>
      <div className="space-y-3">
        {steps.map(step => (
          <Step 
            key={step.number} 
            title={step.title} 
            isActive={currentStep === step.number}
          />
        ))}
      </div>

    </div>
  );
};

export default StepIndicator;