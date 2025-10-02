// chatInterface.js
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Menu, Plus, Trash2, Edit3, FileText, Check, X } from 'lucide-react';
import LoginModal from "./LoginModal/LoginModal";
import FileUpload from "./FileUpload/FileUpload";

const formatData = (data) => {
  if (!data) return '';
  
  // If it's a string, check if it's CSV
  if (typeof data === 'string') {
    // Simple CSV detection: contains commas and newlines
      if (isLikelyCSV(data)) {
      try {
        const lines = data.trim().split('\n');
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
        return <pre className="text-xs bg-gray-800/50 p-2 rounded overflow-x-auto">{data}</pre>;
      }
    }
    
    // If it's not CSV, return as preformatted text
    return <pre className="text-xs bg-gray-800/50 p-2 rounded overflow-x-auto">{data}</pre>;
  }
  
  // If it's an object or array, format as JSON
  return (
    <pre className="text-xs bg-gray-800/50 p-2 rounded overflow-x-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

const isLikelyCSV = (str) => {
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
  if (values.length < 2) return false;
  
  // Check if most lines have the same number of columns
  const colCount = values.length;
  const consistentColumns = lines.every(line => {
    if (!line.trim()) return true; // Skip empty lines
    return line.split(',').length === colCount;
  });
  
  return consistentColumns;
};

const ChatGPTInterface = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "سلام! من چت بات هوش مصنوعی بندر امام هستم. برای تخمین قیمت محصول مورد نظر لطفا سوال خود را بپرسید.",
      timestamp: new Date(),
      nodes: {},
      nodeOrder: []
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]); // Track uploading files
  

  // Backend configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ai-backend.datagencloud.com';
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const currentStreamRef = useRef(null);
  
  // Handle authentication callback from LoginModal
  const handleAuthChange = (authStatus) => {
    setIsAuthenticated(authStatus);
  };
  
  // Handle logout
  const handleLogout = () => {
    if (window.logout) {
      window.logout();
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Load all threads when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllThreads();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeConversation) {
      loadThreadDocuments(activeConversation);
    } else {
      setDocuments([]);
    }
  }, [activeConversation]);
  
  // API Functions without authentication headers (using cookies)
  const createNewThreadId = async () => {
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
  
  const loadAllThreads = async () => {
    try {
      setLoading(true);
      console.log('Loading all threads...');
      const response = await fetch(`${API_BASE_URL}/threads/`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Threads response:', data);
        setConversations(data.threads || []);
        
        if (!activeConversation && data.threads.length > 0) {
          console.log('Setting active conversation to first thread:', data.threads[0].thread_id);
          setActiveConversation(data.threads[0].thread_id);
          await loadThreadHistory(data.threads[0].thread_id);
        } else if (data.threads.length === 0) {
          console.log('No threads found, creating new conversation');
          await newConversation();
        } else if (activeConversation) {
          console.log('Reloading active conversation history:', activeConversation);
          await loadThreadHistory(activeConversation);
        }
      } else {
        console.error('Failed to load threads:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };
  
 const loadThreadHistory = async (threadId) => {
  try {
    console.log('Loading history for thread:', threadId);
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}/history`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Thread history response:', data);
      
      if (data.history && data.history.length > 0) {
        const formattedMessages = data.history.map((msg, index) => {
          console.log('Processing message:', msg);
          
          let messageType = 'assistant';
          if (msg.role === 'user' || msg.type === 'HumanMessage' || msg.type?.includes('Human')) {
            messageType = 'user';
          } else if (msg.role === 'assistant' || msg.type === 'AIMessage' || msg.type?.includes('AI')) {
            messageType = 'assistant';
          }
          
          // Process content to ensure newlines are preserved
          let content = msg.content || msg.text || '';
          // Replace escaped newlines with actual newlines
          content = content.replace(/\\n/g, '\n');
          
          return {
            id: index + 1,
            type: messageType,
            content: content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            nodes: {},
            nodeOrder: []
          };
        });
        
        console.log('Formatted messages:', formattedMessages);
        setMessages(formattedMessages);
      } else {
        console.log('No history found, showing welcome message');
        setMessages([{
          id: 1,
          type: 'assistant',
          content: "سلام! من چت بات هوش مصنوعی بندر امام هستم. برای تخمین قیمت محصول مورد نظر لطفا سوال خود را بپرسید.",
          timestamp: new Date(),
          nodes: {},
          nodeOrder: []
        }]);
      }
    } else {
      console.error('Failed to load thread history:', response.status, response.statusText);
      setMessages([{
        id: 1,
        type: 'assistant',
        content: "سلام! من چت بات هوش مصنوعی بندر امام هستم. برای تخمین قیمت محصول مورد نظر لطفا سوال خود را بپرسید.",
        timestamp: new Date(),
        nodes: {},
        nodeOrder: []
      }]);
    }
  } catch (error) {
    console.error('Error loading thread history:', error);
    setMessages([{
      id: 1,
      type: 'assistant',
      content: "سلام! من چت بات هوش مصنوعی بندر امام هستم. برای تخمین قیمت محصول مورد نظر لطفا سوال خود را بپرسید.",
      timestamp: new Date(),
      nodes: {},
      nodeOrder: []
    }]);
  }
};
  
  const updateThreadTitle = async (threadId, newTitle) => {
    try {
      // 1. URL-encode the title to safely handle spaces and special characters.
      const encodedTitle = encodeURIComponent(newTitle);
      
      // 2. Construct the URL with the title as a query parameter.
      const url = `${API_BASE_URL}/threads/${threadId}/title?title=${encodedTitle}`;

      const response = await fetch(
        url, 
        { 
          method: 'PUT',
          // 3. The 'body' and 'Content-Type' header are removed as they are no longer needed.
        }
      );
      
      if (response.ok) {
        setConversations(prev => prev.map(conv => 
          conv.thread_id === threadId 
            ? { ...conv, title: newTitle }
            : conv
        ));
        return true;
      }
    } catch (error) {
      console.error('Error updating thread title:', error);
    }
    return false;
  };
  
  const deleteThread = async (threadId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, { 
        method: 'DELETE'
      });
      
      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.thread_id !== threadId));
        
        if (activeConversation === threadId) {
          const remainingThreads = conversations.filter(conv => conv.thread_id !== threadId);
          if (remainingThreads.length > 0) {
            setActiveConversation(remainingThreads[0].thread_id);
            await loadThreadHistory(remainingThreads[0].thread_id);
          } else {
            await newConversation();
          }
        }
        return true;
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
    return false;
  };
  

  // Function to load documents for a conversation
  const loadThreadDocuments = async (threadId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/threads/${threadId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to load thread documents:', response.status, response.statusText);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading thread documents:', error);
      setDocuments([]);
    }
  };


  // Handle file upload success
  const handleFileUploaded = (file) => {
    // Reload documents for current conversation
    if (activeConversation) {
      loadThreadDocuments(activeConversation);
    }
  };

  // Update handleFileDeleted to reload documents
  const handleFileDeleted = (file) => {
    // Reload documents for current conversation
    if (activeConversation) {
      loadThreadDocuments(activeConversation);
    }
  };

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

  // Stream chat response from FastAPI backend
  const streamChatResponse = async (userMessage, threadId = null) => {
    setIsTyping(true);
    const assistantMessageId = Date.now();
    const assistantMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      nodes: {},
      nodeOrder: [],
      toolCalls: []
    };
    
    // Add assistant message immediately
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.type === 'user' && lastMessage.content === userMessage) {
        return [...prev, assistantMessage];
      }
      const userMessageObject = {
        id: Date.now() + 1, type: 'user', content: userMessage, timestamp: new Date()
      };
      const isNewChat = prev.length === 1 && prev[0].id === 1;
      const baseMessages = isNewChat ? [userMessageObject] : prev;
      return [...baseMessages, assistantMessage];
    });
    
    try {
      const params = new URLSearchParams();
      params.append('message', userMessage);
      if (threadId) {
        params.append('thread_id', threadId);
      }
      console.log("API_BASE_URL" , API_BASE_URL);
      
      const url = `${API_BASE_URL}/chat/stream/?${params.toString()}`;

      console.log("url" , url);

      const response = await fetch(url, {});
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      currentStreamRef.current = reader;
      let buffer = '';
      let newThreadId = threadId;
      let contentReceived = false;
      
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
                newThreadId = data.checkpoint_id;
                console.log('Received checkpoint ID:', newThreadId);
                
                if (!threadId) {
                  setActiveConversation(newThreadId);
                  
                  const newConversationStub = {
                    thread_id: newThreadId,
                    title: userMessage.length > 50 ? userMessage.substring(0, 47) + '...' : userMessage,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    message_count: 1,
                  };
                  setConversations(prev => [newConversationStub, ...prev]);
                }
              } 
              else if (data.type === 'tool_call') {
  let parsedArgs = data.args;
  
  // Try to parse args if it's a string
  if (typeof data.args === 'string') {
    try {
      parsedArgs = JSON.parse(data.args);
    } catch (e) {
      // If parsing fails, keep as string
      parsedArgs = data.args;
    }
  }
  
  const toolCall = {
    tool: data.tool,
    args: parsedArgs,
    output: data.output
  };
  
  setMessages(prev => prev.map(msg => {
    if (msg.id === assistantMessageId) {
      return {
        ...msg,
        toolCalls: [...(msg.toolCalls || []), toolCall]
      };
    }
    return msg;
  }));
} else if (data.type === 'content') {
                contentReceived = true;
                const nodeName = data.node;
                const nodeContent = data.content || '';
                
                setMessages(prev => prev.map(msg => {
                  if (msg.id === assistantMessageId) {
                    const updatedNodes = { ...msg.nodes };
                    const currentNodeOrder = msg.nodeOrder || [];
                    
                    if (!updatedNodes[nodeName]) {
                      updatedNodes[nodeName] = {
                        content: '',
                        displayName: nodeName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      };
                    }
                    
                    updatedNodes[nodeName].content += nodeContent;
                    
                    const newNodeOrder = currentNodeOrder.includes(nodeName) 
                      ? currentNodeOrder 
                      : [...currentNodeOrder, nodeName];
                    
                    return {
                      ...msg,
                      nodes: updatedNodes,
                      nodeOrder: newNodeOrder
                    };
                  }
                  return msg;
                })); 
} else if (data.type === 'end') {
                console.log('Stream ended');
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
                break;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError, 'Raw line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false, content: 'خطا: دریافت پاسخ ممکن نشد' }
          : msg
      ));
    } finally {
      setIsTyping(false);
      currentStreamRef.current = null;
    }
  };
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    
    const userMessage = {
      id: Date.now() + 1,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    const isNewChat = messages.length === 1 && messages[0].id === 1;
    setMessages(isNewChat ? [userMessage] : prev => [...prev, userMessage]);
    
    const messageContent = inputValue.trim();
    setInputValue('');
    
    await streamChatResponse(messageContent, activeConversation);
  };
    
  const stopStreaming = () => {
    if (currentStreamRef.current) {
      currentStreamRef.current.cancel();
      currentStreamRef.current = null;
      setIsTyping(false);
      
      setMessages(prev => prev.map(msg => 
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      ));
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const newConversation = async () => {
    try {
      // 1. یک ترد جدید از سرور ایجاد و شناسه آن را دریافت کنید
      const response = await fetch(`${API_BASE_URL}/thread_id/`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to create a new thread');
      }
      const data = await response.json();
      const newThreadId = data.thread_id; // فرض بر اینکه سرور آبجکتی با کلید thread_id برمی‌گرداند

      // 2. یک گفتگوی موقت برای نمایش در لیست سایدبار بسازید
      const newConversationStub = {
        thread_id: newThreadId,
        title: "گفتگوی جدید",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
      };

      // 3. لیست گفتگوها را با افزودن گفتگوی جدید در ابتدا، به‌روز کنید
      setConversations(prev => [newConversationStub, ...prev]);
      
      // 4. این گفتگوی جدید را به عنوان گفتگوی فعال تنظیم کنید
      setActiveConversation(newThreadId);
      
      // 5. پیام‌های صفحه را به حالت اولیه برگردانید
      setMessages([{
        id: 1,
        type: 'assistant',
        content: "سلام! من چت بات هوش مصنوعی بندر امام هستم. برای تخمین قیمت محصول مورد نظر لطفا سوال خود را بپرسید.",
        timestamp: new Date(),
        nodes: {},
        nodeOrder: [],
        toolCalls: []
      }]);
      
      // 6. لیست اسناد را برای گفتگوی جدید پاک کنید
      setDocuments([]);
      
      console.log('Successfully started a new conversation with thread ID:', newThreadId);

    } catch (error) {
      console.error('Failed to create new conversation:', error);
      alert('ایجاد گفتگوی جدید با مشکل مواجه شد. لطفاً دوباره تلاش کنید.');
    }
  };
  
  const switchConversation = async (threadId) => {
    if (threadId === activeConversation) return;
    
    setActiveConversation(threadId);
    await loadThreadHistory(threadId);
    await loadThreadDocuments(threadId); // Load documents for this thread
  };
  
  const handleTitleEdit = (threadId, currentTitle) => {
    setEditingTitle(threadId);
    setEditingTitleValue(currentTitle);
  };
  
  const handleTitleSave = async (threadId) => {
    if (editingTitleValue.trim() && editingTitleValue !== conversations.find(c => c.thread_id === threadId)?.title) {
      const success = await updateThreadTitle(threadId, editingTitleValue.trim());
      if (!success) {
        alert('به‌روزرسانی عنوان گفتگو ممکن نشد');
      }
    }
    setEditingTitle(null);
    setEditingTitleValue('');
  };
  
  const handleTitleCancel = () => {
    setEditingTitle(null);
    setEditingTitleValue('');
  };
  
  const handleDeleteThread = async (threadId) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این گفتگو را حذف کنید؟')) {
      const success = await deleteThread(threadId);
      if (!success) {
        alert('حذف گفتگو ممکن نشد');
      }
    }
  };
  
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString) => {
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


  // Component to render node boxes
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
    
    return (
      <div className="space-y-3">
        {message.nodeOrder.map((nodeName) => {
          const node = message.nodes[nodeName];
          if (!node || !node.content.trim()) return null;
          
          return (
            <div key={nodeName} className="border border-gray-600 rounded-lg overflow-hidden">
              <div className="bg-gray-800 px-3 py-2 border-b border-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                    {node.displayName}
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-gray-700">
                <p className="text-gray-100 whitespace-pre-wrap">{node.content}</p>
              </div>
            </div>
          );
        })}
        <ToolCallBoxes toolCalls={message.toolCalls} />

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
  
  return (
    <>
      <LoginModal onLogin={handleAuthChange} />
      
      {isAuthenticated && (
        <div className="flex h-screen bg-gray-900 text-white" dir="rtl">
          {/* Mobile Overlay */}
          {(sidebarOpen || showFileUpload) && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => {
                setSidebarOpen(false);
                setShowFileUpload(false);
              }}
            />
          )}
          
          {/* Sidebar - Conversation List */}
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
              {loading ? (
                <div className="text-center text-gray-400 p-4">در حال بارگذاری...</div>
              ) : (
                conversations.map((conv) => (
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
                ))
              )}
            </div>
          </div>
          
          {/* Knowledge Base Panel */}
          {showFileUpload && (
            <div className={`
              fixed inset-y-0 left-0 z-50 w-full md:w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto
              transform transition-transform duration-300 ease-in-out
              ${showFileUpload ? 'translate-x-0' : '-translate-x-full'}
            `}>
              {/* Mobile Header */}
              <div className="md:hidden p-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold">پایگاه دانش</h2>
                <button 
                  onClick={() => setShowFileUpload(false)}
                  className="p-2 rounded-lg hover:bg-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4">
                <FileUpload 
                  apiBaseUrl={API_BASE_URL}
                  threadId={activeConversation}
                  documents={documents}
                  uploadingFiles={uploadingFiles}
                  onFileUploaded={handleFileUploaded}
                  onFileDeleted={handleFileDeleted}
                  onUploadStart={(fileId, file) => {
                    setUploadingFiles(prev => [...prev, { id: fileId, name: file.name, progress: 0 }]);
                  }}
                  onUploadProgress={(fileId, progress) => {
                    setUploadingFiles(prev => 
                      prev.map(f => f.id === fileId ? { ...f, progress } : f)
                    );
                  }}
                  onUploadComplete={(fileId) => {
                    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Main Chat Area */}
          <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'md:mr-64' : ''}`}>
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
            
            {/* Input Area */}
            <div className="p-4 md:p-6 border-t border-gray-700">
              <div className="max-w-3xl mx-auto">
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
          </div>
        </div>
      )}
    </>
  );
};
export default ChatGPTInterface;