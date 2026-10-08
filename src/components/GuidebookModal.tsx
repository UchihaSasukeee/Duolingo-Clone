import { X, BookOpen } from "lucide-react";
import { Button } from "./Button";

interface GuidebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitTitle: string;
  unitDescription: string;
  guidebook: string | null;
}

export function GuidebookModal({ isOpen, onClose, unitTitle, unitDescription, guidebook }: GuidebookModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-neutral-200 relative flex flex-col gap-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-x-3 pr-8">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-neutral-800">{unitTitle}</h2>
            <p className="text-sm font-bold text-neutral-500">{unitDescription}</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 text-neutral-700 font-medium text-base leading-relaxed">
          <h4 className="font-extrabold text-emerald-800 text-sm uppercase tracking-wider mb-2">Key Concepts & Grammar Tips</h4>
          <p className="whitespace-pre-line text-neutral-800 font-semibold">{guidebook || "Master these lessons through repetitive practice. Remember to pay close attention to articles and pronunciation!"}</p>
        </div>

        <Button variant="secondary" onClick={onClose} className="w-full">
          GOT IT
        </Button>
      </div>
    </div>
  );
}
