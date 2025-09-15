import { useState, useRef } from 'react';
import Button from '../ui/Button';

export default function FileUploader({ onFileSelect, acceptedFileTypes = 'application/pdf,image/*', isLoading = false }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const fileType = file.type;
    const validTypes = acceptedFileTypes.split(',');
    
    if (!validTypes.some(type => {
      if (type.includes('*')) {
        const mainType = type.split('/')[0];
        return fileType.startsWith(mainType);
      }
      return type === fileType;
    })) {
      setError(`Invalid file type. Please upload ${acceptedFileTypes.replace(/,/g, ' or ')}`);
      setSelectedFile(null);
      e.target.value = null;
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB. Please upload a smaller file.');
      setSelectedFile(null);
      e.target.value = null;
      return;
    }

    setError('');
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div 
        style={{ 
          border: '2px dashed #d1d5db', 
          borderRadius: '0.5rem', 
          padding: '1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer',
          backgroundColor: 'white'
        }}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '3rem', width: '3rem', color: '#9ca3af' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <p className="mt-2 text-sm text-gray-600">Drag and drop an invoice file here, or click to select</p>
        <p className="mt-1 text-xs text-gray-500">PDF or Image files up to 10MB</p>
        
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFileTypes}
          disabled={isLoading}
        />
        
        {selectedFile && (
          <div className="mt-4 text-sm text-gray-700">
            Selected: {selectedFile.name}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {selectedFile && (
        <div className="mt-4 flex justify-center">
          <Button 
            type="submit" 
            isLoading={isLoading}
            disabled={isLoading}
          >
            Upload Invoice
          </Button>
        </div>
      )}
    </div>
  );
}
