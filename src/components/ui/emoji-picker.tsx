import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const POPULAR_EMOJIS = [
  "🏛️", "📰", "⚖️", "🚨", "💰", "🏥", "🎓", "🌍",
  "⚽", "🎬", "🎮", "🍔", "🚗", "✈️", "🏨", "👔",
  "💼", "📱", "💻", "🔧", "⚡", "🌱", "🌊", "🔥",
  "❄️", "☀️", "🌙", "⭐", "🎉", "🎊", "🎈", "💝",
  "🏆", "🥇", "👍", "❤️", "💪", "🤝", "👨‍👩‍👧‍👦", "🏠",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPicker({ value, onChange, disabled }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-10 px-3"
        >
          <span className="text-xl">{value || "😊"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <label className="text-sm font-medium">Selecione um emoji</label>
          <div className="grid grid-cols-8 gap-2">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className="text-2xl p-2 rounded hover:bg-muted transition-colors"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t space-y-2">
            <label className="text-xs font-medium">Ou cole um emoji</label>
            <input
              type="text"
              placeholder="Cole aqui..."
              maxLength={4}
              defaultValue={value}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (text) {
                  onChange(text.slice(0, 4));
                  setOpen(false);
                }
              }}
              onChange={(e) => onChange(e.target.value.slice(0, 4))}
              className="h-9 w-full rounded border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
