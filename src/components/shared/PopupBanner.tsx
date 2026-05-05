import { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listPopups, getPopupById, incrementPopupImpression, incrementPopupClick, getFileView, listGroups } from "@/services/appwrite";
import type { Popup, WhatsAppGroup } from "@/types";
import { POPUP_COOLDOWN_DAYS } from "@/lib/constants";

export default function PopupBanner() {
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [group, setGroup] = useState<WhatsAppGroup | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPopup();
  }, []);

  async function loadPopup() {
    try {
      const popups = await listPopups(true);
      if (popups.length === 0) return;

      for (const p of popups) {
        if (!hasCookie(p.id)) {
          setPopup(p);
          if (p.type === "image" && p.imageId) {
            const url = getFileView(p.imageId);
            setImageUrl(url as string);
          } else if (p.type === "group" && p.groupId) {
            try {
              const groups = await listGroups();
              const found = groups.find((g) => g.id === p.groupId);
              if (found) {
                setGroup(found);
                if (found.imageId) {
                  const url = getFileView(found.imageId);
                  setImageUrl(url as string);
                }
              }
            } catch {
              // ignore
            }
          }
          setOpen(true);
          incrementPopupImpression(p.id).catch(() => {});
          break;
        }
      }
    } catch {
      // ignore
    }
  }

  function getCookieName(popupId: string): string {
    return `popup_seen_${popupId}`;
  }

  function hasCookie(popupId: string): boolean {
    const name = getCookieName(popupId);
    const cookies = document.cookie.split(";");
    return cookies.some((c) => c.trim().startsWith(name + "="));
  }

  function setCookie(popupId: string) {
    const name = getCookieName(popupId);
    const maxAge = POPUP_COOLDOWN_DAYS * 24 * 60 * 60;
    document.cookie = `${name}=1; max-age=${maxAge}; path=/`;
  }

  function handleClose() {
    if (popup) {
      setCookie(popup.id);
    }
    setOpen(false);
  }

  function handleImageClick() {
    if (popup && popup.linkUrl) {
      incrementPopupClick(popup.id).catch(() => {});
      window.open(popup.linkUrl, "_blank");
    }
  }

  function handleGroupClick() {
    if (popup) {
      incrementPopupClick(popup.id).catch(() => {});
    }
    if (group) {
      window.open(group.link, "_blank");
    }
  }

  if (!popup) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden" onEscapeKeyDown={handleClose}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-white/80 hover:bg-white p-2 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {popup.type === "image" ? (
          <>
            {popup.heading && (
              <DialogHeader className="px-6 pt-6">
                <DialogTitle>{popup.heading}</DialogTitle>
              </DialogHeader>
            )}
            {popup.description && (
              <DialogDescription className="px-6">
                {popup.description}
              </DialogDescription>
            )}
            <div className="px-6 py-4">
              {imageUrl && (
                <button
                  onClick={handleImageClick}
                  className="w-full rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
                >
                  <img src={imageUrl} alt={popup.heading || "popup"} className="w-full h-auto" />
                </button>
              )}
            </div>
            <div className="px-6 pb-6">
              <Button onClick={handleImageClick} className="w-full">
                {popup.linkUrl ? "Saiba mais" : "Fechar"}
              </Button>
            </div>
          </>
        ) : (
          <>
            {group && (
              <div className="p-6">
                {group.imageId && imageUrl && (
                  <div className="w-full h-32 rounded-lg overflow-hidden mb-4">
                    <img src={imageUrl} alt={group.title} className="w-full h-full object-cover" />
                  </div>
                )}
                {!group.imageId && (
                  <div className="w-full h-32 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                    <MessageCircle className="h-16 w-16 text-green-600" />
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2">{group.title}</h3>
                {group.description && <p className="text-sm text-muted-foreground mb-4">{group.description}</p>}
                <Button onClick={handleGroupClick} className="w-full bg-green-600 hover:bg-green-700">
                  Entrar no grupo
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
