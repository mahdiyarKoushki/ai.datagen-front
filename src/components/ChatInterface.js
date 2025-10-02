import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react'; // Add X import
import LoginModal from "./LoginModal/LoginModal";
import FileUpload from "./file_upload_components/FileUpload";
import ChatSidebar from './chat/ChatSidebar.jsx';
import ChatInput from './chat/ChatInput';
import ChatMessages from './chat/ChatMessages';
import { 
  createNewThreadId, 
  loadAllThreads as apiLoadAllThreads, 
  loadThreadHistory as apiLoadThreadHistory, 
  updateThreadTitle as apiUpdateThreadTitle, 
  deleteThread as apiDeleteThread, 
  loadThreadDocuments as apiLoadThreadDocuments, 
  streamChatResponse as apiStreamChatResponse 
} from '../services/chatApi';

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
  const [uploadedFiles, setUploadedFiles] = useState([]); // This state seems unused, consider removing or integrating
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ai-backend.datagencloud.com';
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const currentStreamRef = useRef(null);
  
  const handleAuthChange = (authStatus) => {
    setIsAuthenticated(authStatus);
  };
  
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

  const loadThreadHistory = useCallback(async (threadId) => {
    try {
      console.log('Loading history for thread:', threadId);
      const history = await apiLoadThreadHistory(threadId);
      
      if (history && history.length > 0) {
        const formattedMessages = history.map((msg, index) => {
          let messageType = 'assistant';
          if (msg.role === 'user' || msg.type === 'HumanMessage' || msg.type?.includes('Human')) {
            messageType = 'user';
          } else if (msg.role === 'assistant' || msg.type === 'AIMessage' || msg.type?.includes('AI')) {
            messageType = 'assistant';
          }
          
          let content = msg.content || msg.text || '';
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
        
        setMessages(formattedMessages);
      } else {
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
  }, []);

  const loadAllThreads = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading all threads...');
      const threads = await apiLoadAllThreads();
      setConversations(threads);
      
      if (!activeConversation && threads.length > 0) {
        setActiveConversation(threads[0].thread_id);
        await loadThreadHistory(threads[0].thread_id);
      } else if (threads.length === 0) {
        await newConversation();
      } else if (activeConversation) {
        await loadThreadHistory(activeConversation);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  }, [activeConversation, loadThreadHistory]);
  
  useEffect(() => {
    if (isAuthenticated) {
      loadAllThreads();
    }
  }, [isAuthenticated, loadAllThreads]);

  const loadThreadDocuments = useCallback(async (threadId) => {
    try {
      const docs = await apiLoadThreadDocuments(threadId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading thread documents:', error);
      setDocuments([]);
    }
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadThreadDocuments(activeConversation);
    } else {
      setDocuments([]);
    }
  }, [activeConversation, loadThreadDocuments]);

  const newConversation = useCallback(async () => {
    try {
      const newThreadId = await createNewThreadId();
      const newConversationStub = {
        thread_id: newThreadId,
        title: "گفتگوی جدید",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
      };

      setConversations(prev => [newConversationStub, ...prev]);
      setActiveConversation(newThreadId);
      setMessages([{
        id: 1,
        type: 'assistant',
        content: "سلام! من چت بات هوش مصنوعی بندر امام هستم. برای تخمین قیمت محصول مورد نظر لطفا سوال خود را بپرسید.",
        timestamp: new Date(),
        nodes: {},
        nodeOrder: [],
        toolCalls: []
      }]);
      setDocuments([]);
      console.log('Successfully started a new conversation with thread ID:', newThreadId);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      alert('ایجاد گفتگوی جدید با مشکل مواجه شد. لطفاً دوباره تلاش کنید.');
    }
  }, []);

  const switchConversation = useCallback(async (threadId) => {
    if (threadId === activeConversation) return;
    setActiveConversation(threadId);
    await loadThreadHistory(threadId);
    await loadThreadDocuments(threadId);
  }, [activeConversation, loadThreadHistory, loadThreadDocuments]);

  const updateThreadTitle = useCallback(async (threadId, newTitle) => {
    const success = await apiUpdateThreadTitle(threadId, newTitle);
    if (success) {
      setConversations(prev => prev.map(conv => 
        conv.thread_id === threadId 
          ? { ...conv, title: newTitle }
          : conv
      ));
    } else {
      alert('به‌روزرسانی عنوان گفتگو ممکن نشد');
    }
    return success;
  }, []);

  const deleteThread = useCallback(async (threadId) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این گفتگو را حذف کنید؟')) {
      const success = await apiDeleteThread(threadId);
      if (success) {
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
      } else {
        alert('حذف گفتگو ممکن نشد');
      }
      return success;
    }
    return false;
  }, [activeConversation, conversations, loadThreadHistory, newConversation]);

  const handleTitleEdit = (threadId, currentTitle) => {
    setEditingTitle(threadId);
    setEditingTitleValue(currentTitle);
  };
  
  const handleTitleSave = async (threadId) => {
    if (editingTitleValue.trim() && editingTitleValue !== conversations.find(c => c.thread_id === threadId)?.title) {
      await updateThreadTitle(threadId, editingTitleValue.trim());
    }
    setEditingTitle(null);
    setEditingTitleValue('');
  };
  
  const handleTitleCancel = () => {
    setEditingTitle(null);
    setEditingTitleValue('');
  };
  
  const handleDeleteThread = async (threadId) => {
    await deleteThread(threadId);
  };

  const handleFileUploaded = useCallback(() => {
    if (activeConversation) {
      loadThreadDocuments(activeConversation);
    }
  }, [activeConversation, loadThreadDocuments]);

  const handleFileDeleted = useCallback(() => {
    if (activeConversation) {
      loadThreadDocuments(activeConversation);
    }
  }, [activeConversation, loadThreadDocuments]);

  const streamChatResponse = useCallback(async (userMessage, threadId = null) => {
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
    
    let newThreadId = threadId;
    
    const onCheckpoint = (checkpointId) => {
      newThreadId = checkpointId;
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
    };

    const onToolCall = (toolCall) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === assistantMessageId) {
          return {
            ...msg,
            toolCalls: [...(msg.toolCalls || []), toolCall]
          };
        }
        return msg;
      }));
    };

    const onContent = (nodeName, nodeContent) => {
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
    };

    const onEnd = () => {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      // Update the active conversation in the sidebar history
      setConversations(prevConversations => prevConversations.map(conv => {
        if (conv.thread_id === (newThreadId || threadId)) {
          return {
            ...conv,
            updated_at: new Date().toISOString(),
            message_count: (conv.message_count || 0) + 2 // User message + Assistant message
          };
        }
        return conv;
      }));
    };

    const onError = (errorMessage) => {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false, content: errorMessage }
          : msg
      ));
    };

    try {
      await apiStreamChatResponse(userMessage, threadId, onContent, onCheckpoint, onToolCall, onEnd, onError);
    } finally {
      setIsTyping(false);
      currentStreamRef.current = null;
    }
  }, []);
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    
    const userMessageContent = inputValue.trim();
    setInputValue('');
    
    await streamChatResponse(userMessageContent, activeConversation);
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
  
  return (
    <>
      <LoginModal onLogin={handleAuthChange} />
      
      {isAuthenticated && (
        <div className=" h-screen bg-gray-900 text-white overflow-auto" dir="rtl">
          {(sidebarOpen || showFileUpload) && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => {
                setSidebarOpen(false);
                setShowFileUpload(false);
              }}
            />
          )}
          
          <ChatSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            newConversation={newConversation}
            showFileUpload={showFileUpload}
            setShowFileUpload={setShowFileUpload}
            handleLogout={handleLogout}
            documents={documents}
            loading={loading}
            conversations={conversations}
            activeConversation={activeConversation}
            switchConversation={switchConversation}
            editingTitle={editingTitle}
            setEditingTitle={setEditingTitle}
            editingTitleValue={editingTitleValue}
            setEditingTitleValue={setEditingTitleValue}
            handleTitleSave={handleTitleSave}
            handleTitleCancel={handleTitleCancel}
            handleDeleteThread={handleDeleteThread}
            handleTitleEdit={handleTitleEdit}
          />
          
          {showFileUpload && (
            <div className={`
              fixed inset-y-0 left-0 z-50 w-full md:w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto
              transform transition-transform duration-300 ease-in-out
              ${showFileUpload ? 'translate-x-0' : '-translate-x-full'}
            `}>
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
          
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            stopStreaming={stopStreaming}
            messagesEndRef={messagesEndRef}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeConversation={activeConversation}
            conversations={conversations}
            uploadedFiles={uploadedFiles}
          />
          
          <ChatInput 
            sidebarOpen={sidebarOpen}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSubmit={handleSubmit}
            handleKeyPress={handleKeyPress}
            isTyping={isTyping}
            inputRef={inputRef}
          />
        </div>
      )}
    </>
  );
};
export default ChatGPTInterface;
