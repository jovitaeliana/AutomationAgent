import React from 'react';

interface PresetCardProps {
  emoji: string;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ emoji, title, description, isSelected, onClick }) => {
  // Dynamically set classes based on whether the card is selected
  const borderClass = isSelected ? 'border-app-border-highlight' : 'border-app-border';

  return (
    <div
      onClick={onClick}
      className={`bg-app-bg-content rounded-xl border p-6 cursor-pointer group hover:border-app-border-highlight transition-all duration-300 ${borderClass}`}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary-hover transition-colors">
          <span className="text-2xl">{emoji}</span>
        </div>
        <h3 className="text-lg font-semibold text-app-text mb-2">{title}</h3>
        <p className="text-sm text-app-text-subtle">{description}</p>
      </div>
    </div>
  );
};

export default PresetCard;