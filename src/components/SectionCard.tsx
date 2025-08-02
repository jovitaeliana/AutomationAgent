import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  'data-tour'?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, className = '', 'data-tour': dataTour }) => {
  return (
    <div 
      className={`bg-app-bg-content rounded-xl border border-app-border p-6 hover:shadow-lg transition-all duration-300 ${className}`}
      data-tour={dataTour}
    >
      <h2 className="text-2xl font-semibold text-app-text mb-6">{title}</h2>
      {children}
    </div>
  );
};

export default SectionCard;