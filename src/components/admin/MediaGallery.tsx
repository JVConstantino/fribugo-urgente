import { useEffect, useState } from "react";
import { listFiles, getFileView } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fileId: string, fileUrl: string) => void;
}

export function MediaGallery({ open, onOpenChange, onSelect }: MediaGalleryProps) {
  const [files, setFiles] = useState<Array<{ $id: string; name: string; $createdAt: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function loadFiles() {
      setLoading(true);
      try {
        const result = await listFiles();
        if (!cancelled) {
          setFiles(result.files || []);
          setSelectedFileId(null);
        }
      } catch (error) {
        console.error("Failed to load files:", error);
        if (!cancelled) setFiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFiles();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSelect = () => {
    if (selectedFileId) {
      const fileUrl = getFileView(selectedFileId);
      onSelect(selectedFileId, fileUrl);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Galeria de Mídia</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma imagem foi enviada ainda.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              {files.map((file) => {
                const isSelected = selectedFileId === file.$id;
                const imageUrl = getFileView(file.$id);

                return (
                  <button
                    key={file.$id}
                    onClick={() => setSelectedFileId(file.$id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-primary shadow-lg"
                        : "border-transparent hover:border-muted"
                    }`}
                    type="button"
                  >
                    <img
                      src={imageUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="text-white text-2xl">✓</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-3 space-y-1">
              {selectedFileId && (
                <>
                  {files.find((f) => f.$id === selectedFileId) && (
                    <>
                      <p>
                        <strong>Nome:</strong>{" "}
                        {files.find((f) => f.$id === selectedFileId)?.name}
                      </p>
                      <p>
                        <strong>Data:</strong>{" "}
                        {files.find((f) => f.$id === selectedFileId)?.$createdAt &&
                          new Date(
                            files.find((f) => f.$id === selectedFileId)?.$createdAt || ""
                          ).toLocaleDateString("pt-BR")}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSelect} disabled={!selectedFileId || loading}>
            Usar esta imagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
