"use client";
import { useEffect } from "react";

type Props = {
  onUploaded: (url: string) => void;
};

export default function UploadWidget({ onUploaded }: Props) {
  useEffect(() => {
    // Load widget script lazily
    const s = document.createElement("script");
    s.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    s.async = true;
    s.onload = () => {
      // @ts-ignore
      const cloudinary = (window as any).cloudinary;
      const widget = cloudinary.createUploadWidget(
        { 
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dvpm2vr2q", 
          uploadPreset: "socialapp_unsigned" 
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            onUploaded(result.info.secure_url as string);
          }
        }
      );
      widget.open();
    };
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, [onUploaded]);

  return null;
}


