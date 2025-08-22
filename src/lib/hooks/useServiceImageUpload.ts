import { useState } from 'react';
import { uploadServiceImages } from '../services/imageUploadService';

export const useServiceImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleUpload = async () => {
    setIsUploading(true);
    try {
      await uploadServiceImages();
    } finally {
      setIsUploading(false);
    }
  };
  
  return {
    isUploading,
    uploadImages: handleUpload
  };
};