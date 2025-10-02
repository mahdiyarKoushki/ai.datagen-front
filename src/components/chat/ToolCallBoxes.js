import React from 'react';
import { formatData } from '../../utils/formatters';
import CopyButton from './CopyButton';

const ToolCallBoxes = ({ toolCalls }) => {
  if (!toolCalls || toolCalls.length === 0) return null;
  
  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-400 mb-2">فراخوانی ابزارها</h3>
      {toolCalls.map((call, index) => (
        <div key={index} className="border border-purple-500/30 rounded-lg overflow-hidden bg-purple-900/10">
          <div className="bg-purple-900/20 px-3 py-2 border-b border-purple-500/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-xs font-medium text-purple-300 uppercase tracking-wide">
                {call.tool}
              </span>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {/* Arguments Section */}
            <div>
              <span className="text-xs text-gray-400 block mb-1">ورودی‌ها:</span>
              {typeof call.args === 'string' ? (
                // If args is a string, try to parse as JSON
                formatData(
                  (() => {
                    try {
                      return JSON.parse(call.args);
                    } catch (e) {
                      return call.args;
                    }
                  })()
                )
              ) : (
                // If args is already an object
                formatData(call.args)
              )}
            </div>
            
            {/* Output Section */}
            <div className="relative">
              <span className="text-xs text-gray-400 block mb-1">خروجی:</span>
              <div className="relative">
                {formatData(call.output)}
                <CopyButton text={call.output} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToolCallBoxes;
