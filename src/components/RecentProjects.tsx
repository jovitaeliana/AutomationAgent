import React, { useState, useEffect } from 'react';
import ProjectListItem from './ProjectListItem';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'agent-creation';

// Define types for the data we expect from the API
interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
}

// Add props interface for navigation
interface RecentProjectsProps {
  onNavigate: (page: PageName) => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'automations' | 'rag'>('automations');
  
  // State to hold data fetched from the API
  const [automations, setAutomations] = useState<Project[]>([]);
  const [ragModels, setRagModels] = useState<Project[]>([]);

  // State to handle loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [automationsResponse, ragModelsResponse] = await Promise.all([
          fetch('http://localhost:3002/automations'),
          fetch('http://localhost:3002/ragModels')
        ]);

        if (!automationsResponse.ok || !ragModelsResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const automationsData = await automationsResponse.json();
        const ragModelsData = await ragModelsResponse.json();

        setAutomations(automationsData);
        setRagModels(ragModelsData);
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

    fetchData();
  }, []); // The empty array ensures this effect runs only once

  if (isLoading) {
    return <p className="text-center text-app-text">Loading projects...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-app-text">Recent Projects</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('automations')}
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'automations' ? "text-primary border-b-2 border-primary" : "text-gray-500 border-b-2 border-transparent hover:text-primary"}`}
          >
            Automations
          </button>
          <button
            onClick={() => setActiveTab('rag')}
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'rag' ? "text-primary border-b-2 border-primary" : "text-gray-500 border-b-2 border-transparent hover:text-primary"}`}
          >
            RAG Models
          </button>
        </div>
      </div>

      <div className="bg-app-bg-content rounded-xl border border-app-border">
          <div className="divide-y divide-app-border">
            {activeTab === 'automations' && automations.map(project => 
                <ProjectListItem 
                  key={project.id} 
                  {...project} 
                  onNavigate={onNavigate}
                  projectType="automation"
                />
            )}
            {activeTab === 'rag' && ragModels.map(project => 
                <ProjectListItem 
                  key={project.id} 
                  {...project} 
                  onNavigate={onNavigate}
                  projectType="rag"
                />
            )}
          </div>
      </div>
    </section>
  );
};

export default RecentProjects;