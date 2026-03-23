import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import NeumorphicAvatar from '@/components/ui/NeumorphicAvatar';

export default function AvatarUpload({ src, initials, size = 'xl', onImageSelected }) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageSelected?.(file);
    e.target.value = '';
  };

  return (
    <div className="relative inline-block cursor-pointer" onClick={handleClick}>
      <NeumorphicAvatar src={src} initials={initials} size={size} />
      <div
        className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{
          background: '#2f949d',
          color: '#fff',
          boxShadow: 'var(--nm-shadow-main)',
          border: '2px solid var(--nm-background)',
        }}
      >
        <Camera className="w-3.5 h-3.5" />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}