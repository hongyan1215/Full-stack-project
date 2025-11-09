"use client";

import { useEffect, useState, useRef } from "react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  label?: string;
}

export function ImageUpload({ onUpload, currentImage, label }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(currentImage || "");
  const widgetOpenRef = useRef(false);
  const [widgetIsOpen, setWidgetIsOpen] = useState(false);
  const uploadCountRef = useRef(0);

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

  // Ensure Cloudinary widget is interactive when it opens
  useEffect(() => {
    if (!widgetIsOpen) return;

    const makeWidgetInteractive = () => {
      // Find all Cloudinary widget elements
      const cloudinaryElements = document.querySelectorAll(
        'iframe[src*="cloudinary"], div[id*="uw_widget"], div[class*="uw_widget"], [data-testid="upload_widget"]'
      );

      cloudinaryElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Set high z-index and ensure pointer events
        htmlEl.style.zIndex = '99999';
        htmlEl.style.pointerEvents = 'auto';
        htmlEl.style.position = 'fixed';

        // Also set for parent elements
        let parent = htmlEl.parentElement;
        while (parent && parent !== document.body) {
          parent.style.zIndex = '99999';
          parent.style.pointerEvents = 'auto';
          parent = parent.parentElement;
        }
      });

      // Find all buttons and interactive elements in Cloudinary widget
      const cloudinaryButtons = document.querySelectorAll(
        'div[id*="uw_widget"] button, div[class*="uw_widget"] button, div[id*="uw_widget"] a, div[class*="uw_widget"] a'
      );

      cloudinaryButtons.forEach((btn) => {
        const htmlBtn = btn as HTMLElement;
        htmlBtn.style.pointerEvents = 'auto';
        htmlBtn.style.cursor = 'pointer';
        htmlBtn.style.zIndex = '99999';
      });
    };

    // Run immediately and also after a short delay to catch dynamically added elements
    makeWidgetInteractive();
    const interval = setInterval(makeWidgetInteractive, 100);

    return () => {
      clearInterval(interval);
    };
  }, [widgetIsOpen]);

  const handleClick = () => {
    const cloudinary = (window as any).cloudinary;
    if (!cloudinary) {
      alert("Cloudinary widget is loading, please try again");
      return;
    }

    if (widgetOpenRef.current) {
      return; // Prevent opening multiple widgets
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dvpm2vr2q";
    widgetOpenRef.current = true;
    setWidgetIsOpen(true);
    uploadCountRef.current = 0; // Reset upload count

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
        // Log all events for debugging
        if (result?.event) {
          console.log(`[${label || 'Image'}] Cloudinary event: "${result.event}"`, result.info ? `URL: ${result.info?.secure_url || result.info?.url}` : '');
        }

        // Handle errors
        if (error && error.status !== "success") {
          console.error("Cloudinary upload error:", error);
          alert(`Upload failed: ${error.message || 'Unknown error'}`);
          widgetOpenRef.current = false;
          setWidgetIsOpen(false);
          return;
        }

        // Handle success - with cropping enabled, we get 2 success events:
        // 1st: Original image uploaded (for cropping)
        // 2nd: Cropped image uploaded (final result)
        if (result && result.event === "success" && result.info) {
          uploadCountRef.current += 1;
          const newUrl = result.info.secure_url || result.info.url;

          console.log(`[${label || 'Image'}] Success event #${uploadCountRef.current}, URL:`, newUrl);

          // With cropping enabled, wait for the 2nd success event (cropped image)
          if (uploadCountRef.current >= 2 && newUrl) {
            console.log(`[${label || 'Image'}] Setting cropped image URL:`, newUrl);
            // Use functional update to ensure we get latest state
            setImageUrl((prev) => {
              console.log(`[${label || 'Image'}] Previous image:`, prev, "New:", newUrl);
              return newUrl;
            });
            onUpload(newUrl);
            widgetOpenRef.current = false;
            setWidgetIsOpen(false);
          }
        }

        // Handle close event
        if (result && result.event === "close") {
          widgetOpenRef.current = false;
          setWidgetIsOpen(false);
        }
      }
    );

    console.log(`Opening Cloudinary widget for ${label || 'image'}`);
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

