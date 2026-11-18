import { useEffect, useId, type ReactNode } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: Props) {
  const titleId = useId();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        // only a click on the dark backdrop itself, not inside the window
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 id={titleId} className="mb-4 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
