import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import type { EditorState } from "lexical";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  Bold,
  Check,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const editorTheme = {
  paragraph: "mb-2",
  heading: {
    h2: "text-2xl font-bold mt-4 mb-2",
    h3: "text-xl font-semibold mt-3 mb-2",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
  },
  list: {
    ul: "list-disc list-inside mb-2 pl-4",
    ol: "list-decimal list-inside mb-2 pl-4",
    listitem: "mb-1",
  },
  quote: "border-l-4 border-primary pl-4 italic text-muted-foreground my-2",
  link: "text-primary underline hover:opacity-80",
};

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    strikethrough: false,
  });

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setActiveFormats({
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          strikethrough: selection.hasFormat("strikethrough"),
        });
      }
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  const formatHeading = useCallback(
    (level: "h2" | "h3") => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(level));
        }
      });
    },
    [editor]
  );

  const formatQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  }, [editor]);

  const applyLink = useCallback(() => {
    const url = linkUrl.trim();
    if (!url) return;
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalized);
    setLinkEditorOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b bg-muted/40 p-2 sm:gap-1.5">
      <ToolbarButton
        active={activeFormats.bold}
        title="Negrito"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={activeFormats.italic}
        title="Itálico"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={activeFormats.strikethrough}
        title="Tachado"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 w-px bg-border" />

      <ToolbarButton title="Título H2" onClick={() => formatHeading("h2")}>
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Título H3" onClick={() => formatHeading("h3")}>
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 w-px bg-border" />

      <ToolbarButton
        title="Lista"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Lista numerada"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Citação" onClick={formatQuote}>
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Link" onClick={() => setLinkEditorOpen((open) => !open)}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      {linkEditorOpen && (
        <div className="absolute left-2 top-12 z-20 flex w-[min(360px,calc(100vw-2rem))] items-center gap-2 rounded-md border bg-popover p-2 shadow-lg">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyLink();
              if (e.key === "Escape") setLinkEditorOpen(false);
            }}
            placeholder="https://exemplo.com"
            autoFocus
          />
          <Button type="button" size="sm" className="h-8 w-8 p-0" onClick={applyLink}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setLinkEditorOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="mx-1 w-px bg-border" />

      <ToolbarButton title="Desfazer" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Refazer" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  active,
  children,
  onClick,
  title,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      className="h-8 w-8 p-0"
      title={title}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function InitialHtmlPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();
  const loadedHtmlRef = useRef<string | null>(null);

  useEffect(() => {
    const incoming = html || "";
    if (loadedHtmlRef.current === incoming) return;

    editor.update(() => {
      const root = $getRoot();
      const hasUserContent = root.getTextContent().trim().length > 0;
      if (loadedHtmlRef.current !== null && hasUserContent) return;

      root.clear();
      if (incoming.trim()) {
        const parser = new DOMParser();
        const dom = parser.parseFromString(incoming, "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);
        root.append(...(nodes.length > 0 ? nodes : [$createParagraphNode()]));
      } else {
        root.append($createParagraphNode());
      }
      loadedHtmlRef.current = incoming;
    });
  }, [editor, html]);

  return null;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva o conteúdo do artigo...",
  className,
}: RichTextEditorProps) {
  const initialConfig = {
    namespace: "ArticleEditor",
    theme: editorTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
  };

  const handleChange = useCallback(
    (editorState: EditorState, editor: ReturnType<typeof useLexicalComposerContext>[0]) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        onChange(html);
      });
    },
    [onChange]
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={cn(
          "flex h-[calc(100vh-220px)] min-h-[520px] flex-col overflow-hidden rounded-md border border-input bg-background shadow-sm transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 max-lg:h-[calc(100vh-180px)] max-lg:min-h-[460px] max-sm:h-[70vh] max-sm:min-h-[360px]",
          "rich-text-editor",
          className
        )}
      >
        <ToolbarPlugin />
        <div className="relative min-h-0 flex-1">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label="Conteúdo da notícia"
                aria-multiline="true"
                role="textbox"
                className="prose prose-sm h-full min-h-full w-full max-w-none cursor-text overflow-y-auto px-4 py-3 text-sm outline-none focus:outline-none sm:px-5 sm:py-4"
              />
            }
            placeholder={
              <div className="pointer-events-none absolute left-4 top-3 select-none text-sm text-muted-foreground sm:left-5 sm:top-4">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <LinkPlugin />
        <ListPlugin />
        <InitialHtmlPlugin html={value} />
        <OnChangePlugin onChange={(state, editor) => handleChange(state, editor)} />
      </div>
    </LexicalComposer>
  );
}
