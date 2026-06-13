import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let sequence = "";
    let timeoutId: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("open-command-palette"));
        return;
      }

      switch (e.key) {
        case "c":
          e.preventDefault();
          document.dispatchEvent(new CustomEvent("open-compose"));
          break;
        case "/":
          e.preventDefault();
          document.dispatchEvent(new CustomEvent("focus-search"));
          break;
        case "j":
          e.preventDefault();
          document.dispatchEvent(new CustomEvent("email-next"));
          break;
        case "k":
          e.preventDefault();
          document.dispatchEvent(new CustomEvent("email-prev"));
          break;
        case "r":
          e.preventDefault();
          document.dispatchEvent(new CustomEvent("email-reply"));
          break;
        case "e":
          e.preventDefault();
          document.dispatchEvent(new CustomEvent("email-archive"));
          break;
        case "u":
          e.preventDefault();
          document.dispatchEvent(new CustomEvent("email-unread"));
          break;
        case "Escape":
          document.dispatchEvent(new CustomEvent("close-modals"));
          break;
        default:
          break;
      }

      if (e.key.length === 1) {
        sequence += e.key;
        clearTimeout(timeoutId);

        if (sequence === "gi") {
          router.push("/inbox");
          sequence = "";
        } else if (sequence === "gc") {
          router.push("/calendar");
          sequence = "";
        } else if (sequence === "ga") {
          router.push("/agent");
          sequence = "";
        }

        timeoutId = setTimeout(() => {
          sequence = "";
        }, 1000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [router]);
}
