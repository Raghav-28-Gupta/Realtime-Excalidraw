import rough from "roughjs";
import { Point, Shape, DrawingOptions } from "./shapeTypes";

export class CanvasUtils {
     private canvas: HTMLCanvasElement;
     private ctx: CanvasRenderingContext2D;
     private rc: ReturnType<typeof rough.canvas>;

     constructor(canvas: HTMLCanvasElement) {
          this.canvas = canvas;
          this.ctx = canvas.getContext('2d')!;
          this.rc = rough.canvas(canvas);
     }

     // Get mouse position relative to canvas
     getMousePosition(e: MouseEvent): Point {
          const rect = this.canvas.getBoundingClientRect();
          return {
               x: e.clientX - rect.left,
               y: e.clientY - rect.top
          };
     }

     // Converting screen coordinates to world coordinates (infinite canvas implementation)
     screenToWorld(screenX: number, screenY: number, offsetX: number, offsetY: number, scale: number): Point {
          return {
               x: (screenX - offsetX) / scale,
               y: (screenY - offsetY) / scale
          };
     }

     // Converting world coordinates to screen coordinates (infinite canvas implementation)
     worldToScreen(worldX: number, worldY: number, offsetX: number, offsetY: number, scale: number): Point {
          return {
               x: worldX * scale + offsetX,
               y: worldY * scale + offsetY
          };
     }

     // Apply canvas transformation
     applyTransform(offsetX: number, offsetY: number, scale: number): void {
          this.ctx.save();
          this.ctx.translate(offsetX, offsetY);
          this.ctx.scale(scale, scale);
     }

     // Restore canvas transformation
     restoreTransform(): void {
          this.ctx.restore();
     }

     clearCanvas(): void {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.fillStyle = "rgba(0, 0, 0)";
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
     }

     drawRectangle(x: number, y: number, width: number, height: number, options: DrawingOptions = {}): void {
          this.rc.rectangle(x, y, width, height, {
               stroke: options.stroke || "white",
               fill: options.fill,
               strokeWidth: options.strokeWidth
          });
     }

     drawCircle(centerX: number, centerY: number, radius: number, options: DrawingOptions = {}): void {
          this.rc.circle(centerX, centerY, radius * 2, {
               stroke: options.stroke || "white",
               fill: options.fill,
               strokeWidth: options.strokeWidth
          });
     }

     drawLinearPath(points: Point[], options: DrawingOptions = {}): void {
          const pathPoints = points.map(p => [p.x, p.y]);
          // @ts-ignore
          this.rc.linearPath(pathPoints, {
               stroke: options.stroke || "white",
               strokeWidth: options.strokeWidth
          });
     }

     drawDiamond(centerX: number, centerY: number, width: number, height: number, options: DrawingOptions = {}): void {
          const halfWidth = width / 2;
          const halfHeight = height / 2;
          const points = [
               [centerX, centerY - halfHeight], // top
               [centerX + halfWidth, centerY], // right
               [centerX, centerY + halfHeight], // bottom
               [centerX - halfWidth, centerY]  // left
          ];
          // @ts-ignore
          this.rc.polygon(points, {
               stroke: options.stroke || "white",
               fill: options.fill,
               strokeWidth: options.strokeWidth
          });
     }

     drawArrow(startX: number, startY: number, endX: number, endY: number, options: DrawingOptions = {}): void {
          this.rc.line(startX, startY, endX, endY, {
               stroke: options.stroke || "white",
               strokeWidth: options.strokeWidth
          });
          
          // Calculate arrowhead
          const headLength = 15;
          const headAngle = Math.PI / 6; // 30 degrees
          const angle = Math.atan2(endY - startY, endX - startX);
          
          // Arrowhead points
          const headX1 = endX - headLength * Math.cos(angle - headAngle);
          const headY1 = endY - headLength * Math.sin(angle - headAngle);
          const headX2 = endX - headLength * Math.cos(angle + headAngle);
          const headY2 = endY - headLength * Math.sin(angle + headAngle);
          
          // Draw arrowhead
          this.rc.line(endX, endY, headX1, headY1, {
               stroke: options.stroke || "white",
               strokeWidth: options.strokeWidth
          });
          this.rc.line(endX, endY, headX2, headY2, {
               stroke: options.stroke || "white",
               strokeWidth: options.strokeWidth
          });
     }

     drawLine(startX: number, startY: number, endX: number, endY: number, options: DrawingOptions = {}): void {
          this.rc.line(startX, startY, endX, endY, {
               stroke: options.stroke || "white",
               strokeWidth: options.strokeWidth
          });
     }

     drawShape(shape: Shape, options: DrawingOptions = {}): void {
          switch (shape.type) {
               case "rectangle":
                    this.drawRectangle(shape.x, shape.y, shape.width, shape.height, options);
                    break;
               case "circle":
                    this.drawCircle(shape.centreX, shape.centreY, shape.radius, options);
                    break;
               case "pencil":
                    this.drawLinearPath(shape.points, options);
                    break;
               case "diamond":
                    this.drawDiamond(shape.centerX, shape.centerY, shape.width, shape.height, options);
                    break;
               case "arrow":
                    this.drawArrow(shape.startX, shape.startY, shape.endX, shape.endY, options);
                    break;
               case "line":
                    this.drawLine(shape.startX, shape.startY, shape.endX, shape.endY, options);
                    break;
          }
     }
}
