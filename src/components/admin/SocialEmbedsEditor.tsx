import { useState } from "react";
import { PlusCircle, X } from "lucide-react";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "spotify", label: "Spotify" },
  { value: "facebook", label: "Facebook" },
] as const;

export interface SocialEmbed {
  platform: string;
  embed_url: string;
  embed_code: string;
}

interface SocialEmbedsEditorProps {
  embeds: SocialEmbed[];
  onChange: (embeds: SocialEmbed[]) => void;
}

const SocialEmbedsEditor = ({ embeds, onChange }: SocialEmbedsEditorProps) => {
  const [adding, setAdding] = useState(false);
  const [newEmbed, setNewEmbed] = useState<SocialEmbed>({
    platform: "instagram",
    embed_url: "",
    embed_code: "",
  });

  const addEmbed = () => {
    if (!newEmbed.embed_url && !newEmbed.embed_code) return;
    onChange([...embeds, { ...newEmbed }]);
    setNewEmbed({ platform: "instagram", embed_url: "", embed_code: "" });
    setAdding(false);
  };

  const removeEmbed = (idx: number) => {
    onChange(embeds.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {embeds.map((embed, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/20"
        >
          <span className="text-xs font-semibold uppercase text-muted-foreground w-20 flex-shrink-0">
            {embed.platform}
          </span>
          <span className="text-sm text-foreground truncate flex-1">
            {embed.embed_url || embed.embed_code.substring(0, 60) + "..."}
          </span>
          <button
            type="button"
            onClick={() => removeEmbed(idx)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Platform</label>
              <select
                value={newEmbed.platform}
                onChange={(e) => setNewEmbed({ ...newEmbed, platform: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">URL</label>
              <input
                type="url"
                value={newEmbed.embed_url}
                onChange={(e) => setNewEmbed({ ...newEmbed, embed_url: e.target.value })}
                placeholder="https://..."
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Custom Embed Code <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={newEmbed.embed_code}
              onChange={(e) => setNewEmbed({ ...newEmbed, embed_code: e.target.value })}
              placeholder='<iframe src="..." />'
              rows={3}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addEmbed}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
            >
              Add Embed
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-4 py-2 border border-border text-sm rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <PlusCircle className="h-4 w-4" />
          Add Embed
        </button>
      )}
    </div>
  );
};

export default SocialEmbedsEditor;
