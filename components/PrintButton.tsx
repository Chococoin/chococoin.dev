'use client';

export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="cv-btn" onClick={() => window.print()}>
      {label}
    </button>
  );
}
