import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import FileUploadScopeSelector from './FileUploadScopeSelector';
import FileUploadDropzone from './FileUploadDropzone';
import UploadingFilesList from './UploadingFilesList';
import UploadedDocumentsList from './UploadedDocumentsList';
import { uploadFileToApi, deleteFileFromApi } from '../../services/fileUploadApi';

const FileUpload = ({ 
  apiBaseUrl = 'https://ai-backend.datagencloud.com', 
  documents = [], 
  uploadingFiles = [], 
  onFileUploaded, 
  onFileDeleted,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  threadId 
}) => {
  const [error, setError] = useState('');
  const [scope, setScope] = useState('conversation');
  
  const handleUploadFiles = useCallback(async (files) => {
    setError('');
    for (const file of files) {
      const fileId = crypto.randomUUID();
      onUploadStart(fileId, file);
      try {
        const result = await uploadFileToApi(file, scope, threadId, apiBaseUrl, onUploadProgress);
        onUploadComplete(fileId);
        onFileUploaded(result);
      } catch (err) {
        setError(err.message);
        onUploadComplete(fileId);
      }
    }
  }, [apiBaseUrl, scope, threadId, onUploadStart, onUploadProgress, onUploadComplete, onFileUploaded]);

  const handleDeleteFile = useCallback(async (document) => {
    if (window.confirm(`آیا مطمئن هستید که می‌خواهید فایل "${document.file_name}" را حذف کنید؟`)) {
      try {
        await deleteFileFromApi(document.id, apiBaseUrl);
        if (onFileDeleted) onFileDeleted(document);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [apiBaseUrl, onFileDeleted]);
  
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <Upload size={20} className="text-blue-400" />
        <h3 className="text-lg font-semibold text-white">پایگاه دانش</h3>
      </div>
      
      <FileUploadScopeSelector scope={scope} setScope={setScope} />
      
      <FileUploadDropzone 
        handleFiles={handleUploadFiles} 
        error={error} 
        setError={setError} 
      />
      
      <UploadingFilesList uploadingFiles={uploadingFiles} />
      
      <UploadedDocumentsList documents={documents} deleteFile={handleDeleteFile} />
      
      <div className="mt-4 p-3 bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-400">
          💡 <strong>نکته:</strong> فایل‌های CSV یا Excel را برای تقویت پایگاه دانش آپلود کنید. 
          فایل‌ها پردازش شده و برای پاسخ‌های مبتنی بر RAG در دسترس قرار خواهند گرفت.
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
