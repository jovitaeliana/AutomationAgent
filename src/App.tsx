import { useState, useEffect } from 'react';

// Import all page components
import HomePage from './pages/HomePage';
import ConfigureAgentPage from './pages/ConfigureAgentPage';
import AppChoicePage from './pages/AppChoicePage';
import UploadDatatestPage from './pages/UploadDatatestPage';
import AgentCreationPage from './pages/AgentCreationPage';
import UploadTestingFilePage from './pages/DatasetTestingPage';

// Define the possible page names for type safety
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation';

function App() {
  const [page, setPage] = useState<PageName>('home');

  // Scroll to top whenever the page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  // Helper function to render the correct page based on state
  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={setPage} />;
      case 'configure':
        return <ConfigureAgentPage onNavigate={setPage} />;
      case 'choice':
        return <AppChoicePage />;
      case 'dataset-testing':
        return <UploadTestingFilePage />;
      case 'upload-dataset':
        return <UploadDatatestPage onNavigate={setPage} />;
      case 'agent-creation':
        return <AgentCreationPage onNavigate={setPage} />;
      default:
        return <HomePage onNavigate={setPage} />;
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
        <button onClick={() => setPage('dataset-testing')} className="ml-4 underline opacity-80 hover:opacity-100">Upload Test Files</button>
        <button onClick={() => setPage('upload-dataset')} className="ml-4 underline opacity-80 hover:opacity-100">Upload Dataset</button>
        <button onClick={() => setPage('agent-creation')} className="ml-4 underline opacity-80 hover:opacity-100">Agent Creation</button>
      </nav>

      {/* Render the active page */}
      {renderPage()}
    </div>
  );
}

export default App;
