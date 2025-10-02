export const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  if (['csv', 'xls', 'xlsx'].includes(extension)) return '📊';
  return '📎';
};

export const validateFile = (file) => {
  const supportedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (!supportedTypes.includes(file.type)) {
    return `نوع فایل "${file.type}" پشتیبانی نمی‌شود. لطفاً فقط فایل‌های CSV یا Excel آپلود کنید.`;
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'حجم فایل باید کمتر از ۱۰ مگابایت باشد.';
  }
  return null;
};
