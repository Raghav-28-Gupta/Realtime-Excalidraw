export type Point = {
     x: number;
     y: number;
};

export type Shape = {
     id: string;
     type: "rectangle";
     x: number;
     y: number;
     width: number;
     height: number
} | {
     id: string;
     type: "circle";
     centreX: number;
     centreY: number;
     radius: number;
} | {
     id: string;
     type: "pencil";
     points: Point[];
} | {
     id: string;
     type: "diamond";
     centerX: number;
     centerY: number;
     width: number;
     height: number;
} | {
     id: string;
     type: "arrow";
     startX: number;
     startY: number;
     endX: number;
     endY: number;
} | {
     id: string;
     type: "line";
     startX: number;
     startY: number;
     endX: number;
     endY: number;
};

export type DrawingOptions = {
     stroke?: string;
     fill?: string;
     strokeWidth?: number;
};
