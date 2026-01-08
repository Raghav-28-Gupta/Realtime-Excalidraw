"use client";

import React from "react";
import { Download, Image, FileCode } from "lucide-react";

interface ExportButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  roomName?: string;
}

export function ExportButton({ canvasRef, roomName = "excalidraw" }: ExportButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const exportAsPNG = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/png");
      
      // Create download link
      const link = document.createElement("a");
      link.download = `${roomName}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export as PNG:", error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const exportAsSVG = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = canvasRef.current;
      
      // For SVG export, we'd need to convert canvas content to SVG paths
      // This is a simplified version that creates an SVG with embedded image
      const dataUrl = canvas.toDataURL("image/png");
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${canvas.width}" height="${canvas.height}">
  <image xlink:href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`;
      
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.download = `${roomName}-${Date.now()}.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export as SVG:", error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const copyToClipboard = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
        }
      }, "image/png");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        title="Export canvas"
        disabled={isExporting}
      >
        <Download className="w-4 h-4" />
        <span className="text-sm">Export</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full mt-2 right-0 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[180px] animate-slide-in-up">
            <button
              onClick={exportAsPNG}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Image className="w-4 h-4 text-green-400" />
              <span>Export as PNG</span>
            </button>
            
            <button
              onClick={exportAsSVG}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <FileCode className="w-4 h-4 text-blue-400" />
              <span>Export as SVG</span>
            </button>
            
            <div className="border-t border-gray-700" />
            
            <button
              onClick={copyToClipboard}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy to Clipboard</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
