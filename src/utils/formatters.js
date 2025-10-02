import React from 'react';

export const formatData = (data) => {
  if (!data) return '';
  
  // If it's a string, check if it's CSV
  if (typeof data === 'string') {
    let processedData = data;
    // Attempt to remove a leading 'P"' if present, as seen in the screenshot
    if (processedData.startsWith('P"')) {
      processedData = processedData.substring(1); // Remove the leading 'P'
    }

    // Simple CSV detection: contains commas and newlines
      if (isLikelyCSV(processedData)) {
      try {
        const lines = processedData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim())
        );
        
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  {headers.map((header, i) => (
                    <th key={i} className="px-3 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-sm text-gray-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } catch (e) {
        // If CSV parsing fails, return as preformatted text
        return <pre className="text-xs bg-gray-800/50 p-2 rounded overflow-x-auto">{processedData}</pre>;
      }
    }
    
    // If it's not CSV, return as preformatted text
    return <pre className="text-xs bg-gray-800/50 p-2 rounded overflow-x-auto">{processedData}</pre>;
  }
  
  // If it's an object or array, format as JSON
  return (
    <pre className="text-xs bg-gray-800/50 p-2 rounded overflow-x-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

export const isLikelyCSV = (str) => {
  if (typeof str !== 'string') return false;
  
  // Basic CSV checks:
  // 1. Contains commas
  // 2. Contains newlines
  // 3. Has multiple lines
  // 4. First line has multiple comma-separated values
  const lines = str.trim().split('\n');
  if (lines.length < 2) return false;
  
  const firstLine = lines[0];
  const values = firstLine.split(',');
  // Ensure the first line has at least two comma-separated values to be considered CSV
  if (values.length < 2) return false;
  
  // A more robust check for CSV might involve looking for quoted fields,
  // but for "likely CSV", we'll assume if it has multiple lines and commas, it's likely CSV.
  // The actual parsing in formatData will handle errors.
  return true; // If it has multiple lines and commas in the first line, consider it likely CSV.
};

export const formatTime = (timestamp) => {
  return timestamp.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'امروز';
  if (diffDays === 2) return 'دیروز';
  if (diffDays <= 7) return `${diffDays - 1} روز پیش`;
  return date.toLocaleDateString('fa-IR');
};
