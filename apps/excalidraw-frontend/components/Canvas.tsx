"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { 
  Circle, 
  Pencil, 
  RectangleHorizontalIcon, 
  Eraser, 
  Diamond, 
  ArrowRight, 
  Minus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Move
} from "lucide-react";
import { Game } from "@/draw/Game";
import { ExportButton } from "./ExportButton";
import { ColorPicker, StrokeWidthPicker } from "./ColorPicker";

export type Tool = "circle" | "rectangle" | "pencil" | "eraser" | "diamond" | "arrow" | "line" | "pan";

// Tool keyboard shortcuts mapping
const TOOL_SHORTCUTS: Record<string, Tool> = {
  p: "pencil",
  r: "rectangle",
  c: "circle",
  d: "diamond",
  a: "arrow",
  l: "line",
  e: "eraser",
  h: "pan", // H for hand/pan
};

export function Canvas({
  roomId,
  socket,
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(100);

  // SSR-safe dimension initialization
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial set
    updateDimensions();

    // Handle resize
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Update game tool when selection changes
  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  // Update game color when selection changes
  useEffect(() => {
    if (game) {
      game.setColor(selectedColor);
    }
  }, [selectedColor, game]);

  // Update game stroke width when selection changes
  useEffect(() => {
    if (game) {
      game.setStrokeWidth(strokeWidth);
    }
  }, [strokeWidth, game]);

  // Initialize game when canvas and dimensions are ready
  useEffect(() => {
    if (canvasRef.current && dimensions.width > 0 && dimensions.height > 0) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);

      return () => {
        g.destroy();
      };
    }
  }, [canvasRef, dimensions.width, dimensions.height, roomId, socket]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      
      // Tool shortcuts
      const tool = TOOL_SHORTCUTS[key];
      if (tool) {
        setSelectedTool(tool);
        return;
      }

      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (key === "=" || key === "+") {
          e.preventDefault();
          handleZoomIn();
        } else if (key === "-") {
          e.preventDefault();
          handleZoomOut();
        } else if (key === "0") {
          e.preventDefault();
          handleResetZoom();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 200);
    setZoom(newZoom);
    game?.setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 50);
    setZoom(newZoom);
    game?.setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(100);
    game?.setZoom(100);
  };

  const handleClearCanvas = () => {
    if (confirm("Are you sure you want to clear the entire canvas? This action cannot be undone.")) {
      game?.clearAllShapes();
    }
  };

  // Don't render canvas until dimensions are available (SSR protection)
  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Initializing canvas...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
      />
      
      {/* Main Toolbar */}
      <TopBar 
        selectedTool={selectedTool} 
        setSelectedTool={setSelectedTool}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
      />
      
      {/* Bottom Right Actions */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg px-2 py-1 shadow-lg">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-gray-400 text-sm min-w-[50px] text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Zoom In (Ctrl++)"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {/* Top Right Actions */}
      <div className="fixed top-4 right-24 z-50 flex items-center gap-2">
        {/* Export Button */}
        <ExportButton canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>} roomName={`room-${roomId}`} />
        
        {/* Clear Canvas */}
        <button
          onClick={handleClearCanvas}
          className="flex items-center gap-2 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
          title="Clear Canvas"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function TopBar({
  selectedTool,
  setSelectedTool,
  selectedColor,
  setSelectedColor,
  strokeWidth,
  setStrokeWidth,
}: {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
}) {
  const tools: { tool: Tool; icon: React.ReactNode; shortcut: string }[] = [
    { tool: "pencil", icon: <Pencil size={20} />, shortcut: "P" },
    { tool: "rectangle", icon: <RectangleHorizontalIcon size={20} />, shortcut: "R" },
    { tool: "circle", icon: <Circle size={20} />, shortcut: "C" },
    { tool: "diamond", icon: <Diamond size={20} />, shortcut: "D" },
    { tool: "arrow", icon: <ArrowRight size={20} />, shortcut: "A" },
    { tool: "line", icon: <Minus size={20} />, shortcut: "L" },
    { tool: "eraser", icon: <Eraser size={20} />, shortcut: "E" },
    { tool: "pan", icon: <Move size={20} />, shortcut: "H" },
  ];

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl px-3 py-2 shadow-lg">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          {tools.map((item, index) => (
            <div key={item.tool} className="flex items-center">
              {index > 0 && index !== tools.length - 1 && <div className="w-px h-6 bg-gray-600 mx-1" />}
              {index === tools.length - 1 && <div className="w-px h-6 bg-gray-600 mx-2" />}
              <div className="relative group">
                <IconButton
                  activated={selectedTool === item.tool}
                  icon={item.icon}
                  onClick={() => setSelectedTool(item.tool)}
                />
                {/* Tooltip with keyboard shortcut */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.tool.charAt(0).toUpperCase() + item.tool.slice(1)} ({item.shortcut})
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-600 mx-1" />

        {/* Color Picker */}
        <ColorPicker selectedColor={selectedColor} onColorChange={setSelectedColor} />

        {/* Stroke Width Picker */}
        <StrokeWidthPicker selectedWidth={strokeWidth} onWidthChange={setStrokeWidth} />
      </div>
    </div>
  );
}
