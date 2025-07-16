import React from 'react';

type PortPosition = 'top' | 'right' | 'bottom' | 'left';

interface ConnectionPortProps {
  position: PortPosition;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
}

const positionClasses: Record<PortPosition, string> = {
  top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
  right: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2',
  bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
  left: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2',
};

const ConnectionPort: React.FC<ConnectionPortProps> = ({ position, onMouseDown, onMouseUp }) => {
  return (
    <div
      className={`absolute w-3 h-3 bg-white border-2 border-primary rounded-full cursor-crosshair hover:bg-primary ${positionClasses[position]}`}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    />
  );
};

export default ConnectionPort;