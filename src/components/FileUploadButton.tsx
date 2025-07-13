import React, { useState } from 'react';

interface FileUploadButtonProps {
  // A unique ID is needed to link the label and input
  id: string; 
  // A callback function to inform the parent component when a file is selected
  onFileSelect: (file: File) => void; 
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ id, onFileSelect }) => {
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file); // Pass the selected file up to the parent
    }
  };

  return (
    <div className="space-y-3">
      {/* File upload button - standalone and prominent */}
      <div className="flex items-center gap-4">
        <label 
          htmlFor={id} 
          className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg cursor-pointer hover:bg-primary-hover transition-all duration-200 shadow-sm hover:shadow-md border-2 border-transparent hover:border-primary-hover"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          Choose File
        </label>
        <input 
          id={id} 
          type="file" 
          className="hidden" 
          onChange={handleFileChange} 
        />
      </div>
      
      {/* File name display - separate from button */}
      <div className="text-sm text-app-text-subtle bg-app-bg-highlight px-3 py-2 rounded-lg border border-app-border">
        {fileName ? (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Selected: <span className="font-medium text-app-text ml-1">{fileName}</span>
          </span>
        ) : (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            No file selected
          </span>
        )}
      </div>
    </div>
  );
};

export default FileUploadButton;