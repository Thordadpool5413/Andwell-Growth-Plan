import React, { useCallback } from "react";
import Button from "./Button.jsx";
import { FileText } from "lucide-react";

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
