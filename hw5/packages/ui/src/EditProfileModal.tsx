"use client";

import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  bannerImage: string | null;
}

interface EditProfileModalProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditProfileModal({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditProfileModalProps) {
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [image, setImage] = useState(user.image || "");
  const [bannerImage, setBannerImage] = useState(user.bannerImage || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const prevOpenRef = useRef(false);
  const widgetOpenRef = useRef(false);
  const [widgetIsOpen, setWidgetIsOpen] = useState(false);

  // Only initialize state when modal opens (open changes from false to true)
  // This prevents state from being reset when user prop changes while modal is open
  useEffect(() => {
    const wasClosed = !prevOpenRef.current;
    if (open && wasClosed) {
      // Modal just opened, initialize with user data
      setName(user.name || "");
      setBio(user.bio || "");
      setImage(user.image || "");
      setBannerImage(user.bannerImage || "");
      setError("");
    }
    prevOpenRef.current = open;
  }, [open]); // Only depend on open, not user - prevents state reset during upload

  const [cloudinaryReady, setCloudinaryReady] = useState(false);

  useEffect(() => {
    // Check if Cloudinary is already loaded
    if ((window as any).cloudinary) {
      setCloudinaryReady(true);
      return;
    }

    // Check if script is already loading
    if (document.querySelector('script[src="https://widget.cloudinary.com/v2.0/global/all.js"]')) {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if ((window as any).cloudinary) {
          setCloudinaryReady(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Load Cloudinary script
    const script = document.createElement("script");
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    script.onload = () => {
      setCloudinaryReady(true);
    };
    document.body.appendChild(script);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          bio: bio.trim() || undefined,
          image: image || undefined,
          bannerImage: bannerImage || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.text();
        throw new Error(data || "Failed to update profile");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root 
      open={open} 
      onOpenChange={(newOpen) => {
        // Prevent closing dialog when widget is open
        if (!newOpen && widgetIsOpen) {
          return;
        }
        onOpenChange(newOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          style={{ 
            pointerEvents: widgetIsOpen ? 'none' : 'auto'
          }}
        />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black border border-x-border p-6 max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            // Prevent closing when widget is open
            if (widgetIsOpen) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing when widget is open
            if (widgetIsOpen) {
              e.preventDefault();
            }
          }}
          style={{
            // Don't disable pointer events on the content itself, 
            // as it might interfere with Cloudinary widget
            zIndex: widgetIsOpen ? 50 : 50
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold text-x-text">
              Edit Profile
            </Dialog.Title>
            <Dialog.Close asChild>
              <button 
                className="rounded-full p-2 hover:bg-x-hover text-x-text"
                disabled={widgetIsOpen}
                style={{ 
                  pointerEvents: widgetIsOpen ? 'none' : 'auto',
                  opacity: widgetIsOpen ? 0.5 : 1
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            style={{ 
              pointerEvents: widgetIsOpen ? 'none' : 'auto',
              opacity: widgetIsOpen ? 0.7 : 1
            }}
          >
            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-x-text mb-2">
                Banner
              </label>
              <div className="relative h-48 w-full overflow-hidden rounded-lg bg-x-border">
                {bannerImage ? (
                  <img
                    key={bannerImage}
                    src={bannerImage}
                    alt="Banner"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error("Failed to load banner image:", bannerImage);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-500" />
                )}
                <button
                  type="button"
                  disabled={!cloudinaryReady || widgetOpenRef.current}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!cloudinaryReady) {
                      alert("Cloudinary widget is loading, please wait...");
                      return;
                    }

                    const cloudinary = (window as any).cloudinary;
                    if (!cloudinary) {
                      alert("Cloudinary widget is not available");
                      return;
                    }

                    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dvpm2vr2q";
                    widgetOpenRef.current = true;
                    setWidgetIsOpen(true);

                    const widget = cloudinary.createUploadWidget(
                      {
                        cloudName: cloudName,
                        uploadPreset: "socialapp_unsigned",
                        sources: ["local", "camera"],
                        multiple: false,
                        cropping: true,
                        croppingAspectRatio: 16 / 9,
                        showSkipCropButton: false,
                      },
                      (error: any, result: any) => {
                        // Log all events for debugging
                        if (result?.event) {
                          console.log(`[Banner] Cloudinary event: "${result.event}"`, result.info ? `URL: ${result.info?.secure_url || result.info?.url}` : '');
                        }
                        
                        // Handle errors
                        if (error && error.status !== "success") {
                          console.error("Cloudinary upload error:", error);
                          widgetOpenRef.current = false;
                          setWidgetIsOpen(false);
                          return;
                        }

                        // Handle success - this is the main event we care about
                        if (result && result.event === "success" && result.info) {
                          const newUrl = result.info.secure_url || result.info.url;
                          if (newUrl) {
                            console.log("[Banner] Setting new image URL:", newUrl);
                            // Update state immediately - use functional update to ensure we get latest state
                            setBannerImage((prev) => {
                              console.log("[Banner] Previous bannerImage:", prev, "New:", newUrl);
                              return newUrl;
                            });
                          }
                          widgetOpenRef.current = false;
                          setWidgetIsOpen(false);
                        }
                        
                        // Handle close event
                        if (result && result.event === "close") {
                          widgetOpenRef.current = false;
                          setWidgetIsOpen(false);
                        }
                      }
                    );
                    
                    console.log("Opening Cloudinary widget for banner");
                    widget.open();
                  }}
                  className="absolute bottom-4 right-4 rounded-full border border-x-border bg-black/50 px-4 py-2 text-sm font-bold text-x-text hover:bg-black/70 backdrop-blur-sm z-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!cloudinaryReady ? "Loading..." : widgetOpenRef.current ? "Uploading..." : bannerImage ? "Change" : "Upload"} Banner
                </button>
              </div>
            </div>

            {/* Avatar Upload */}
            <div className="flex justify-center -mt-20 relative z-10">
              <div className="relative">
                <div className="h-32 w-32 rounded-full border-4 border-black bg-x-border overflow-hidden">
                  {image ? (
                    <img
                      key={image}
                      src={image}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.error("Failed to load avatar image:", image);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-x-border" />
                  )}
                </div>
                <button
                  type="button"
                  disabled={!cloudinaryReady || widgetOpenRef.current}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!cloudinaryReady) {
                      alert("Cloudinary widget is loading, please wait...");
                      return;
                    }

                    const cloudinary = (window as any).cloudinary;
                    if (!cloudinary) {
                      alert("Cloudinary widget is not available");
                      return;
                    }

                    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dvpm2vr2q";
                    widgetOpenRef.current = true;
                    setWidgetIsOpen(true);

                    const widget = cloudinary.createUploadWidget(
                      {
                        cloudName: cloudName,
                        uploadPreset: "socialapp_unsigned",
                        sources: ["local", "camera"],
                        multiple: false,
                        cropping: true,
                        croppingAspectRatio: 1,
                        showSkipCropButton: false,
                      },
                      (error: any, result: any) => {
                        // Log all events for debugging
                        if (result?.event) {
                          console.log(`[Avatar] Cloudinary event: "${result.event}"`, result.info ? `URL: ${result.info?.secure_url || result.info?.url}` : '');
                        }
                        
                        // Handle errors
                        if (error && error.status !== "success") {
                          console.error("Cloudinary upload error:", error);
                          widgetOpenRef.current = false;
                          setWidgetIsOpen(false);
                          return;
                        }

                        // Handle success - this is the main event we care about
                        if (result && result.event === "success" && result.info) {
                          const newUrl = result.info.secure_url || result.info.url;
                          if (newUrl) {
                            console.log("[Avatar] Setting new image URL:", newUrl);
                            // Update state immediately - use functional update to ensure we get latest state
                            setImage((prev) => {
                              console.log("[Avatar] Previous image:", prev, "New:", newUrl);
                              return newUrl;
                            });
                          }
                          widgetOpenRef.current = false;
                          setWidgetIsOpen(false);
                        }
                        
                        // Handle close event
                        if (result && result.event === "close") {
                          widgetOpenRef.current = false;
                          setWidgetIsOpen(false);
                        }
                      }
                    );
                    
                    console.log("Opening Cloudinary widget for avatar");
                    widget.open();
                  }}
                  className="absolute bottom-0 right-0 rounded-full border-2 border-black bg-primary p-2 text-white hover:bg-primary/90 z-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-x-text mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full rounded-lg border border-x-border bg-transparent px-4 py-2 text-x-text placeholder-x-textSecondary focus:border-primary focus:outline-none"
                placeholder="Your name"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-x-text mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={4}
                className="w-full rounded-lg border border-x-border bg-transparent px-4 py-2 text-x-text placeholder-x-textSecondary focus:border-primary focus:outline-none resize-none"
                placeholder="Tell us about yourself"
              />
              <div className="text-right text-xs text-x-textSecondary mt-1">
                {bio.length}/160
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={widgetIsOpen}
                  className="rounded-full border border-x-border px-4 py-2 font-bold text-x-text hover:bg-x-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    pointerEvents: widgetIsOpen ? 'none' : 'auto'
                  }}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading || widgetIsOpen}
                className="rounded-full bg-x-text px-4 py-2 font-bold text-black hover:bg-x-textSecondary disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  pointerEvents: widgetIsOpen ? 'none' : 'auto'
                }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

