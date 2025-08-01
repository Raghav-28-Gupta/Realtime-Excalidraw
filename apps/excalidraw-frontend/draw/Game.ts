import { Tool } from "@/components/Canvas";
import { getShapes } from "./http";
import { Shape, Point } from "../utils/shapeTypes";
import { CanvasUtils } from "../utils/CanvasUtils";
import { ShapeDetection, ShapeFactory, GameHelpers } from "../utils/helpers";

export class Game {
     private canvas: HTMLCanvasElement;
     private ctx: CanvasRenderingContext2D;
     private existingShapes: Shape[];
     private roomId: string;
     private clicked: boolean;
     private StartX = 0;
     private StartY = 0;
     private selectedTool: Tool = "circle";
     private pencilPoints: Point[] = [];
     private canvasUtils: CanvasUtils;
     private lastMoveTime = 0;
     private moveThrottle = 16; // ~60fps  -> Thanks AI!

     // Infinite canvas properties
     private offsetX = 0;
     private offsetY = 0;
     private isPanning = false;
     private panStartX = 0;
     private panStartY = 0;
     private panStartOffsetX = 0;
     private panStartOffsetY = 0;
     
     // Zoom properties
     private scale = 1;
     private minScale = 0.1;
     private maxScale = 5;
     private zoomSpeed = 0.1;

     socket: WebSocket;

     constructor(canvas:HTMLCanvasElement, roomId: string, socket: WebSocket) {
          this.canvas = canvas;
          this.ctx = canvas.getContext('2d')!;   //By writing !, you tell TypeScript: "I am sure this is not null here."
          this.canvasUtils = new CanvasUtils(this.canvas);
          this.existingShapes = [];
          this.roomId = roomId;
          this.socket = socket;
          this.clicked = false;
          this.init();
          this.initHandlers();
          this.initMouseHandlers();
     }

     destroy() {
          this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
          this.canvas.removeEventListener("mouseup", this.mouseUpHandler);         
          this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
          this.canvas.removeEventListener("wheel", this.wheelHandler);
          this.canvas.removeEventListener("contextmenu", this.preventContextMenu);
     }

     setTool(tool: "circle" | "rectangle" | "pencil" | "eraser" | "diamond" | "arrow" | "line"){
          this.selectedTool = tool;
     }

     async init() {
          this.existingShapes = await getShapes(this.roomId);
          this.clearCanvas();
     }

     initHandlers() {
          this.socket.onmessage = (event) => {
               const message = JSON.parse(event.data);
               if(message.type == "chat") {
                    const parsedShape = JSON.parse(message.message);
                    this.existingShapes.push(parsedShape.shape);
                    this.clearCanvas();
               } else if(message.type == "erase") {
                    const parsedMessage = JSON.parse(message.message);
                    const shapesToErase = parsedMessage.shapesToErase;
                    
                    // Remove the erased shapes from local array
                    this.existingShapes = this.existingShapes.filter(existingShape => {
                         return !shapesToErase.some((eraseShape: Shape) => 
                              GameHelpers.areShapesEqual(existingShape, eraseShape)
                         );
                    });
                    this.clearCanvas();
               }
          }
     }

     clearCanvas() {
          this.canvasUtils.clearCanvas();

          // Apply transformation for infinite canvas with zoom
          this.canvasUtils.applyTransform(this.offsetX, this.offsetY, this.scale);

          // Draw all existing shapes
          for (const shape of this.existingShapes) {
               this.canvasUtils.drawShape(shape, { stroke: "white" });
          }

          // Restore transformation
          this.canvasUtils.restoreTransform();
          this.ctx.restore();
     }

     
     mouseDownHandler = (e: MouseEvent) => {
          const mousePos = this.canvasUtils.getMousePosition(e);
          
          // Check if middle mouse button or Ctrl key is held for panning
          if (e.button === 1 || e.ctrlKey || e.metaKey) {
               this.isPanning = true;
               this.panStartX = mousePos.x;
               this.panStartY = mousePos.y;
               this.panStartOffsetX = this.offsetX;
               this.panStartOffsetY = this.offsetY;
               this.canvas.style.cursor = 'grabbing';
               return;
          }

          this.clicked = true;
          // Converting to world coordinates
          const worldPos = this.canvasUtils.screenToWorld(mousePos.x, mousePos.y, this.offsetX, this.offsetY, this.scale);
          this.StartX = worldPos.x;
          this.StartY = worldPos.y;

          if (this.selectedTool === "pencil") {
               this.pencilPoints = [{ x: this.StartX, y: this.StartY }];
          }
     }
     
     mouseUpHandler = (e: MouseEvent) => {
          if (this.isPanning) {
               this.isPanning = false;
               this.canvas.style.cursor = 'default';
               return;
          }

          console.log("Mouse up event fired");
          this.clicked = false;
          
          const mousePos = this.canvasUtils.getMousePosition(e);
          const worldPos = this.canvasUtils.screenToWorld(mousePos.x, mousePos.y, this.offsetX, this.offsetY, this.scale);
          const width = worldPos.x - this.StartX;
          const height = worldPos.y - this.StartY;

          if (this.selectedTool === "eraser") {
               const cursorX = worldPos.x;
               const cursorY = worldPos.y;

               // Find shapes that will be erased using helper methods
               const shapesToErase = this.existingShapes.filter((shape) => {
                    return GameHelpers.isPointNearAnyShape(cursorX, cursorY, shape);
               });

               const newShapes = this.existingShapes.filter((shape) => {
                    return !GameHelpers.isPointNearAnyShape(cursorX, cursorY, shape);
               });

               if (newShapes.length !== this.existingShapes.length) {
                    this.existingShapes = newShapes;
                    this.clearCanvas();
                    
                    // Sending erase action to backend and other clients to delete their entries from the table
                    if (this.socket.readyState === WebSocket.OPEN) {
                         this.socket.send(JSON.stringify({
                              type: "erase",
                              message: JSON.stringify({ shapesToErase }),
                              roomId: this.roomId
                         }));
                    }
               }
               return;
          }
          // Create shape using ShapeFactory
          let shape: Shape | null = null;
          if (this.selectedTool === "rectangle") {
               shape = ShapeFactory.createRectangle(
                    GameHelpers.generateShapeId(),
                    this.StartX,
                    this.StartY,
                    width,
                    height
               );
          } else if (this.selectedTool === "circle") {
               const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
               shape = ShapeFactory.createCircle(
                    GameHelpers.generateShapeId(),
                    this.StartX + width / 2,
                    this.StartY + height / 2,
                    radius
               );
          } else if(this.selectedTool === "pencil") {
               shape = ShapeFactory.createPencil(
                    GameHelpers.generateShapeId(),
                    this.pencilPoints
               );
          } else if (this.selectedTool === "diamond") {
               shape = ShapeFactory.createDiamond(
                    GameHelpers.generateShapeId(),
                    this.StartX + width / 2,
                    this.StartY + height / 2,
                    Math.abs(width),
                    Math.abs(height)
               );
          } else if (this.selectedTool === "arrow") {
               shape = ShapeFactory.createArrow(
                    GameHelpers.generateShapeId(),
                    this.StartX,
                    this.StartY,
                    this.StartX + width,
                    this.StartY + height
               );
          } else if (this.selectedTool === "line") {
               shape = ShapeFactory.createLine(
                    GameHelpers.generateShapeId(),
                    this.StartX,
                    this.StartY,
                    this.StartX + width,
                    this.StartY + height
               );
          }

          if (!shape) {
               return;
          }

          this.existingShapes.push(shape);
          console.log("Before WebSocket send check", this.socket.readyState);
          if (this.socket.readyState === WebSocket.OPEN) {
               console.log("data sending")
               this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({shape}),
                    roomId: this.roomId
               }));
               console.log("data sent")
          } else {
               console.warn("WebSocket not ready, state:", this.socket.readyState);
          }
     }

     mouseMoveHandler = (e: MouseEvent) => {
          // Throttle mouse move events to ~60fps to reduce jittering
          const now = Date.now();
          if (now - this.lastMoveTime < this.moveThrottle) {
               return;
          }
          this.lastMoveTime = now;

          const mousePos = this.canvasUtils.getMousePosition(e);  // getting screen coordinates relative to canvas element

          // Handle panning
          if (this.isPanning) {
               const deltaX = mousePos.x - this.panStartX;
               const deltaY = mousePos.y - this.panStartY;
               this.offsetX = this.panStartOffsetX + deltaX;
               this.offsetY = this.panStartOffsetY + deltaY;
               this.clearCanvas();
               return;
          }

          if(this.clicked && this.selectedTool !== "eraser") {
               const worldPos = this.canvasUtils.screenToWorld(mousePos.x, mousePos.y, this.offsetX, this.offsetY, this.scale);
               
               // For Continuous Drawing, draw on top of existing
               if (this.selectedTool === "pencil") {
                    this.pencilPoints.push({ x: worldPos.x, y: worldPos.y });
                    
                    // Apply transformation and draw pencil stroke
                    this.canvasUtils.applyTransform(this.offsetX, this.offsetY, this.scale);
                    this.canvasUtils.drawLinearPath(this.pencilPoints, { stroke: "white" });
                    this.canvasUtils.restoreTransform();
               } else {
                    const width = worldPos.x - this.StartX;
                    const height = worldPos.y - this.StartY;
                    
                    this.clearCanvas();
                    
                    this.canvasUtils.applyTransform(this.offsetX, this.offsetY, this.scale);
                    
                    if (this.selectedTool === "rectangle") {
                         this.canvasUtils.drawRectangle(this.StartX, this.StartY, width, height, { stroke: "white" });
                    } else if (this.selectedTool === "circle") {
                         const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                         const centreX = this.StartX + width / 2;
                         const centreY = this.StartY + height / 2;
                         this.canvasUtils.drawCircle(centreX, centreY, radius, { stroke: "white" });
                    } else if (this.selectedTool === "diamond") {
                         this.canvasUtils.drawDiamond(this.StartX + width / 2, this.StartY + height / 2, width, height, { stroke: "white" });
                    } else if (this.selectedTool === "arrow") {
                         this.canvasUtils.drawArrow(this.StartX, this.StartY, this.StartX + width, this.StartY + height, { stroke: "white" });
                    } else if (this.selectedTool === "line") {
                         this.canvasUtils.drawLine(this.StartX, this.StartY, this.StartX + width, this.StartY + height, { stroke: "white" });
                    }
                    
                    // Restore transformation
                    this.canvasUtils.restoreTransform();
               }
          }
     }
     

     initMouseHandlers() {
          // Note: Arrow functions do not have their own `this`, so they "capture" the `this` value from the surrounding context (the Game class instance)
          // while Normal functions have their own `this`, which (in event listeners) refers to the DOM element (canvas), not your Game instance.
          // So `this.clicked` is undefined or causes a TypeScript error, because canvas does not have a clicked property
          this.canvas.addEventListener("mousedown", this.mouseDownHandler);
          this.canvas.addEventListener("mouseup", this.mouseUpHandler);         
          this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
          this.canvas.addEventListener("wheel", this.wheelHandler);
          this.canvas.addEventListener("contextmenu", this.preventContextMenu);
     }

     wheelHandler = (e: WheelEvent) => {
          e.preventDefault();
          
          const mousePos = this.canvasUtils.getMousePosition(e);
          
          if (e.ctrlKey || e.metaKey) {
               const zoomFactor = e.deltaY > 0 ? (1 - this.zoomSpeed) : (1 + this.zoomSpeed);
               const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoomFactor));
               
               if (newScale !== this.scale) {
                    // Zoom towards mouse position
                    const worldPos = this.canvasUtils.screenToWorld(mousePos.x, mousePos.y, this.offsetX, this.offsetY, this.scale);
                    
                    this.scale = newScale;
                    
                    // Adjust offset to zoom towards mouse position
                    const newScreenPos = this.canvasUtils.worldToScreen(worldPos.x, worldPos.y, this.offsetX, this.offsetY, this.scale);
                    this.offsetX += mousePos.x - newScreenPos.x;
                    this.offsetY += mousePos.y - newScreenPos.y;
                    
                    this.clearCanvas();
               }
          } else {
               // Pan with wheel
               const panSpeed = 1;
               this.offsetX -= e.deltaX * panSpeed;
               this.offsetY -= e.deltaY * panSpeed;
               
               this.clearCanvas();
          }
     }

     preventContextMenu = (e: Event) => {
          e.preventDefault();
     }

     isPointNearCircle(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "circle") return false;
          // Increase precision: shrink hitbox for small circles
          const minRadius = 6; // px
          const effectiveRadius = Math.max(shape.radius, minRadius);
          const dx = px - shape.centreX;
          const dy = py - shape.centreY;
          return Math.sqrt(dx * dx + dy * dy) <= effectiveRadius;
     }

     isPointNearPencil(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "pencil") return false;
          // Increase precision: shrink hitbox for pencil strokes
          const precision = 5; // px
          for (let point of shape.points) {
               const dx = px - point.x;
               const dy = py - point.y;
               if (Math.sqrt(dx * dx + dy * dy) <= precision) return true;
          }
          return false;
     }

     isPointNearDiamond(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "diamond") return false;
          // For diamond, check if point is inside diamond bounds (simplified to rectangle for now)
          const halfWidth = shape.width / 2;
          const halfHeight = shape.height / 2;
          return (
               px >= shape.centerX - halfWidth &&
               px <= shape.centerX + halfWidth &&
               py >= shape.centerY - halfHeight &&
               py <= shape.centerY + halfHeight
          );
     }

     isPointNearArrow(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "arrow") return false;
          // Check if point is near the arrow line
          return this.isPointNearLine(px, py, shape.startX, shape.startY, shape.endX, shape.endY);
     }

     isPointNearLine(px: number, py: number, shape: Shape): boolean;
     isPointNearLine(px: number, py: number, startX: number, startY: number, endX: number, endY: number): boolean;
     isPointNearLine(px: number, py: number, shapeOrStartX: Shape | number, startY?: number, endX?: number, endY?: number): boolean {
          if (typeof shapeOrStartX === 'object') {
               const shape = shapeOrStartX;
               if (shape.type !== "line") return false;
               return this.isPointNearLine(px, py, shape.startX, shape.startY, shape.endX, shape.endY);
          } else {
               const startX = shapeOrStartX;
               // Calculate distance from point to line segment
               const A = px - startX!;
               const B = py - startY!;
               const C = endX! - startX;
               const D = endY! - startY!;
               
               const dot = A * C + B * D;
               const lenSq = C * C + D * D;
               
               if (lenSq === 0) return Math.sqrt(A * A + B * B) <= 5; // Point line
               
               const param = dot / lenSq;
               let xx, yy;
               
               if (param < 0) {
                    xx = startX;
                    yy = startY!;
               } else if (param > 1) {
                    xx = endX!;
                    yy = endY!;
               } else {
                    xx = startX + param * C;
                    yy = startY! + param * D;
               }
               
               const dx = px - xx;
               const dy = py - yy;
               return Math.sqrt(dx * dx + dy * dy) <= 5; // 5px tolerance
          }
     }

     // Public methods for external control of infinite canvas
     public pan(deltaX: number, deltaY: number) {
          this.offsetX += deltaX;
          this.offsetY += deltaY;
          this.clearCanvas();
     }

     public resetView() {
          this.offsetX = 0;
          this.offsetY = 0;
          this.scale = 1;
          this.clearCanvas();
     }

     public getViewport() {
          return {
               offsetX: this.offsetX,
               offsetY: this.offsetY,
               scale: this.scale,
               width: this.canvas.width,
               height: this.canvas.height
          };
     }

     // Additional zoom control methods
     public zoomIn() {
          const newScale = Math.min(this.maxScale, this.scale * (1 + this.zoomSpeed));
          if (newScale !== this.scale) {
               this.scale = newScale;
               this.clearCanvas();
          }
     }

     public zoomOut() {
          const newScale = Math.max(this.minScale, this.scale * (1 - this.zoomSpeed));
          if (newScale !== this.scale) {
               this.scale = newScale;
               this.clearCanvas();
          }
     }

     public setZoom(scale: number) {
          this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
          this.clearCanvas();
     }
}

