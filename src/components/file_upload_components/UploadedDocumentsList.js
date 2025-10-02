import React from 'react';
import { X, CheckCircle, Globe, MessageSquare } from 'lucide-react';
import { getFileIcon } from '../../utils/fileUtils';

const UploadedDocumentsList = ({ documents, deleteFile }) => {
  if (documents.length === 0) return null;

  return (
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
  );
};

export default UploadedDocumentsList;
