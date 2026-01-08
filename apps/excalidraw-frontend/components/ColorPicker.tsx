"use client";

import React, { useState } from "react";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

// Predefined color palette
const COLORS = [
  "#ffffff", // White
  "#ff6b6b", // Red
  "#ffd93d", // Yellow
  "#6bcb77", // Green
  "#4d96ff", // Blue
  "#9d65c9", // Purple
  "#ff9f43", // Orange
  "#00d2d3", // Cyan
  "#ff6b9d", // Pink
  "#a8a8a8", // Gray
];

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Color button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        title="Select color"
      >
        <div
          className="w-5 h-5 rounded-full border-2 border-gray-600"
          style={{ backgroundColor: selectedColor }}
        />
        <Palette className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Color palette */}
          <div className="absolute top-full mt-2 left-0 z-50 bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl animate-slide-in-up">
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onColorChange(color);
                    setIsOpen(false);
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedColor === color
                      ? "border-purple-500 ring-2 ring-purple-500/50"
                      : "border-gray-600"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            
            {/* Custom color input */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Stroke width picker component
interface StrokeWidthPickerProps {
  selectedWidth: number;
  onWidthChange: (width: number) => void;
}

const STROKE_WIDTHS = [
  { value: 1, label: "Thin" },
  { value: 2, label: "Medium" },
  { value: 4, label: "Thick" },
  { value: 6, label: "Extra Thick" },
];

export function StrokeWidthPicker({ selectedWidth, onWidthChange }: StrokeWidthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Width button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        title="Stroke width"
      >
        <div className="w-8 flex flex-col justify-center items-center gap-1">
          <div
            className="bg-white rounded-full"
            style={{ width: "100%", height: `${Math.max(selectedWidth, 1)}px` }}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full mt-2 left-0 z-50 bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl animate-slide-in-up min-w-[140px]">
            <div className="space-y-2">
              {STROKE_WIDTHS.map((stroke) => (
                <button
                  key={stroke.value}
                  onClick={() => {
                    onWidthChange(stroke.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedWidth === stroke.value
                      ? "bg-purple-600"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <div className="w-12 flex items-center">
                    <div
                      className="bg-white rounded-full w-full"
                      style={{ height: `${stroke.value}px` }}
                    />
                  </div>
                  <span className="text-sm text-gray-300">{stroke.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
