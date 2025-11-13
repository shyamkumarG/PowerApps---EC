import { useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

interface FileUploadProps {
  title: string;
  accept: string;
  icon: ReactNode;
  file?: File | null;
  files?: File[];
  onFileSelect?: (file: File | null) => void;
  onFilesSelect?: (files: File[]) => void;
  multiple?: boolean;
  description: string;
}

export default function FileUpload({
  title,
  accept,
  icon,
  file,
  files,
  onFileSelect,
  onFilesSelect,
  multiple = false,
  description,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    if (multiple && onFilesSelect) {
      onFilesSelect(Array.from(selectedFiles));
    } else if (!multiple && onFileSelect && selectedFiles[0]) {
      onFileSelect(selectedFiles[0]);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple && onFilesSelect) {
      onFilesSelect([]);
    } else if (onFileSelect) {
      onFileSelect(null);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const hasFiles = multiple ? (files && files.length > 0) : file;

  return (
    <div>
      <h3 className="font-semibold text-slate-700 mb-2">{title}</h3>
      <div
        onClick={handleClick}
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer
                   hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="text-slate-400">{icon}</div>
          {hasFiles ? (
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded">
                <span className="text-sm text-slate-700 truncate">
                  {multiple
                    ? `${files?.length} file(s) selected`
                    : file?.name}
                </span>
                <button
                  onClick={handleRemove}
                  className="text-slate-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">{description}</p>
              <p className="text-xs text-slate-400">
                Click to browse or drag and drop
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
