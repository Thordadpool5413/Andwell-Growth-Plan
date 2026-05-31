import React, { useCallback } from "react";
import Button from "./Button.jsx";

function FileText({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default function ExportButton({ targetId, filename }) {
  const handleExport = useCallback(async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename || "Andwell Growth Plan"}</title>
          ${styles}
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { background: #f8fafc; padding: 24px; }
          </style>
        </head>
        <body>${element.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }, [targetId, filename]);

  return (
    <Button
      variant="secondary"
      size="md"
      onClick={handleExport}
      icon={<FileText className="h-4 w-4" />}
    >
      Export PDF
    </Button>
  );
}
