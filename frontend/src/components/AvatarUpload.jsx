import { useRef, useState } from 'react';
import { HiOutlineCamera, HiOutlineTrash } from 'react-icons/hi';
import Avatar from './Avatar';

/**
 * Avatar picker. Reads an image file, downscales it to a max 256px square,
 * compresses to JPEG, and returns a small base64 data URL via onChange.
 */
export default function AvatarUpload({ value, name, onChange, size = 96 }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Downscale to a 256px square, center-cropped
        const target = 256;
        const canvas = document.createElement('canvas');
        canvas.width = target;
        canvas.height = target;
        const ctx = canvas.getContext('2d');

        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, target, target);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        onChange(dataUrl);
      };
      img.onerror = () => setError('Could not read that image.');
      img.src = ev.target.result;
    };
    reader.onerror = () => setError('Could not read that file.');
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar src={value} name={name} size={size} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-ink text-white rounded-full flex items-center justify-center hover:bg-grey-8 transition-colors shadow"
          title="Change photo"
        >
          <HiOutlineCamera className="w-4 h-4" />
        </button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-brand-ink hover:text-brand-primary transition-colors"
        >
          {value ? 'Change photo' : 'Upload photo'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="ml-3 text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1"
          >
            <HiOutlineTrash className="w-3.5 h-3.5" /> Remove
          </button>
        )}
        <p className="text-xs text-brand-muted mt-1">JPG or PNG, up to 5MB</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
