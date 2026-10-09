'use client'

import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { updateProfileImage } from './actions';

export default function ProfileImageUpload({ currentImage }: { currentImage?: string | null }) {
  const [image, setImage] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImage(base64);
      setIsUploading(true);
      try {
        await updateProfileImage(base64);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed. Try again.");
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-6 mb-6">
      <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 group">
        {image ? (
          <img src={image} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <Camera size={32} className="text-gray-400" />
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        )}

        <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
          <Camera size={20} className="mb-1" />
          <span className="text-xs font-semibold">Change</span>
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
            onChange={handleFileChange} 
            disabled={isUploading}
          />
        </label>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">Profile Picture</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Upload a clear photo to help your team members recognize you. Max size 2MB (JPG, PNG).
        </p>
      </div>
    </div>
  );
}
