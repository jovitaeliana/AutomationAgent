import React, { useState, useEffect } from 'react';
import FlowSidebar from '../components/FlowSidebar';

// Define types to match your db.json structure
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

const AgentCreationPage: React.FC = () => {
  const [nodes, setNodes] = useState<NodeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await fetch('http://localhost:3002/availableNodes');
        if (!response.ok) {
          throw new Error('Failed to fetch nodes data');
        }
        const nodesData = await response.json();
        setNodes(nodesData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchNodes();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-app-bg-highlight to-app-bg-content">
        <p className="text-app-text">Loading flow components...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-app-bg-highlight to-app-bg-content">
        <p className="text-red-500">Error loading components: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-app-bg-highlight to-app-bg-content">
      {/* Sidebar */}
      <FlowSidebar nodes={nodes} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-app-bg-content border-b border-app-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-app-text">Flow</h1>
            <button className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover">
              Create Flow
            </button>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Canvas Wrapper */}
          <div id="canvas-wrapper" className="flex-1 flex flex-col relative bg-gray-50 overflow-hidden">
            <div id="canvas" className="flex-1 p-8 relative cursor-grab">
              <p className="text-app-text">The flow nodes will be rendered here.</p>
            </div>
          </div>

          {/* Right-side Test Panel*/}
        </main>
      </div>
    </div>
  );
};

export default AgentCreationPage;