import React from 'react';
import ToolCallBoxes from './ToolCallBoxes';

const NodeBoxes = ({ message }) => {
  if (!message.nodes || Object.keys(message.nodes).length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-gray-700 text-gray-100">
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.isStreaming && (
          <div className="flex items-center gap-1 mt-2">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </div>
    );
  }
  
  const renderNode = (nodeName) => {
    const node = message.nodes[nodeName];
    if (!node || !node.content.trim()) return null;

    let contentToRender = node.content;
    if (nodeName === 'question_classifier') {
      contentToRender = node.content.trim().toLowerCase() === 'yes' ? 'پیام مرتبط با تخمین قیمت است' :
                        node.content.trim().toLowerCase() === 'no' ? 'پیام مرتبط با تخمین قیمت نیست' :
                        node.content;
    }

    return (
      <div key={nodeName} className="border border-gray-600 rounded-lg overflow-hidden w-fit">
        <div className="bg-gray-800 px-3 py-2 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
              {node.displayName}
            </span>
          </div>
        </div>
        
        <div className="p-4 bg-gray-700">
          <p className="text-gray-100 whitespace-pre-wrap">{contentToRender}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* 1. Render Question Classifier first */}
      {message.nodeOrder.includes('question_classifier') && renderNode('question_classifier')}

      {/* 2. Render Tool Calls (search_csv_tool) */}
      <ToolCallBoxes toolCalls={message.toolCalls} />

      {/* 3. Render other nodes (Generate Answer) */}
      {message.nodeOrder.map((nodeName) => {
        if (nodeName !== 'question_classifier') {
          return renderNode(nodeName);
        }
        return null;
      })}

      {message.isStreaming && (
        <div className="flex items-center gap-1 mt-2 px-4">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}
    </div>
  );
};

export default NodeBoxes;
