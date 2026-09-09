/**
 * TypeScript Type Definitions for TempTree
 * Handles Template specifications, Fabric.js element layouts, and Category definitions.
 */

export type Category = "Y2K" | "Minimal" | "Dreamy" | "Vintage" | "Bold" | "Custom";

export const CATEGORIES: Category[] = ["Y2K", "Minimal", "Dreamy", "Vintage", "Bold"];

export interface BaseElement {
  id: string;
  type: "text" | "image" | "rect" | "circle" | "badge";
  left: number; // Native 1080x1920 coordinate X
  top: number; // Native 1080x1920 coordinate Y
  width?: number;
  height?: number;
  opacity?: number;
  angle?: number; // Rotation in degrees
  selectable?: boolean;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: "normal" | "bold" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  fontStyle?: "normal" | "italic";
  fill: string; // Color hex
  textAlign?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string; // URL or Data URL or placeholder
  placeholderLabel?: string;
  isPlaceholder?: boolean;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  clipToFrame?: boolean;
}

export interface ShapeElement extends BaseElement {
  type: "rect" | "circle" | "badge";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number; // Border radius X
  ry?: number; // Border radius Y
  radius?: number; // For circle
}

export type TemplateElement = TextElement | ImageElement | ShapeElement;

export interface LayoutJson {
  width: 1080; // Fixed Instagram Story width
  height: 1920; // Fixed Instagram Story height
  backgroundColor: string; // Hex or gradient CSS string
  backgroundGradient?: {
    type: "linear" | "radial";
    colors: { offset: number; color: string }[];
    angle?: number;
  };
  elements: TemplateElement[];
}

export interface Template {
  id: string;
  name: string;
  category: Category;
  description: string;
  tags: string[];
  thumbnailUrl?: string;
  layoutJson: LayoutJson;
  createdDate?: string;
  accentColor?: string;
}
