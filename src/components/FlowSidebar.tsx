import React from 'react';

// Define the types for our data structure
interface NodeItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface NodeCategory {
  category: string;
  items: NodeItem[];
}

interface FlowSidebarProps {
  nodes: NodeCategory[];
}

// This is a sub-component for a single item in the sidebar
const DraggableNodeItem: React.FC<NodeItem> = ({ icon, title, description }) => (
  <div className="bg-app-bg-highlight p-3 rounded-lg border border-app-border cursor-grab hover:bg-secondary-hover hover:border-primary transition-colors">
    <p className="font-semibold text-sm text-app-text">{icon} {title}</p>
    <p className="text-xs text-app-text-subtle">{description}</p>
  </div>
);

const FlowSidebar: React.FC<FlowSidebarProps> = ({ nodes }) => {
  return (
    <aside className="w-80 flex flex-col p-4 space-y-4 bg-app-bg-content border-r border-app-border">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg bg-primary">F</div>
        <h2 className="font-bold text-app-text">Flow</h2>
      </div>
      
      <div className="space-y-4">
        {/* Map over the node categories from props */}
        {nodes.map(nodeCategory => (
          <div key={nodeCategory.category}>
            <h3 className="text-sm font-semibold text-app-text mb-2 uppercase tracking-wider">
              {nodeCategory.category}
            </h3>
            <div className="space-y-2">
              {/* Map over the items within each category */}
              {nodeCategory.items.map(item => (
                <DraggableNodeItem key={item.id} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default FlowSidebar;