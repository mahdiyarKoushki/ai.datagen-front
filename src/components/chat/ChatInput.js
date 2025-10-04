import React from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ inputValue, setInputValue, handleSubmit, handleKeyPress, isTyping, inputRef, sidebarOpen}) => {
  return (
    <div className={`border-t border-gray-700 transition-all duration-300  ${sidebarOpen ? 'md:mr-64' : ''}`}> {/* Keep border on outer div */}
      <div className="max-w-3xl mx-auto py-4 md:py-6 px-4 md:px-6"> {/* Apply padding here */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="پیام خود را بنویسید..."
              className="w-full p-3 pl-12 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isTyping}
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isTyping}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
            برای اطمینان، اطلاعات مهم رو دوباره بررسی کنید.
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
