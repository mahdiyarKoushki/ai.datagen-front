import React, { useState } from 'react';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 left-2 p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs"
    >
      {copied ? '✓ کپی شد' : 'کپی'}
    </button>
  );
};

export default CopyButton;
