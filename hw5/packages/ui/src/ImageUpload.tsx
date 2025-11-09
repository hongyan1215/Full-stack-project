"use client";

import { useEffect, useState } from "react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  label?: string;
}

export function ImageUpload({ onUpload, currentImage, label }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(currentImage || "");

  useEffect(() => {
    setImageUrl(currentImage || "");
  }, [currentImage]);

  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://widget.cloudinary.com/v2.0/global/all.js"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Only remove if we added it
      const existing = document.querySelector('script[src="https://widget.cloudinary.com/v2.0/global/all.js"]');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    };
  }, []);

  const handleClick = () => {
    const cloudinary = (window as any).cloudinary;
    if (!cloudinary) {
      alert("Cloudinary widget is loading, please try again");
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dvpm2vr2q";

    const widget = cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: "socialapp_unsigned",
        sources: ["local", "camera"],
        multiple: false,
        cropping: true,
        croppingAspectRatio: label === "Avatar" ? 1 : 16 / 9,
      },
      (error: any, result: any) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          alert(`Upload failed: ${error.message || 'Unknown error'}`);
          return;
        }
        if (result && result.event === "success") {
          const url = result.info.secure_url;
          setImageUrl(url);
          onUpload(url);
        }
      }
    );

    widget.open();
  };

  const isAvatar = label === "Avatar";

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-x-text">{label}</label>}
      <div className="relative">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Preview"
            className={
              isAvatar
                ? "h-32 w-32 rounded-full object-cover border-4 border-black"
                : "h-32 w-full rounded-lg object-cover"
            }
          />
        )}
        {!imageUrl && isAvatar && (
          <div className="h-32 w-32 rounded-full border-4 border-black bg-x-border" />
        )}
        {!imageUrl && !isAvatar && (
          <div className="h-32 w-full rounded-lg bg-x-border" />
        )}
        <button
          type="button"
          onClick={handleClick}
          className="mt-2 rounded-full border border-x-border bg-transparent px-4 py-2 text-sm font-bold text-x-text hover:bg-x-hover"
        >
          {imageUrl ? "Change Image" : "Upload Image"}
        </button>
      </div>
    </div>
  );
}

