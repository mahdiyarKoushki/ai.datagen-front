import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { validateFile } from '../../utils/fileUtils';

const FileUploadDropzone = ({ handleFiles, error, setError }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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
      const files = Array.from(e.dataTransfer.files);
      const validationErrors = files.map(file => validateFile(file)).filter(Boolean);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(' '));
      } else {
        setError('');
        handleFiles(files);
      }
    }
  };
  
  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validationErrors = files.map(file => validateFile(file)).filter(Boolean);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(' '));
      } else {
        setError('');
        handleFiles(files);
      }
    }
  };
  
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
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

      {error && (
        <div className="mt-3 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploadDropzone;
