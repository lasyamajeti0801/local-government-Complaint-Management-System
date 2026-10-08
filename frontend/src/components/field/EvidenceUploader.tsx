// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/components/field/EvidenceUploader.tsx
// Evidence upload component — extends M1 FileUploader pattern.
// Supports before/after photos, documents, field notes.
// =============================================================

import React, { useRef, useState, useId } from 'react';
import { useEvidenceUpload } from '../../hooks/useFieldTasks';
import { EVIDENCE_CATEGORY_LABELS, formatFileSize } from './fieldUtils';
import type { EvidenceItem } from '../../types/fieldTask.types';

interface Props {
  taskId:     string;
  onUploaded: (evidence: EvidenceItem) => void;
  defaultCategory?: string;
}

const ALLOWED_CATEGORIES = [
  'BEFORE_PHOTO',
  'AFTER_PHOTO',
  'FIELD_DOCUMENT',
  'FIELD_NOTES',
  'OTHER',
] as const;

const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.txt';

export const EvidenceUploader: React.FC<Props> = ({
  taskId,
  onUploaded,
  defaultCategory = 'BEFORE_PHOTO',
}) => {
  const inputRef    = useRef<HTMLInputElement>(null);
  const dropZoneId  = useId();

  const [category,    setCategory]    = useState(defaultCategory);
  const [description, setDescription] = useState('');
  const [dragOver,    setDragOver]    = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);

  const { upload, uploading, progress, uploadError, clearError } = useEvidenceUpload(
    taskId,
    (evidence) => {
      onUploaded(evidence);
      resetForm();
    }
  );

  function resetForm() {
    setSelectedFile(null);
    setDescription('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    clearError();
    // Image preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    await upload(selectedFile, category, description || undefined);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <span aria-hidden="true">📷</span>
        Upload Evidence
      </h3>

      {/* Category selector */}
      <div>
        <label htmlFor={`${dropZoneId}-category`} className="block text-xs font-medium text-gray-700 mb-1">
          Evidence Type <span className="text-red-500">*</span>
        </label>
        <select
          id={`${dropZoneId}-category`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="
            w-full text-sm border border-gray-300 rounded-md px-3 py-1.5
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
            bg-white text-gray-800
          "
          required
        >
          {ALLOWED_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {EVIDENCE_CATEGORY_LABELS[cat] ?? cat}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        id={dropZoneId}
        role="button"
        tabIndex={0}
        aria-label="Drop zone. Click or drag a file here."
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          transition-colors duration-150 cursor-pointer
          ${dragOver
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_TYPES}
          onChange={onInputChange}
          className="sr-only"
          aria-hidden="true"
        />

        {selectedFile ? (
          <div className="space-y-2">
            {/* Image preview */}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto max-h-40 rounded-md object-contain"
              />
            )}
            <p className="text-sm font-medium text-green-700">
              ✅ {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); resetForm(); }}
              className="text-xs text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-2xl" aria-hidden="true">☁️</p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to browse</span> or drag &amp; drop
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, WebP, PDF, DOC, TXT · Max 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor={`${dropZoneId}-desc`} className="block text-xs font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id={`${dropZoneId}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={200}
          placeholder="Brief description of this evidence..."
          className="
            w-full text-sm border border-gray-300 rounded-md px-3 py-1.5
            focus:outline-none focus:ring-2 focus:ring-blue-400
            resize-none placeholder:text-gray-400
          "
        />
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          <span aria-hidden="true">⚠️</span>
          <p>{uploadError}</p>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedFile || uploading}
        className="
          w-full py-2 px-4 rounded-md text-sm font-medium
          bg-blue-700 text-white
          hover:bg-blue-800 active:bg-blue-900
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
          transition-colors duration-150
        "
        aria-label="Upload evidence file"
      >
        {uploading ? `Uploading… ${progress}%` : '📤 Upload Evidence'}
      </button>
    </div>
  );
};

export default EvidenceUploader;
