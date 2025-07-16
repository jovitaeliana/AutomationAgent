import React, { useEffect, useRef } from 'react';

// Defines the data structure for a node
export interface FlowNodeData {
  id: string;
  title: string;
  type: string;
  position: { x: number; y: number };
}

// Defines the props the component receives
interface FlowNodeProps {
  node: FlowNodeData;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent, nodeId: string) => void;
  onMove: (nodeId: string, position: { x: number; y: number }) => void;
  onConfigure: (nodeId: string) => void;
}

const FlowNode: React.FC<FlowNodeProps> = ({ node, isSelected, onSelect, onMove, onConfigure }) => {
  const selectedClasses = "border-primary ring-2 ring-primary/30";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodeEl = ref.current;
    if (!nodeEl) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Don't drag if clicking on a button
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      onSelect(e as unknown as React.MouseEvent, node.id);

      const startPos = { x: e.clientX, y: e.clientY };
      const startNodePos = { ...node.position };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startPos.x;
        const dy = moveEvent.clientY - startPos.y;
        onMove(node.id, { x: startNodePos.x + dx, y: startNodePos.y + dy });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    nodeEl.addEventListener('mousedown', handleMouseDown);
    return () => nodeEl.removeEventListener('mousedown', handleMouseDown);
  }, [node.id, node.position, onMove, onSelect]);


  return (
    <div
      ref={ref}
      className={`absolute bg-app-bg-content border-2 rounded-lg shadow-md w-48 cursor-grab ${isSelected ? selectedClasses : 'border-app-border'}`}
      style={{ left: node.position.x, top: node.position.y }}
    >
      <div className="p-3">
        <p className="font-bold text-sm text-app-text">{node.title}</p>
        <p className="text-xs text-app-text-subtle">{node.type}</p>
      </div>
      <div className="border-t border-app-border p-2 flex justify-center">
        <button onClick={() => onConfigure(node.id)} className="text-xs font-semibold text-primary hover:text-primary-hover">
          Configure
        </button>
      </div>
    </div>
  );
};

export default FlowNode;