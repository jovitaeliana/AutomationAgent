import React, { useState, useEffect } from 'react';
import ProjectListItem from './ProjectListItem';
import { automationService, ragModelService } from '../services/api';
import type { Automation, RagModel } from '../lib/supabase';

// Define the page names type
type PageName = 'home' | 'configure' | 'choice' | 'dataset-testing' | 'upload-dataset' | 'flow-creation';

// Add props interface for navigation
interface RecentProjectsProps {
  onNavigate: (page: PageName) => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'automations' | 'rag'>('automations');
  
  // State to hold data fetched from Supabase
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [ragModels, setRagModels] = useState<RagModel[]>([]);

  // State to handle loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch data from Supabase using our services
        const [automationsData, ragModelsData] = await Promise.all([
          automationService.getAll(),
          ragModelService.getAll()
        ]);

        setAutomations(automationsData);
        setRagModels(ragModelsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
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
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
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
            Automations ({automations.length})
          </button>
          <button
            onClick={() => setActiveTab('rag')}
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'rag' ? "text-primary border-b-2 border-primary" : "text-gray-500 border-b-2 border-transparent hover:text-primary"}`}
          >
            RAG Models ({ragModels.length})
          </button>
        </div>
      </div>

      <div className="bg-app-bg-content rounded-xl border border-app-border">
        {(activeTab === 'automations' && automations.length === 0) || 
         (activeTab === 'rag' && ragModels.length === 0) ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">
              {activeTab === 'automations' ? '⚡' : '🧠'}
            </div>
            <div className="text-app-text-muted mb-2">
              No {activeTab === 'automations' ? 'automations' : 'RAG models'} yet
            </div>
            <p className="text-sm text-app-text-subtle">
              Create your first {activeTab === 'automations' ? 'automation' : 'RAG model'} to get started!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-app-border">
            {activeTab === 'automations' && automations.map(project => 
                <ProjectListItem 
                  key={project.id} 
                  title={project.title} 
                  description={project.description}
                  tags={project.tags}
                  onNavigate={onNavigate}
                  projectType="automation"
                />
            )}
            {activeTab === 'rag' && ragModels.map(project => 
                <ProjectListItem 
                  key={project.id} 
                  title={project.title}
                  description={project.description} 
                  tags={project.tags}
                  onNavigate={onNavigate}
                  projectType="rag"
                />
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentProjects;