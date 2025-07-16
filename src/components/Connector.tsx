import React from 'react';

interface ConnectorProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const Connector: React.FC<ConnectorProps> = ({ from, to }) => {
  const pathData = `M ${from.x} ${from.y} C ${from.x + 60} ${from.y}, ${to.x - 60} ${to.y}, ${to.x} ${to.y}`;
  return <path d={pathData} stroke="#CBD5E1" strokeWidth="2" fill="none" />;
};

export default Connector;