import React, { useState, useEffect } from 'react';
import { CheckCircle, ExternalLink, Power } from 'lucide-react';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation' | 'deployment-status';

interface DeploymentStatusPageProps {
  onNavigate: (page: PageName) => void;
}

const DeploymentStatusPage: React.FC<DeploymentStatusPageProps> = ({ onNavigate }) => {
  const [deployedTabRef, setDeployedTabRef] = useState<Window | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [deploymentUrl] = useState('http://localhost:5174');

  useEffect(() => {
    // Simulate deployment process
    const deploymentTimer = setTimeout(() => {
      setIsDeployed(true);
      // Open the deployed app in a new tab
      const newTab = window.open(deploymentUrl, '_blank');
      setDeployedTabRef(newTab);
    }, 2000); // 2 second delay to simulate deployment

    return () => clearTimeout(deploymentTimer);
  }, [deploymentUrl]);

  const handleShutdown = () => {
    // Close the deployed app tab if it exists
    if (deployedTabRef && !deployedTabRef.closed) {
      deployedTabRef.close();
    }
    
    // Navigate back to home
    onNavigate('home');
  };

  const openDeployedApp = () => {
    // Open or focus the deployed app tab
    if (deployedTabRef && !deployedTabRef.closed) {
      deployedTabRef.focus();
    } else {
      const newTab = window.open(deploymentUrl, '_blank');
      setDeployedTabRef(newTab);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg text-app-text font-sans">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-app-bg-content rounded-xl border border-app-border shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-app-text mb-2">Deployment Status</h1>
            <p className="text-app-text-subtle">Your agent is being deployed and will be available shortly</p>
          </div>

          {/* Status Section */}
          <div className="bg-app-bg-highlight rounded-lg p-6 mb-8">
            {!isDeployed ? (
              // Deploying State
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h2 className="text-xl font-semibold text-app-text mb-2">Deploying Your Agent...</h2>
                <p className="text-app-text-subtle mb-4">Setting up your application environment</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
            ) : (
              // Deployed State
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-app-text mb-2">Deployment Successful!</h2>
                <p className="text-app-text-subtle mb-4">Your agent is now running and accessible</p>
                
                {/* Deployment URL */}
                <div className="bg-white border border-app-border rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm font-medium text-app-text-subtle">Running on:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-app-text">
                      {deploymentUrl}
                    </code>
                    <button
                      onClick={openDeployedApp}
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border border-app-border rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-app-text">Server Running</span>
                    </div>
                  </div>
                  <div className="bg-white border border-app-border rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-app-text">Agent Active</span>
                    </div>
                  </div>
                  <div className="bg-white border border-app-border rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-app-text">API Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {isDeployed && (
              <>
                <button
                  onClick={openDeployedApp}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open App</span>
                </button>
                <button
                  onClick={handleShutdown}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Power className="w-4 h-4" />
                  <span>Shut Down</span>
                </button>
              </>
            )}
          </div>

          {/* Additional Info */}
          {isDeployed && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Deployment Information</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Your agent is running in a local development environment</p>
                <p>• The application will remain active until you shut it down</p>
                <p>• You can share the URL with others on your local network</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentStatusPage;
