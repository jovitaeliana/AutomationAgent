import React from 'react';

interface SelectionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ icon, title, description, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-app-bg-content rounded-xl p-6 cursor-pointer group border-2 border-app-border hover:border-app-border-highlight hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-app-bg-highlight text-app-text-subtle rounded-full flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-app-text mb-2">{title}</h3>
        <p className="text-sm text-app-text-subtle">{description}</p>
      </div>
    </div>
  );
};

export default SelectionCard;