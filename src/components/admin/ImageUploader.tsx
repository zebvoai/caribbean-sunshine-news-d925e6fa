import { useState, useRef } from "react";
import { Upload, Link, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
import { toast } from "sonner";

interface ImageUploaderProps {
  imageUrl: string;
  imageAlt: string;
  onImageUrlChange: (url: string) => void;
  onImageAltChange: (alt: string) => void;
}

const ImageUploader = ({
  imageUrl,
  imageAlt,
  onImageUrlChange,
  onImageAltChange,
}: ImageUploaderProps) => {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(imageUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, GIF, and WebP images are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Use a timeout to prevent hanging forever
      const uploadPromise = supabase.storage
        .from("article-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Upload timed out after 30 seconds")), 30000)
      );

      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("article-images").getPublicUrl(path);
      onImageUrlChange(data.publicUrl);
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      console.error("Image upload error:", err);
      toast.error(err.message || "Upload failed — check connection or try a smaller image");
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleUrlApply = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      onImageUrlChange("");
      return;
    }
    if (trimmed.startsWith("data:")) {
      toast.error("Base64 image URLs are not supported. Please upload the image instead.");
      return;
    }
    onImageUrlChange(trimmed);
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      {imageUrl && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img
            src={getProxiedAssetUrl(imageUrl)}
            alt={imageAlt || "Cover preview"}
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={() => { onImageUrlChange(""); setUrlInput(""); }}
            className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "upload"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "url"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link className="h-4 w-4" />
          Paste URL
        </button>
      </div>

      {tab === "upload" ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-foreground">Uploading… please wait</span>
                <span className="text-xs text-muted-foreground">This may take a few seconds</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Click to upload image</span>
                <span className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP — max 10MB</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={handleUrlApply}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {/* Alt text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Image Alt Text <span className="text-muted-foreground font-normal">(SEO & accessibility)</span>
        </label>
        <input
          type="text"
          value={imageAlt}
          onChange={(e) => onImageAltChange(e.target.value)}
          placeholder="Describe the image..."
          className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );
};

export default ImageUploader;
