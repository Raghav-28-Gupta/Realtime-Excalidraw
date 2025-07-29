import { Shape, Point } from "./shapeTypes";

export class ShapeDetection {
     static isPointNearRect(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "rectangle") return false;
          
          // Increase precision: shrink hitbox for small rectangles
          const minSize = 8; // px
          const x0 = shape.x;
          const x1 = shape.x + Math.max(shape.width, minSize);
          const y0 = shape.y;
          const y1 = shape.y + Math.max(shape.height, minSize);
          
          return (
               px >= x0 &&
               px <= x1 &&
               py >= y0 &&
               py <= y1
          );
     }

     static isPointNearCircle(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "circle") return false;
          
          // Increase precision: shrink hitbox for small circles
          const minRadius = 6; // px
          const effectiveRadius = Math.max(shape.radius, minRadius);
          const dx = px - shape.centreX;
          const dy = py - shape.centreY;
          
          return Math.sqrt(dx * dx + dy * dy) <= effectiveRadius;
     }

     static isPointNearPencil(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "pencil") return false;
          
          // Increase precision: shrink hitbox for pencil strokes
          const precision = 5; // px
          for (let point of shape.points) {
               const dx = px - point.x;
               const dy = py - point.y;
               if (Math.sqrt(dx * dx + dy * dy) <= precision) {
                    return true;
               }
          }
          return false;
     }

     static isPointNearDiamond(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "diamond") return false;
          
          // For diamond, checking if point is inside diamond bounds (simplified to rectangle for now)
          const halfWidth = shape.width / 2;
          const halfHeight = shape.height / 2;
          
          return (
               px >= shape.centerX - halfWidth &&
               px <= shape.centerX + halfWidth &&
               py >= shape.centerY - halfHeight &&
               py <= shape.centerY + halfHeight
          );
     }

     static isPointNearArrow(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "arrow") return false;
          
          // Checking if point is near the arrow line
          return this.isPointNearLineSegment(px, py, shape.startX, shape.startY, shape.endX, shape.endY);
     }

     static isPointNearLine(px: number, py: number, shape: Shape): boolean {
          if (shape.type !== "line") return false;
          
          return this.isPointNearLineSegment(px, py, shape.startX, shape.startY, shape.endX, shape.endY);
     }

     static isPointNearLineSegment(px: number, py: number, startX: number, startY: number, endX: number, endY: number): boolean {
          const precision = 5; // px
          const A = px - startX;
          const B = py - startY;
          const C = endX - startX;
          const D = endY - startY;

          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          let param = -1;

          if (lenSq !== 0) {
               param = dot / lenSq;
          }

          let xx, yy;

          if (param < 0) {
               xx = startX;
               yy = startY;
          } else if (param > 1) {
               xx = endX;
               yy = endY;
          } else {
               xx = startX + param * C;
               yy = startY + param * D;
          }

          const dx = px - xx;
          const dy = py - yy;
          return Math.sqrt(dx * dx + dy * dy) <= precision;
     }
}

export class ShapeFactory {
     static createRectangle(id: string, x: number, y: number, width: number, height: number): Shape {
          return {
               id,
               type: "rectangle",
               x,
               y,
               width,
               height
          };
     }

     static createCircle(id: string, centerX: number, centerY: number, radius: number): Shape {
          return {
               id,
               type: "circle",
               centreX: centerX,
               centreY: centerY,
               radius
          };
     }

     static createPencil(id: string, points: Point[]): Shape {
          return {
               id,
               type: "pencil",
               points
          };
     }

     static createDiamond(id: string, centerX: number, centerY: number, width: number, height: number): Shape {
          return {
               id,
               type: "diamond",
               centerX,
               centerY,
               width,
               height
          };
     }

     
     static createArrow(id: string, startX: number, startY: number, endX: number, endY: number): Shape {
          return {
               id,
               type: "arrow",
               startX,
               startY,
               endX,
               endY
          };
     }

     static createLine(id: string, startX: number, startY: number, endX: number, endY: number): Shape {
          return {
               id,
               type: "line",
               startX,
               startY,
               endX,
               endY
          };
     }
}

export class GameHelpers {
     // Compare if two shapes are equal
     static areShapesEqual(shape1: Shape, shape2: Shape): boolean {
          return shape1.id === shape2.id;
     }

     // Generate a unique ID for shapes (Eraser Implementation)
     static generateShapeId(): string {
          return crypto.randomUUID();
     }

     // Checking if a point is near any shape
     static isPointNearAnyShape(px: number, py: number, shape: Shape): boolean {
          return (
               ShapeDetection.isPointNearRect(px, py, shape) ||
               ShapeDetection.isPointNearCircle(px, py, shape) ||
               ShapeDetection.isPointNearPencil(px, py, shape) ||
               ShapeDetection.isPointNearDiamond(px, py, shape) ||
               ShapeDetection.isPointNearArrow(px, py, shape) ||
               ShapeDetection.isPointNearLine(px, py, shape)
          );
     }

     // To Calculate distance between two points
     static distance(p1: Point, p2: Point): number {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          return Math.sqrt(dx * dx + dy * dy);
     }

     // Clamp a value between min and max
     static clamp(value: number, min: number, max: number): number {
          return Math.max(min, Math.min(max, value));
     }
}
