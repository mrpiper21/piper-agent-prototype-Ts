export const getFileType = (fileName: string) => {
  if (!fileName) return 'unknown';
  const lowerName = fileName.toLowerCase();
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  if (imageExtensions.some(ext => lowerName.endsWith(ext))) return 'image';
  
  if (lowerName.endsWith('.pdf')) return 'pdf';
  
  const documentExtensions = ['.doc', '.docx', '.txt', '.rtf'];
  if (documentExtensions.some(ext => lowerName.endsWith(ext))) return 'document';
  
  return 'unknown';
};

export const getStatusColor = (status: string, themeStyles: any) => {
  if (status === 'completed') return themeStyles.success;
  if (status === 'printing' || status === 'processing') return themeStyles.warning;
  if (status === 'failed') return themeStyles.error;
  return themeStyles.textSecondary;
};

