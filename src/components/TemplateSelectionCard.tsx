import React from 'react';

interface TemplateSelectionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const TemplateSelectionCard: React.FC<TemplateSelectionCardProps> = ({ icon, title, description, isSelected, onClick }) => {
  // Dynamically set classes based on the selection state
  const selectedClasses = "border-primary ring-2 ring-primary/30 -translate-y-0.5";
  const hoverClasses = "hover:border-gray-400 hover:-translate-y-0.5";

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-lg cursor-pointer flex items-center space-x-6 border-2 transition-all duration-200 ${isSelected ? selectedClasses : `${hoverClasses} border-app-border`}`}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-semibold text-app-text">{title}</h4>
        <p className="text-sm text-app-text-subtle mt-1">{description}</p>
      </div>
    </div>
  );
};

export default TemplateSelectionCard;