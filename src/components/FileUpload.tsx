import React, { memo, useCallback, useState } from 'react';
import { FileUploadProgress } from '../types';

interface FileUploadProps {
  onFileUpload: (file: File, caption: string) => void;
  userId: string;
  username: string;
}

export const FileUpload = memo(({ onFileUpload, }: FileUploadProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [caption, setCaption] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        isComplete: false,
        error: 'File size exceeds 10MB limit'
      });
      return;
    }

    const progress: FileUploadProgress = {
      fileName: file.name,
      progress: 0,
      isComplete: false
    };
    
    setUploadProgress(progress);

    const interval = setInterval(() => {
      setUploadProgress(prev => 
        prev ? { ...prev, progress: Math.min(prev.progress + 10, 100) } : null
      );
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(prev => prev ? { ...prev, progress: 100, isComplete: true } : null);      
      
      onFileUpload(file, caption);
      setCaption('');
      
      setTimeout(() => setUploadProgress(null), 2000);
    }, 1000);
  }, [onFileUpload, caption]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  return (
    <div className="file-upload">
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="file-label">
          📎 Click to upload or drag & drop files
        </label>
        
        <input
          type="text"
          placeholder="Add a caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="caption-input"
        />
      </div>

      {uploadProgress && (
        <div className="upload-progress">
          <div className="progress-info">
            <span>{uploadProgress.fileName}</span>
            <span>{uploadProgress.progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${uploadProgress.progress}%` }}
            ></div>
          </div>
          {uploadProgress.error && (
            <div className="upload-error">{uploadProgress.error}</div>
          )}
          {uploadProgress.isComplete && (
            <div className="upload-complete">Upload complete!</div>
          )}
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';