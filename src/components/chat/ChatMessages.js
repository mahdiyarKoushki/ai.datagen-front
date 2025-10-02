import React from 'react';
import { User, Bot, Menu, FileText } from 'lucide-react'; // Add FileText import
import { formatTime } from '../../utils/formatters';
import NodeBoxes from './NodeBoxes';

const ChatMessages = ({ messages, isTyping, stopStreaming, messagesEndRef, sidebarOpen, setSidebarOpen, activeConversation, conversations, uploadedFiles }) => {
  return (
    <div className={`flex flex-col flex-1 transition-all duration-300 h-[calc(100%-150px)] ${sidebarOpen ? 'md:mr-64' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-semibold">
            {activeConversation ? 
              conversations.find(c => c.thread_id === activeConversation)?.title || 'گفتگوی کلود' 
              : 'گفتگوی جدید'
            }
          </h1>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-gray-400">متصل</span>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-blue-900/30 px-2 py-1 rounded-full">
              <FileText size={12} className="text-blue-400" />
              <span className="text-blue-300">{uploadedFiles.length} فایل</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Bot size={16} />
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-4 ${message.type === 'user' ? 'justify-start' : 'justify-end'}`}>
              {message.type === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} />
                </div>
              )}
              
              <div className={`max-w-[90%] md:max-w-[80%] ${message.type === 'user' ? '' : 'order-2'}`}>
                {message.type === 'user' ? (
                  <>
                    <div className="p-4 rounded-2xl bg-blue-600 text-white">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {formatTime(message.timestamp)}
                    </div>
                  </>
                ) : (
                  <>
                    <NodeBoxes message={message} />
                    <div className="text-xs text-gray-400 mt-1 text-left">
                      {formatTime(message.timestamp)}
                    </div>
                  </>
                )}
              </div>
              
              {message.type === 'assistant' && (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 order-3">
                  <Bot size={16} />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 items-center justify-end">
              <div className="max-w-[80%]">
                <div className="p-4 rounded-2xl bg-gray-700 text-gray-100 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <button
                    onClick={stopStreaming}
                    className="mr-2 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    توقف
                  </button>
                </div>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;
