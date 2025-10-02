import React from 'react';
import { Plus, FileText, X, Edit3, Trash2, Check } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const ChatSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  newConversation,
  showFileUpload,
  setShowFileUpload,
  handleLogout,
  documents,
  loading,
  conversations,
  activeConversation,
  switchConversation,
  editingTitle,
  setEditingTitle,
  editingTitleValue,
  setEditingTitleValue,
  handleTitleSave,
  handleTitleCancel,
  handleDeleteThread,
  handleTitleEdit
}) => {
  return (
    <div className={`
      fixed inset-y-0 right-0 z-50 w-full md:w-64 bg-gray-800 flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">گفتگوها</h2>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="p-2 rounded-lg hover:bg-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Sidebar Content */}
      <div className="p-4 border-b border-gray-700">
        <button 
          onClick={newConversation}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors mb-2"
        >
          <Plus size={16} />
          <span>گفتگوی جدید</span>
        </button>
        
        <button 
          onClick={() => {
            setShowFileUpload(!showFileUpload);
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
            showFileUpload ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <FileText size={16} />
          <span>پایگاه دانش</span>
          {documents.length > 0 && (
            <span className="mr-auto bg-blue-500 text-xs px-2 py-1 rounded-full">
              {documents.length}
            </span>
          )}
        </button>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors mt-2"
        >
          <X size={16} />
          <span>خروج</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.map((conv) => (
          <div 
            key={conv.thread_id}
            className={`flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer group ${
              activeConversation === conv.thread_id ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
            onClick={() => {
              switchConversation(conv.thread_id);
            }}
          >
            <div className="flex-1 truncate">
              {editingTitle === conv.thread_id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTitleValue}
                    onChange={(e) => setEditingTitleValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleTitleSave(conv.thread_id);
                      if (e.key === 'Escape') handleTitleCancel();
                    }}
                    className="bg-gray-600 text-white text-sm px-2 py-1 rounded flex-1 min-w-0"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTitleSave(conv.thread_id);
                    }}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTitleCancel();
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm">{conv.title}</span>
                  <div className="text-xs text-gray-500">
                    {formatDate(conv.updated_at)} • {conv.message_count || 0} پیام
                  </div>
                </>
              )}
            </div>
            {editingTitle !== conv.thread_id && (
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <Edit3 
                  size={14} 
                  className="text-gray-400 hover:text-white cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTitleEdit(conv.thread_id, conv.title);
                  }}
                />
                <Trash2 
                  size={14} 
                  className="text-gray-400 hover:text-red-400 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteThread(conv.thread_id);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
