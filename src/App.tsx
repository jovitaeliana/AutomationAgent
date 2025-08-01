import { useState, useEffect } from 'react';

import HomePage from './pages/HomePage';
import ConfigureAgentPage from './pages/ConfigureAgentPage';
import AppChoicePage from './pages/AppChoicePage';
import UploadDatasetPage from './pages/UploadDatasetPage';
import AgentCreationPage from './pages/FlowCreationPage';
import UploadTestingFilePage from './pages/DatasetTestingPage';
import DeploymentStatusPage from './pages/DeploymentStatusPage';
import { ToastProvider } from './components/ToastContainer';

type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'flow-creation' | 'deployment-status';

function App() {
  const [page, setPage] = useState<PageName>('home');

  useEffect(() => {
    const hash = window.location.hash.slice(1) as PageName;
    const validPages: PageName[] = ['home', 'configure', 'choice', 'dataset-testing', 'upload-dataset', 'flow-creation', 'deployment-status'];
    if (validPages.includes(hash)) {
      setPage(hash);
    }
  }, []);

  
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1) as PageName;
      const validPages: PageName[] = ['home', 'configure', 'choice', 'dataset-testing', 'upload-dataset', 'flow-creation', 'deployment-status'];
      if (validPages.includes(hash)) {
        setPage(hash);
      } else {
        setPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const navigate = (newPage: PageName) => {
    setPage(newPage);
    window.history.pushState({}, '', `#${newPage}`);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'configure':
        return <ConfigureAgentPage onNavigate={navigate} />;
      case 'choice':
        return <AppChoicePage onNavigate={navigate} />;
      case 'dataset-testing':
        return <UploadTestingFilePage />;
      case 'upload-dataset':
        return <UploadDatasetPage onNavigate={navigate} />;
      case 'flow-creation':
        return <AgentCreationPage onNavigate={navigate} />;
      case 'deployment-status':
        return <DeploymentStatusPage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <ToastProvider>
      <div>
        {/* Temporary navigation bar for easy testing */}
        {/* <nav className="p-2 bg-gray-800 text-white text-xs text-center sticky top-0 z-50">
          <span className="font-bold">Temp Nav:</span>
          <button onClick={() => navigate('home')} className="ml-4 underline opacity-80 hover:opacity-100">Home</button>
          <button onClick={() => navigate('configure')} className="ml-4 underline opacity-80 hover:opacity-100">Configure Agent</button>
          <button onClick={() => navigate('choice')} className="ml-4 underline opacity-80 hover:opacity-100">App Choice</button>
          <button onClick={() => navigate('dataset-testing')} className="ml-4 underline opacity-80 hover:opacity-100">Upload Test Files</button>
          <button onClick={() => navigate('upload-dataset')} className="ml-4 underline opacity-80 hover:opacity-100">Upload Dataset</button>
          <button onClick={() => navigate('flow-creation')} className="ml-4 underline opacity-80 hover:opacity-100">Agent Creation</button>
        </nav> */}

        {/* Render the active page */}
        {renderPage()}
      </div>
    </ToastProvider>
  );
}

export default App;