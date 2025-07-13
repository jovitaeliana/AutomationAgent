import React from 'react';

// The interface needs to know about 'children'
interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <header className="bg-app-bg border-b border-app-border px-8 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Title and Subtitle Section */}
        <div>
          <h1 className="text-3xl font-bold text-app-text">{title}</h1>
          <p className="mt-2 text-app-text-subtle">{subtitle}</p>
        </div>
        
        {/* This will render the buttons passed to the component */}
        {children && <div>{children}</div>}
      </div>
    </header>
  );
};

export default PageHeader;