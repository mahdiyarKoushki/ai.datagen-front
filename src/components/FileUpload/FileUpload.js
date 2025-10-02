import React, { useState, useRef } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle, Loader, Globe, MessageSquare } from 'lucide-react';

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
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [scope, setScope] = useState('conversation');
  const fileInputRef = useRef(null);
  
  const supportedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['csv', 'xls', 'xlsx'].includes(extension)) return '📊';
    return '📎';
  };
  
  const validateFile = (file) => {
    if (!supportedTypes.includes(file.type)) {
      return `نوع فایل "${file.type}" پشتیبانی نمی‌شود. لطفاً فقط فایل‌های CSV یا Excel آپلود کنید.`;
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'حجم فایل باید کمتر از ۱۰ مگابایت باشد.';
    }
    return null;
  };
  
  const uploadFile = async (file) => {
    const fileId = crypto.randomUUID();
    onUploadStart(fileId, file);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${apiBaseUrl}/upload-document/?scope=${scope}&thread_id=${threadId || ''}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      onUploadComplete(fileId);
      onFileUploaded(result);
    } catch (err) {
      setError('آپلود فایل ناموفق بود. لطفاً دوباره تلاش کنید.');
      onUploadComplete(fileId);
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  };
  
  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  const deleteFile = async (document) => {
    try {
      const response = await fetch(`${apiBaseUrl}/documents/${document.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (onFileDeleted) onFileDeleted(document);
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('حذف فایل ناموفق بود. لطفاً دوباره تلاش کنید.');
    }
  };
  
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <Upload size={20} className="text-blue-400" />
        <h3 className="text-lg font-semibold text-white">پایگاه دانش</h3>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">محدوده فایل:</p>
        <div className="flex gap-2">
          <button
            onClick={() => setScope('conversation')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors ${
              scope === 'conversation' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <MessageSquare size={16} />
            <span>گفتگوی جاری</span>
          </button>
          <button
            onClick={() => setScope('global')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors ${
              scope === 'global' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Globe size={16} />
            <span>همه گفتگوها</span>
          </button>
        </div>
      </div>
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-400/10' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xls,.xlsx"
          onChange={handleInputChange}
          className="hidden"
        />
        
        <Upload size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-300 mb-1">
          فایل‌ها را اینجا رها کنید یا <span className="text-blue-400 cursor-pointer">مرور کنید</span>
        </p>
        <p className="text-xs text-gray-500">
          فقط فایل‌های CSV، XLS، XLSX پشتیبانی می‌شوند (حداکثر ۱۰ مگابایت)
        </p>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}
      
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            در حال آپلود ({uploadingFiles.length})
          </h4>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader size={16} className="text-blue-400 animate-spin" />
                <span className="text-sm text-gray-300 truncate">{file.name}</span>
                <span className="text-xs text-gray-500 me-auto">{Math.round(file.progress)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {documents.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            فایل‌های آپلود شده ({documents.length})
          </h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
                <span className="text-lg">{getFileIcon(doc.file_name)}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {doc.file_name}
                    </span>
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>
                      {new Intl.DateTimeFormat('fa-IR', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                        timeZone: 'Asia/Tehran'
                      }).format(new Date(doc.created_at.replace(' ', 'T') + 'Z'))}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {doc.scope === 'global' ? (
                        <>
                          <Globe size={12} />
                          <span>همه گفتگوها</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare size={12} />
                          <span>گفتگوی جاری</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => deleteFile(doc)}
                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                  title="حذف فایل"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
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