const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ai-backend.datagencloud.com';

export const createNewThreadId = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/thread_id/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.thread_id;
    } else {
      throw new Error('Failed to create thread ID');
    }
  } catch (error) {
    console.error('Error creating thread ID:', error);
    throw error;
  }
};

export const loadAllThreads = async () => {
  try {
    console.log('Loading all threads...');
    const response = await fetch(`${API_BASE_URL}/threads/`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Threads response:', data);
      return data.threads || [];
    } else {
      console.error('Failed to load threads:', response.status, response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Error loading threads:', error);
    return [];
  }
};

export const loadThreadHistory = async (threadId) => {
  try {
    console.log('Loading history for thread:', threadId);
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}/history`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Thread history response:', data);
      return data.history || [];
    } else {
      console.error('Failed to load thread history:', response.status, response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Error loading thread history:', error);
    return [];
  }
};

export const updateThreadTitle = async (threadId, newTitle) => {
  try {
    const encodedTitle = encodeURIComponent(newTitle);
    const url = `${API_BASE_URL}/threads/${threadId}/title?title=${encodedTitle}`;

    const response = await fetch(
      url, 
      { 
        method: 'PUT',
      }
    );
    
    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.error('Error updating thread title:', error);
  }
  return false;
};

export const deleteThread = async (threadId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, { 
      method: 'DELETE'
    });
    
    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.error('Error deleting thread:', error);
  }
  return false;
};

export const loadThreadDocuments = async (threadId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}/documents`);
    if (response.ok) {
      const data = await response.json();
      return data.documents || [];
    } else {
      console.error('Failed to load thread documents:', response.status, response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Error loading thread documents:', error);
    return [];
  }
};

export const streamChatResponse = async (userMessage, threadId = null, onContent, onCheckpoint, onToolCall, onEnd, onError) => {
  try {
    const params = new URLSearchParams();
    params.append('message', userMessage);
    if (threadId) {
      params.append('thread_id', threadId);
    }
    
    const url = `${API_BASE_URL}/chat/stream/?${params.toString()}`;

    const response = await fetch(url, {});
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonData = line.slice(6);
            if (jsonData.trim() === '') continue;
            
            const data = JSON.parse(jsonData);
            
            if (data.type === 'checkpoint') {
              onCheckpoint(data.checkpoint_id);
            } else if (data.type === 'tool_call') {
              let parsedArgs = data.args;
              if (typeof data.args === 'string') {
                try {
                  parsedArgs = JSON.parse(data.args);
                } catch (e) {
                  parsedArgs = data.args;
                }
              }
              onToolCall({ tool: data.tool, args: parsedArgs, output: data.output });
            } else if (data.type === 'content') {
              onContent(data.node, data.content || '');
            } else if (data.type === 'end') {
              onEnd();
              break;
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError, 'Raw line:', line);
            onError('Error parsing SSE data');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming response:', error);
    onError('خطا: دریافت پاسخ ممکن نشد');
  }
};
