"use client";

import { useRef, useState } from "react";

interface MultiImageUploadProps {
  onImagesSelect: (dataUris: string[]) => void;
  disabled?: boolean;
  imagePreviews: string[];
}

export default function MultiImageUpload({ onImagesSelect, disabled, imagePreviews }: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFilesChange = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length === 0) return;

    const totalImages = imagePreviews.length + validFiles.length;
    const filesToProcess = validFiles.slice(0, Math.max(0, 4 - imagePreviews.length));

    if (totalImages > 4) {
      // Only take what we can fit
    }

    const promises = filesToProcess.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        })
    );

    Promise.all(promises).then((newDataUris) => {
      onImagesSelect([...imagePreviews, ...newDataUris].slice(0, 4));
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesChange(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFilesChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    const newImages = imagePreviews.filter((_, i) => i !== index);
    onImagesSelect(newImages);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/jpeg,image/jpg,image/png"
        multiple
        className="hidden"
        disabled={disabled}
      />

      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-600"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {imagePreviews.length < 4 && (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragOver ? "border-purple-400 bg-purple-500/10" : "border-gray-600 hover:border-gray-500"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="space-y-2">
            <svg
              className="w-10 h-10 mx-auto text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-400">
              {imagePreviews.length === 0
                ? "Drag and drop images, or click to browse"
                : `Add more images (${4 - imagePreviews.length} remaining)`}
            </p>
            <p className="text-xs text-gray-500">
              Upload 1-4 images of the same object from different angles
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        {imagePreviews.length}/4 images selected
      </p>
    </div>
  );
}
