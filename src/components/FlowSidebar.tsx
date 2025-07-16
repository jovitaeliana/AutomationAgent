import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';

// --- Type Definitions (Now Exported) ---
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

interface FlowSidebarProps {
  nodes: NodeCategory[];
  isLoading: boolean;
  error: string | null;
}

export const ItemTypes = {
  NODE: 'node',
};

// --- Draggable Node Item Component ---
const DraggableNodeItem: React.FC<{ item: NodeItem; }> = ({ item }) => {
  const ref = useRef<HTMLDivElement>(null);
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
      className={`bg-app-bg-highlight p-3 rounded-lg border border-app-border cursor-grab hover:bg-secondary-hover hover:border-primary transition-colors ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <p className="font-semibold text-sm text-app-text">{item.icon} {item.title}</p>
      <p className="text-xs text-app-text-subtle">{item.description}</p>
    </div>
  );
};

// --- Main Sidebar Component ---
const FlowSidebar: React.FC<FlowSidebarProps> = ({ nodes, isLoading, error }) => {
  return (
    <aside className="w-80 flex-shrink-0 flex flex-col p-4 space-y-4 bg-app-bg-content border-r border-app-border">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg bg-primary">F</div>
        <h2 className="font-bold text-app-text">Flow Components</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4">
        {isLoading && <p className="text-app-text-subtle">Loading nodes...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!isLoading && !error && (
          nodes.map(nodeCategory => (
            <div key={nodeCategory.category}>
              <h3 className="text-sm font-semibold text-app-text mb-2 uppercase tracking-wider">
                {nodeCategory.category}
              </h3>
              <div className="space-y-2">
                {nodeCategory.items.map(item => (
                  <DraggableNodeItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default FlowSidebar;