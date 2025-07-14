import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";
import Image from "next/image";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = file.type.startsWith("image/");

  return (
    <div className="relative inline-flex flex-col items-center justify-center bg-muted/50 rounded-xl border border-border p-2 text-foreground h-28 w-28 overflow-hidden shrink-0 transition-colors">
      {isImage ? (
        <Image
          src={URL.createObjectURL(file)}
          fill
          alt={file.name}
          className="h-full w-full object-cover rounded-md"
          onLoad={(e) =>
            URL.revokeObjectURL((e.target as HTMLImageElement).src)
          } // Clean up object URL
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-muted-foreground" />
          <span className="text-xs mt-2 break-all w-full px-1 text-foreground">
            {file.name}
          </span>
        </div>
      )}
      <Button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-background/80 hover:bg-muted/80 text-foreground rounded-full p-0.5 transition-all duration-200 border border-border/50"
        aria-label="Remove file"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
