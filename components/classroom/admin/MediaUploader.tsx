"use client";

import { useState } from "react";

export default function MediaUploader() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Media uploader</h2>
      <p className="mt-1 text-sm text-slate-500">
        Select audio, images, or PDFs. Upload API comes next — files stay local
        in this preview.
      </p>
      <input
        type="file"
        multiple
        accept="audio/*,image/*,.pdf"
        className="mt-4 block w-full text-sm"
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
      />
      {files.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm">
          {files.map((f) => (
            <li
              key={`${f.name}-${f.size}`}
              className="flex justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <span className="truncate font-medium">{f.name}</span>
              <span className="shrink-0 text-slate-500">
                {(f.size / 1024).toFixed(1)} KB
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No files selected.</p>
      )}
    </div>
  );
}
