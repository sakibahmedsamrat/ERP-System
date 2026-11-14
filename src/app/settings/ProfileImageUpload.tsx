'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { updateProfileImage, removeProfileImage } from './actions';

/**
 * Resizes and compresses any image client-side to a crisp ~25KB JPEG.
 * Prevents server action body payload limits, database bottlenecks, and timeout issues.
 */
function compressImage(file: File, maxSize = 320, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select an image file (JPG, PNG, WebP)'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image file'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        // Fill background white in case of transparent PNG/WebP
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileImageUpload({ 
  currentImage,
  userId
}: { 
  currentImage?: string | null;
  userId?: string;
}) {
  const [image, setImage] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  // Sync with prop when server data arrives
  useEffect(() => {
    if (currentImage !== undefined) {
      setImage(currentImage);
      if (userId) {
        try {
          if (currentImage) {
            localStorage.setItem(`erp_avatar_${userId}`, currentImage);
          } else {
            localStorage.removeItem(`erp_avatar_${userId}`);
          }
        } catch {}
      }
    } else if (userId) {
      try {
        const cached = localStorage.getItem(`erp_avatar_${userId}`);
        if (cached) {
          setImage((prev) => prev || cached);
        }
      } catch {}
    }
  }, [currentImage, userId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB raw file before client compression)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB");
      return;
    }

    const previousImage = image;
    setIsUploading(true);

    try {
      // 1. Compress image to clean, high-performance JPEG avatar
      const compressedBase64 = await compressImage(file, 320, 0.85);

      // 2. Instantly update preview in Settings
      setImage(compressedBase64);

      // 3. Instantly notify top Header and layout components in real time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('erp-avatar-updated', {
            detail: { profileImage: compressedBase64, userId },
          })
        );
        if (userId) {
          try {
            localStorage.setItem(`erp_avatar_${userId}`, compressedBase64);
          } catch {}
        }
      }

      // 4. Persist to database
      const res = await updateProfileImage(compressedBase64);
      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }

      router.refresh();
    } catch (error: any) {
      console.error("Upload failed", error);
      setImage(previousImage);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('erp-avatar-updated', {
            detail: { profileImage: previousImage, userId },
          })
        );
        if (userId && previousImage) {
          try {
            localStorage.setItem(`erp_avatar_${userId}`, previousImage);
          } catch {}
        } else if (userId) {
          try {
            localStorage.removeItem(`erp_avatar_${userId}`);
          } catch {}
        }
      }
      alert(error?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;
    const previousImage = image;
    setIsUploading(true);

    try {
      setImage(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('erp-avatar-updated', {
            detail: { profileImage: null, userId },
          })
        );
        if (userId) {
          try {
            localStorage.removeItem(`erp_avatar_${userId}`);
          } catch {}
        }
      }

      const res = await removeProfileImage();
      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }
      router.refresh();
    } catch (error: any) {
      console.error("Remove failed", error);
      setImage(previousImage);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('erp-avatar-updated', {
            detail: { profileImage: previousImage, userId },
          })
        );
        if (userId && previousImage) {
          try {
            localStorage.setItem(`erp_avatar_${userId}`, previousImage);
          } catch {}
        }
      }
      alert(error?.message || "Failed to remove photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
      <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 group">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <Camera size={32} className="text-gray-400" />
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        )}

        <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer z-20">
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

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-800">Profile Picture</h3>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
          Upload a clear photo to help team members recognize you. Supports JPG, PNG, and WebP up to 5MB.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer">
            <Camera size={14} />
            <span>Upload Photo</span>
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
              onChange={handleFileChange} 
              disabled={isUploading}
            />
          </label>
          {image && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
