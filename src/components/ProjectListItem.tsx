import React from 'react';

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span className="text-xs font-medium bg-secondary text-app-text px-3 py-1 rounded-full">
    {label}
  </span>
);

interface ProjectListItemProps {
  title: string;
  description: string;
  tags: string[];
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ title, description, tags }) => {
  return (
    <div className="p-6 hover:bg-app-bg-highlight transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3 className="font-semibold text-app-text">{title}</h3>
          <p className="text-sm text-app-text-subtle mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-3">
          {tags.map((tag) => <Tag key={tag} label={tag} />)}
          <button className="text-sm text-app-text-subtle font-semibold py-2 px-4 border border-app-border rounded-lg hover:bg-secondary-hover transition-colors">
            Configure
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectListItem;