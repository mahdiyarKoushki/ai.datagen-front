import React from 'react';
import { Globe, MessageSquare } from 'lucide-react';

const FileUploadScopeSelector = ({ scope, setScope }) => {
  return (
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
  );
};

export default FileUploadScopeSelector;
