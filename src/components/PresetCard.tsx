import React from 'react';

interface PresetCardProps {
  id: string; // Add id prop
  emoji: string;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  onConfigure?: (presetId: string) => void; // Add optional configure handler
}

const PresetCard: React.FC<PresetCardProps> = ({ 
  id, emoji, title, description, isSelected, onClick, onConfigure 
}) => {
  // Dynamically set classes based on whether the card is selected
  const borderClass = isSelected ? 'border-app-border-highlight' : 'border-app-border';

  const handleCardClick = () => {
    onClick();
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card click from firing
    if (onConfigure) {
      onConfigure(id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-app-bg-content rounded-xl border p-6 cursor-pointer group hover:border-app-border-highlight transition-all duration-300 ${borderClass}`}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary-hover transition-colors">
          <span className="text-2xl">{emoji}</span>
        </div>
        <h3 className="text-lg font-semibold text-app-text mb-2">{title}</h3>
        <p className="text-sm text-app-text-subtle mb-4">{description}</p>
        
        {/* Add Configure button */}
        <div className="mt-4 flex flex-col space-y-2">
          <button
            type="button"
            onClick={handleCardClick}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              isSelected
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? 'Selected' : 'Select'}
          </button>
          
          {onConfigure && (
            <button
              type="button"
              onClick={handleConfigure}
              className="w-full py-2 px-4 rounded-lg font-medium text-blue-600 border border-blue-300 hover:bg-blue-50 transition-colors"
            >
              Configure
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresetCard;