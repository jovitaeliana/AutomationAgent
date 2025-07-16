import React, { useState } from 'react';

// Import all page components
import HomePage from './pages/HomePage';
import ConfigureAgentPage from './pages/ConfigureAgentPage';
import AppChoicePage from './pages/AppChoicePage';
import DatasetTestingPage from './pages/DatasetTestingPage';
import TestDatasetPage from './pages/DatasetTestingPage';
import AgentCreationPage from './pages/AgentCreationPage';

// Define the possible page names for type safety
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'test-dataset' | 'agent-creation';

function App() {
  const [page, setPage] = useState<PageName>('home');

  // Helper function to render the correct page based on state
  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage />;
      case 'configure':
        return <ConfigureAgentPage />;
      case 'choice':
        return <AppChoicePage />;
      case 'dataset-testing':
        return <DatasetTestingPage />;
      case 'test-dataset':
        return <TestDatasetPage />;
      case 'agent-creation':
        return <AgentCreationPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div>
      {/* Temporary navigation bar for easy testing */}
      <nav className="p-2 bg-gray-800 text-white text-xs text-center sticky top-0 z-50">
        <span className="font-bold">Temp Nav:</span>
        <button onClick={() => setPage('home')} className="ml-4 underline opacity-80 hover:opacity-100">Home</button>
        <button onClick={() => setPage('configure')} className="ml-4 underline opacity-80 hover:opacity-100">Configure Agent</button>
        <button onClick={() => setPage('choice')} className="ml-4 underline opacity-80 hover:opacity-100">App Choice</button>
        <button onClick={() => setPage('dataset-testing')} className="ml-4 underline opacity-80 hover:opacity-100">Dataset Testing</button>
        <button onClick={() => setPage('test-dataset')} className="ml-4 underline opacity-80 hover:opacity-100">Create Test Dataset</button>
        <button onClick={() => setPage('agent-creation')} className="ml-4 underline opacity-80 hover:opacity-100">Agent Creation</button>
      </nav>

      {/* Render the active page */}
      {renderPage()}
    </div>
  );
}

export default App;