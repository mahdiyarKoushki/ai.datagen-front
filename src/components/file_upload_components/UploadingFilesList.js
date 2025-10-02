import React from 'react';
import { Loader } from 'lucide-react';

const UploadingFilesList = ({ uploadingFiles }) => {
  if (uploadingFiles.length === 0) return null;

  return (
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
  );
};

export default UploadingFilesList;
