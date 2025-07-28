import React, { useState } from 'react';
import { useDrag } from 'react-dnd';

// Type Definitions
export interface NodeItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}
export interface NodeCategory {
  category: string;
  items: NodeItem[];
}
export const ItemTypes = {
  NODE: 'node',
};

// Draggable Item Sub-Component
const DraggableNodeItem: React.FC<{ item: NodeItem }> = ({ item }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.NODE,
    item: { ...item },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  drag(ref);

  return (
    <div
      ref={ref}
      className={`bg-white p-3 rounded-lg border border-app-border cursor-grab hover:bg-secondary-hover hover:border-primary transition-colors ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <p className="font-semibold text-sm text-app-text">{item.icon} {item.title}</p>
      <p className="text-xs text-app-text-subtle">{item.description}</p>
    </div>
  );
};

// Main Sidebar Component
interface FlowSidebarProps {
  nodes: NodeCategory[];
  isLoading: boolean;
  error: string | null;
}
const FlowSidebar: React.FC<FlowSidebarProps> = ({ nodes, isLoading, error }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`flex-shrink-0 flex flex-col bg-white transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-80'}`}>
      {isCollapsed ? (
        <div className="flex items-center justify-center py-4 h-full">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg bg-primary hover:bg-primary-hover transition-colors ml-3 mr-2"
            title="Expand Flow Components"
          >
            F
          </button>
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-6 h-6 text-app-text-subtle hover:text-app-text transition-colors"
            title="Expand Flow Components"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between p-4 border-b border-app-border flex-shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg bg-primary flex-shrink-0">F</div>
              <h2 className="font-bold text-app-text truncate">Flow Components</h2>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="w-6 h-6 text-app-text-subtle hover:text-app-text transition-colors flex-shrink-0"
              title="Collapse Flow Components"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-4 p-4">
              {isLoading && <p className="text-app-text-subtle">Loading nodes...</p>}
              {error && <p className="text-red-500">Error: {error}</p>}
              {!isLoading && !error && (
                nodes.map(nodeCategory => (
                  <div key={nodeCategory.category}>
                    <h3 className="text-sm font-semibold text-app-text mb-2 uppercase tracking-wider">{nodeCategory.category}</h3>
                    <div className="space-y-2">
                      {nodeCategory.items.map(item => <DraggableNodeItem key={item.id} item={item} />)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
export default FlowSidebar;