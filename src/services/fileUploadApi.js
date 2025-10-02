export const uploadFileToApi = async (file, scope, threadId, apiBaseUrl, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`${apiBaseUrl}/upload-document/?scope=${scope}&thread_id=${threadId || ''}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Upload error:', err);
    throw new Error('آپلود فایل ناموفق بود. لطفاً دوباره تلاش کنید.');
  }
};

export const deleteFileFromApi = async (documentId, apiBaseUrl) => {
  try {
    const response = await fetch(`${apiBaseUrl}/documents/${documentId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('حذف فایل ناموفق بود. لطفاً دوباره تلاش کنید.');
  }
};
