import React, { useEffect, useRef } from 'react';

export interface FlowNodeData {
  id: string;
  title: string;
  type: string;
  position: { x: number; y: number };
}

interface FlowNodeProps {
  node: FlowNodeData;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent, nodeId: string) => void;
  onMove: (nodeId: string, position: { x: number; y: number }) => void;
  onConfigure: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onStartLinking: (e: React.MouseEvent, nodeId: string) => void;
}

const FlowNode: React.FC<FlowNodeProps> = ({ node, isSelected, onSelect, onMove, onConfigure, onDelete, onStartLinking }) => {
  const selectedClasses = "border-primary ring-2 ring-primary/30";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodeEl = ref.current;
    if (!nodeEl) return;

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();

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
  }, [node.id, node.position, onMove]);

  return (
    <div
      ref={ref}
      id={node.id}
      className={`absolute bg-app-bg-content border-2 rounded-lg shadow-md w-48 cursor-grab ${isSelected ? selectedClasses : 'border-app-border'}`}
      style={{ left: node.position.x, top: node.position.y }}
      onMouseDown={(e) => onSelect(e, node.id)}
    >
      <button onClick={() => onDelete(node.id)} className="absolute -top-2 -right-2 bg-white p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg></button>
      <button onClick={(e) => onStartLinking(e, node.id)} className="absolute top-1 right-8 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded hover:bg-blue-200">Link</button>
      <div className="p-3">
        <p className="font-bold text-sm text-app-text">{node.title}</p>
        <p className="text-xs text-app-text-subtle">{node.type}</p>
      </div>
      <div className="border-t border-app-border p-2 flex justify-center">
        <button onClick={() => onConfigure(node.id)} className="text-xs font-semibold text-primary hover:text-primary-hover">Configure</button>
      </div>
    </div>
  );
};

export default FlowNode;