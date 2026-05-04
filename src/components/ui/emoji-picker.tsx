import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_CATEGORIES = {
  "📰 Notícias": [
    "📰", "📺", "📻", "📡", "🗞️", "📢", "📣", "💬", "🗣️", "📝", "✍️", "📄", "📃", "📋", "📑",
  ],
  "🏛️ Governo": [
    "🏛️", "🏤", "🏢", "⚖️", "🔨", "📜", "🎖️", "🏅", "🥇", "🥈", "🥉", "👨‍⚖️", "👩‍⚖️", "🏆", "📋",
  ],
  "💰 Economia": [
    "💰", "💵", "💴", "💶", "💷", "💳", "🏦", "💸", "💲", "💱", "📈", "📉", "📊", "💹", "🤑",
  ],
  "🏥 Saúde": [
    "🏥", "⚕️", "💊", "💉", "🩺", "🩹", "🧬", "🦠", "🧘", "🏃", "🚴", "🏋️", "⛹️", "🤸", "❤️",
  ],
  "🎓 Educação": [
    "🎓", "🏫", "📚", "📖", "📕", "📗", "📘", "📙", "✏️", "✒️", "🖊️", "🖍️", "📐", "📏", "🎒",
  ],
  "⚽ Esportes": [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎳", "🏏", "🏑", "🏒", "🥍", "🏓",
  ],
  "🎬 Entretenimento": [
    "🎬", "🎥", "📹", "📷", "📸", "🎞️", "🎭", "🎪", "🎨", "🎤", "🎧", "🎮", "🎯", "🎲", "🎸",
  ],
  "🍔 Alimentos": [
    "🍔", "🍕", "🌭", "🥪", "🥙", "🧆", "🌮", "🌯", "🥗", "🍝", "🍜", "🍲", "🥘", "🍱", "🍛",
  ],
  "🚗 Transporte": [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🛻", "🚚", "🚛", "🚁", "✈️", "🚀",
  ],
  "🌍 Natureza": [
    "🌍", "🌎", "🌏", "🌿", "🍀", "🌱", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌻", "🌼", "🌞",
  ],
  "⭐ Populares": [
    "⭐", "🌟", "✨", "🎉", "🎊", "🎈", "🎁", "🎀", "❤️", "💕", "💖", "💗", "💓", "💞", "💘",
  ],
  "😊 Emojis": [
    "😊", "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  ],
};

export const CATEGORY_ICON_SUGGESTIONS: Record<string, string> = {
  politica: "🏛️",
  seguranca: "🚨",
  saude: "🏥",
  educacao: "🎓",
  economia: "💰",
  esportes: "⚽",
  entretenimento: "🎬",
  alimentos: "🍔",
  transporte: "🚗",
  natureza: "🌍",
  noticias: "📰",
  governo: "🏛️",
};

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
  categorySlug?: string;
}

export function EmojiPicker({ value, onChange, disabled, categorySlug }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("⭐ Populares");

  const suggestedEmoji = categorySlug ? CATEGORY_ICON_SUGGESTIONS[categorySlug.toLowerCase()] : undefined;

  const filteredEmojis = useMemo(() => {
    if (!search) {
      return EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || [];
    }
    const results: string[] = [];
    Object.values(EMOJI_CATEGORIES).forEach((emojis) => {
      results.push(...emojis);
    });
    return results;
  }, [search, activeCategory]);

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
      <PopoverContent className="w-96" align="start">
        <div className="space-y-3">
          <label className="text-sm font-medium">Selecione um emoji</label>

          {suggestedEmoji && (
            <button
              type="button"
              onClick={() => {
                onChange(suggestedEmoji);
                setOpen(false);
              }}
              className="w-full p-2 rounded bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-medium text-left"
            >
              💡 Sugestão: <span className="text-xl ml-2">{suggestedEmoji}</span>
            </button>
          )}

          {/* Search */}
          <Input
            placeholder="Buscar emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />

          {/* Category tabs */}
          {!search && (
            <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
              {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  type="button"
                >
                  {cat.split(" ")[0]}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div className="grid grid-cols-8 gap-1 max-h-56 overflow-y-auto">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                  setSearch("");
                }}
                className="text-2xl p-2 rounded hover:bg-muted transition-colors"
                type="button"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>

          {filteredEmojis.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Nenhum emoji encontrado
            </div>
          )}

          {/* Manual input */}
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
                  setSearch("");
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
