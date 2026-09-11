"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import templatesData from "@/data/templates.json";
import { Template, LayoutJson } from "@/types/template";
import TemplateCanvas from "@/components/TemplateCanvas";
import ImageCropperModal from "@/components/ImageCropperModal";
import { loadFabric } from "@/lib/fabric";
import { getTemplate, saveTemplate } from "@/lib/template-store";
import MobileAtmosphericBackground from "@/components/ui/MobileAtmosphericBackground";
import {
  ArrowLeft,
  Download,
  Upload,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  CheckCircle2,
  Image as ImageIcon,
  Move,
  Crop,
  Check,
  RefreshCw,
  Sliders,
  FlipHorizontal,
} from "lucide-react";

interface PhotoSlot {
  id: string;
  index: number;
  label: string;
  width: number;
  height: number;
  aspectRatio: number;
  left: number;
  top: number;
  rotation?: number;
  cx?: number;
  cy?: number;
  currentSrc: string;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.templateId as string;

  const templates: Template[] = templatesData as Template[];
  const initialTemplate = templates.find((t) => t.id === templateId) || templates[0];

  // Editor State
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [activeObject, setActiveObject] = useState<any | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<any | null>(null);
  const [canvasScale, setCanvasScale] = useState<number>(0.38);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [selectedBgColor, setSelectedBgColor] = useState<string>(
    initialTemplate.layoutJson.backgroundColor || "#4A4A4A"
  );

  // Photo slots identified from template elements
  const photoSlots: PhotoSlot[] = useMemo(() => {
    return template.layoutJson.elements
      .filter((el) => el.type === "image" && el.id !== "frame-cutout-overlay")
      .map((el, idx) => {
        const imgEl = el as any;
        const w = imgEl.width || 600;
        const h = imgEl.height || 600;
        const rot = imgEl.rotation ?? imgEl.angle ?? 0;
        const cx = imgEl.cx != null ? imgEl.cx : (imgEl.left || 0) + w / 2;
        const cy = imgEl.cy != null ? imgEl.cy : (imgEl.top || 0) + h / 2;
        return {
          id: imgEl.id,
          index: idx + 1,
          label: imgEl.placeholderLabel || `Photo #${idx + 1}`,
          width: w,
          height: h,
          aspectRatio: +(w / h).toFixed(3),
          left: imgEl.left,
          top: imgEl.top,
          rotation: rot,
          cx,
          cy,
          currentSrc: imgEl.src,
        };
      });
  }, [template]);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    photoSlots.length > 0 ? photoSlots[0].id : null
  );
  const [slotThumbnails, setSlotThumbnails] = useState<{ [slotId: string]: string }>({});
  // Master uncropped original photos cache to prevent destructive cropping
  const [rawPhotos, setRawPhotos] = useState<{ [slotId: string]: string }>({});
  const rawPhotosRef = useRef<{ [slotId: string]: string }>({});

  // Cropper Modal State
  const [cropperModal, setCropperModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
    targetSlot: PhotoSlot | null;
  }>({
    isOpen: false,
    imageSrc: "",
    targetSlot: null,
  });

  const pendingSlotRef = useRef<PhotoSlot | null>(null);

  // Cached Fabric module reference to guarantee singleton usage across all operations
  const fabricModuleRef = useRef<any>(null);

  // Slot Adjustment Mode State
  const [isAdjustingSlot, setIsAdjustingSlot] = useState<boolean>(false);
  const [adjustingGeometry, setAdjustingGeometry] = useState<{
    width: number;
    height: number;
    cx: number;
    cy: number;
    rotation: number;
  } | null>(null);
  const adjusterRectRef = useRef<any>(null);

  // Hidden file input ref for image uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load session-scoped template from IndexedDB (with sessionStorage fallback)
  useEffect(() => {
    if (typeof window === "undefined" || !templateId) return;
    let isCancelled = false;

    getTemplate(templateId as string).then((loadedTemplate) => {
      if (isCancelled || !loadedTemplate) return;
      if (loadedTemplate && loadedTemplate.layoutJson) {
        setTemplate(loadedTemplate);
        if (loadedTemplate.layoutJson.backgroundColor) {
          setSelectedBgColor(loadedTemplate.layoutJson.backgroundColor);
        }
      }
    }).catch((err) => {
      console.warn("Could not load template from template store:", err);
    });

    return () => {
      isCancelled = true;
    };
  }, [templateId]);

  // Load and cache the shared Fabric.js singleton once on mount
  useEffect(() => {
    loadFabric().then((loaded) => {
      if (loaded) {
        fabricModuleRef.current = loaded;
      }
    });
  }, []);

  // Responsive scale calculation to fit viewport
  useEffect(() => {
    const computeScale = () => {
      const isMobile = window.innerWidth < 768;
      // Extra bottom allowance on mobile for the photo slots dock
      const bottomAllowance = isMobile ? 180 : 150;
      const availableHeight = window.innerHeight - bottomAllowance;
      const availableWidth = isMobile ? window.innerWidth - 32 : window.innerWidth - 420;
      
      const scaleFromHeight = availableHeight / 1920;
      const scaleFromWidth = Math.max(0.18, (availableWidth > 0 ? availableWidth : window.innerWidth - 32) / 1080);
      
      const optimalScale = Math.min(scaleFromHeight, scaleFromWidth);
      setCanvasScale(Math.max(0.18, Math.min(0.48, optimalScale)));
    };

    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, []);

  // Handle Canvas Ready
  const handleCanvasReady = (canvasInstance: any, fabricInstance?: any) => {
    setFabricCanvas(canvasInstance);
    if (fabricInstance) {
      fabricModuleRef.current = fabricInstance;
    }
  };

  // Selection change listener from Fabric.js
  const handleSelectionChange = (obj: any | null) => {
    setActiveObject(obj);
    if (obj && (obj as any).elementId && (obj as any).elementId !== "slot-adjuster-rect") {
      const match = photoSlots.find((s) => s.id === (obj as any).elementId);
      if (match) {
        setSelectedSlotId(match.id);
      }
    }
  };

  // ============================================================================
  // PICTURE MODIFICATION HANDLERS
  // ============================================================================
  const updateActiveSlotProp = (prop: string, value: any) => {
    if (!fabricCanvas || !selectedSlotId) return;
    const objects = fabricCanvas.getObjects();
    const targetObj = objects.find((o: any) => o.elementId === selectedSlotId);
    if (!targetObj) return;

    targetObj.set(prop, value);
    fabricCanvas.renderAll();
    setActiveObject({ ...targetObj });
  };

  const handleToggleFlipX = () => {
    if (!fabricCanvas || !selectedSlotId) return;
    const objects = fabricCanvas.getObjects();
    const targetObj = objects.find((o: any) => o.elementId === selectedSlotId);
    if (!targetObj) return;

    const newFlip = !targetObj.flipX;
    targetObj.set("flipX", newFlip);
    fabricCanvas.renderAll();
    setActiveObject({ ...targetObj, flipX: newFlip });
  };

  const handleResetSlotPhoto = (slot: PhotoSlot) => {
    // Revert back to original template's stock photo
    const originalElem = template.layoutJson.elements.find((el) => el.id === slot.id) as any;
    const originalSrc = originalElem?.src || slot.currentSrc;
    if (!originalSrc) return;

    // Clear local custom thumbnail and raw photo master
    delete rawPhotosRef.current[slot.id];
    setRawPhotos((prev) => {
      const updated = { ...prev };
      delete updated[slot.id];
      return updated;
    });

    setSlotThumbnails((prev) => {
      const updated = { ...prev };
      delete updated[slot.id];
      return updated;
    });

    applyCroppedImageToSlot(slot, originalSrc);
  };

  // ============================================================================
  // PHOTO SLOTS & CROPPING HANDLERS
  // ============================================================================
  const handleSelectSlot = (slot: PhotoSlot) => {
    if (isAdjustingSlot && adjusterRectRef.current) {
      stopAdjustSlotMode();
    }
    setSelectedSlotId(slot.id);
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    const targetObj = objects.find((o: any) => o.elementId === slot.id);
    if (targetObj) {
      fabricCanvas.setActiveObject(targetObj);
      fabricCanvas.renderAll();
      setActiveObject(targetObj);
    }
  };

  const handlePickPhotoForSlot = (slot: PhotoSlot) => {
    pendingSlotRef.current = slot;
    setSelectedSlotId(slot.id);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleAdjustCropForSlot = (slot: PhotoSlot) => {
    // Always use original master photo if available, preventing lossy crop-of-a-crop
    const currentSrc = rawPhotosRef.current[slot.id] || rawPhotos[slot.id] || slotThumbnails[slot.id] || slot.currentSrc;
    if (!currentSrc) return;
    setCropperModal({
      isOpen: true,
      imageSrc: currentSrc,
      targetSlot: slot,
    });
  };

  const triggerImageUpload = () => {
    const targetSlot =
      photoSlots.find((s) => s.id === selectedSlotId) ||
      photoSlots[0] ||
      null;
    pendingSlotRef.current = targetSlot;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const applyCoverPhotoToSlot = async (slot: PhotoSlot, imageSrc: string) => {
    if (!fabricCanvas) return;
    const fabric = fabricModuleRef.current || (await loadFabric());
    if (!fabric) return;

    // Cache thumbnail locally so the slot list updates immediately
    setSlotThumbnails((prev) => ({ ...prev, [slot.id]: imageSrc }));

    const objects = fabricCanvas.getObjects();
    const existingObj = objects.find((o: any) => o.elementId === slot.id);

    const htmlImg = new Image();
    if (imageSrc.startsWith("http")) {
      htmlImg.crossOrigin = "anonymous";
    }

    const applyToFabric = () => {
      const imgW = htmlImg.naturalWidth || htmlImg.width || 1;
      const imgH = htmlImg.naturalHeight || htmlImg.height || 1;

      const slotW = slot.width;
      const slotH = slot.height;
      const slotAngle = slot.rotation || 0;
      const slotCenterX = slot.cx != null ? slot.cx : slot.left + slotW / 2;
      const slotCenterY = slot.cy != null ? slot.cy : slot.top + slotH / 2;

      // Automatically scale to COVER the full slot dimensions (no empty gaps)
      const coverScale = Math.max(slotW / imgW, slotH / imgH);

      // Clip path anchored to slot dimensions and rotation in canvas space so dragging never bleeds outside
      const clipRect = new fabric.Rect({
        left: slotCenterX,
        top: slotCenterY,
        width: slotW,
        height: slotH,
        originX: "center",
        originY: "center",
        angle: slotAngle,
        absolutePositioned: true,
      });

      let activeTarget: any = existingObj;

      if (existingObj && typeof existingObj.setElement === "function") {
        // In-place swap preserving canvas z-index stacking
        existingObj.setElement(htmlImg);
        existingObj.set({
          left: slotCenterX,
          top: slotCenterY,
          originX: "center",
          originY: "center",
          scaleX: coverScale,
          scaleY: coverScale,
          width: imgW,
          height: imgH,
          clipPath: clipRect,
          opacity: 1,
          angle: slotAngle,
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: true,
          borderColor: "#E2B4BD",
          borderScaleFactor: 2,
          lockMovementX: false, // Draggable / pannable within slot bounds
          lockMovementY: false,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hoverCursor: "grab",
          moveCursor: "grabbing",
        });

        (existingObj as any).slotCenterX = slotCenterX;
        (existingObj as any).slotCenterY = slotCenterY;
        (existingObj as any).slotAngle = slotAngle;
        (existingObj as any).slotWidth = slotW;
        (existingObj as any).slotHeight = slotH;
        (existingObj as any).slotLeft = slot.left;
        (existingObj as any).slotTop = slot.top;
        (existingObj as any).targetWidth = slotW;
        (existingObj as any).targetHeight = slotH;
        (existingObj as any).aspectRatio = slotW / slotH;

        existingObj.setCoords();
      } else {
        const newImg = new fabric.Image(htmlImg, {
          left: slotCenterX,
          top: slotCenterY,
          originX: "center",
          originY: "center",
          scaleX: coverScale,
          scaleY: coverScale,
          angle: slotAngle,
          clipPath: clipRect,
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: true,
          borderColor: "#E2B4BD",
          borderScaleFactor: 2,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hoverCursor: "grab",
          moveCursor: "grabbing",
        });

        (newImg as any).elementId = slot.id;
        (newImg as any).elementType = "image";
        (newImg as any).slotCenterX = slotCenterX;
        (newImg as any).slotCenterY = slotCenterY;
        (newImg as any).slotAngle = slotAngle;
        (newImg as any).slotWidth = slotW;
        (newImg as any).slotHeight = slotH;
        (newImg as any).slotLeft = slot.left;
        (newImg as any).slotTop = slot.top;
        (newImg as any).targetWidth = slotW;
        (newImg as any).targetHeight = slotH;
        (newImg as any).aspectRatio = slotW / slotH;

        if (existingObj) {
          const index = objects.indexOf(existingObj);
          fabricCanvas.remove(existingObj);
          if (typeof fabricCanvas.insertAt === "function") {
            fabricCanvas.insertAt(newImg, index);
          } else {
            fabricCanvas.add(newImg);
          }
        } else {
          fabricCanvas.add(newImg);
        }
        activeTarget = newImg;
      }

      // Ensure cutout frame overlay is ALWAYS on top of photos
      const overlayObj = fabricCanvas.getObjects().find(
        (obj: any) => obj.elementId === "frame-cutout-overlay"
      );
      if (overlayObj && typeof fabricCanvas.bringToFront === "function") {
        fabricCanvas.bringToFront(overlayObj);
      }

      fabricCanvas.renderAll();
      if (activeTarget && typeof fabricCanvas.setActiveObject === "function") {
        fabricCanvas.setActiveObject(activeTarget);
        fabricCanvas.renderAll();
      }
      setActiveObject(activeTarget || null);
      setSelectedSlotId(slot.id);
      pendingSlotRef.current = null;
    };

    htmlImg.onload = applyToFabric;
    htmlImg.src = imageSrc;
    if (htmlImg.complete && htmlImg.naturalWidth > 0) {
      applyToFabric();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetSlot =
      pendingSlotRef.current ||
      photoSlots.find((s) => s.id === selectedSlotId) ||
      photoSlots[0];

    if (!targetSlot) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Save raw uncropped master photo
      rawPhotosRef.current[targetSlot.id] = dataUrl;
      setRawPhotos((prev) => ({ ...prev, [targetSlot.id]: dataUrl }));

      // Directly place the photo into the slot with cover + draggable behavior
      await applyCoverPhotoToSlot(targetSlot, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const applyCroppedImageToSlot = async (slot: PhotoSlot, croppedDataUrl: string) => {
    await applyCoverPhotoToSlot(slot, croppedDataUrl);
  };

  // Delete currently selected element
  const handleDeleteSelected = () => {
    if (!fabricCanvas || !activeObject) return;
    fabricCanvas.remove(activeObject);
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    setActiveObject(null);
  };

  // Bring forward / Send backward
  const handleLayerOrder = (direction: "forward" | "backward") => {
    if (!fabricCanvas || !activeObject) return;
    if (direction === "forward") {
      fabricCanvas.bringForward(activeObject);
      // Keep frame overlay always on top
      const overlayObj = fabricCanvas.getObjects().find(
        (obj: any) => obj.elementId === "frame-cutout-overlay"
      );
      if (overlayObj && typeof fabricCanvas.bringToFront === "function") {
        fabricCanvas.bringToFront(overlayObj);
      }
    } else {
      fabricCanvas.sendBackwards(activeObject);
    }
    fabricCanvas.renderAll();
  };

  // ============================================================================
  // FULL RESOLUTION PNG EXPORT (1080x1920)
  // ============================================================================
  const handleExportPNG = () => {
    if (!fabricCanvas) return;

    if (isAdjustingSlot) {
      stopAdjustSlotMode();
    }
    const existingAdjuster = fabricCanvas.getObjects().find((o: any) => o.elementId === "slot-adjuster-rect");
    if (existingAdjuster) {
      fabricCanvas.remove(existingAdjuster);
    }

    setIsExporting(true);

    // Deselect active object to remove border handles before snapshot
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    setTimeout(() => {
      try {
        // Multiplier calculation to export at full 1080x1920 resolution
        const exportMultiplier = 1 / canvasScale;

        const dataUrl = fabricCanvas.toDataURL({
          format: "png",
          quality: 1.0,
          multiplier: exportMultiplier,
        });

        // Trigger browser download
        const link = document.createElement("a");
        const filename = `temptree-${template.category.toLowerCase()}-${template.id}-${Date.now()}.png`;
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4000);
      } catch (err) {
        console.error("Export error:", err);
      } finally {
        setIsExporting(false);
      }
    }, 150);
  };

  const activeSlot = photoSlots.find((s) => s.id === selectedSlotId) || photoSlots[0] || null;
  const activeSlotPreview = activeSlot ? (slotThumbnails[activeSlot.id] || activeSlot.currentSrc) : "";
  const activeSlotFabricObj = fabricCanvas && activeSlot ? fabricCanvas.getObjects().find((o: any) => o.elementId === activeSlot.id) : null;
  const currentOpacity = activeSlotFabricObj && typeof activeSlotFabricObj.opacity === "number" ? activeSlotFabricObj.opacity : (activeObject?.opacity ?? 1);
  const isFlippedX = Boolean(activeSlotFabricObj?.flipX ?? activeObject?.flipX);

  // ============================================================================
  // SLOT ADJUSTMENT MODE (direct geometry editing: x, y, width, height, angle)
  // ============================================================================
  const startAdjustSlotMode = (slotToAdjust?: PhotoSlot) => {
    if (!fabricCanvas) return;
    const fabric = fabricModuleRef.current || (window as any).fabric;
    if (!fabric) return;

    const slot = slotToAdjust || activeSlot;
    if (!slot) return;

    // If an adjuster rect already exists, remove it cleanly first
    if (adjusterRectRef.current) {
      fabricCanvas.remove(adjusterRectRef.current);
      adjusterRectRef.current = null;
    }

    const slotW = slot.width;
    const slotH = slot.height;
    const slotCx = slot.cx != null ? slot.cx : slot.left + slotW / 2;
    const slotCy = slot.cy != null ? slot.cy : slot.top + slotH / 2;
    const slotAngle = slot.rotation || 0;

    // Find the photo object for this slot
    const photoObj = fabricCanvas.getObjects().find((o: any) => o.elementId === slot.id);
    if (photoObj) {
      // Temporarily disable photo interaction so clicks go to the adjuster rect handles
      photoObj.set({
        selectable: false,
        evented: false,
      });
    }

    // Create the interactive adjuster rectangle on top of canvas
    const adjusterRect = new fabric.Rect({
      left: slotCx,
      top: slotCy,
      width: slotW,
      height: slotH,
      originX: "center",
      originY: "center",
      angle: slotAngle,
      fill: "rgba(247, 214, 208, 0.15)",
      stroke: "#F7D6D0",
      strokeWidth: 2,
      strokeDashArray: [10, 6],
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      borderColor: "#F7D6D0",
      borderScaleFactor: 2,
      cornerColor: "#E2B4BD",
      cornerStrokeColor: "#4A1D2F",
      cornerSize: 22,
      cornerStyle: "circle",
      transparentCorners: false,
      padding: 0,
      hoverCursor: "move",
      moveCursor: "grabbing",
    });

    (adjusterRect as any).elementId = "slot-adjuster-rect";
    (adjusterRect as any).isSlotAdjuster = true;
    (adjusterRect as any).targetSlotId = slot.id;

    // Helper to sync changes from adjusterRect to photo, clipPath, and state
    const applyGeometryUpdate = () => {
      const scaledW = Math.max(20, Math.round(adjusterRect.getScaledWidth()));
      const scaledH = Math.max(20, Math.round(adjusterRect.getScaledHeight()));
      const currentCx = Math.round(adjusterRect.left);
      const currentCy = Math.round(adjusterRect.top);
      let currentAngle = adjusterRect.angle % 360;
      if (currentAngle > 180) currentAngle -= 360;
      if (currentAngle < -180) currentAngle += 360;
      currentAngle = Math.round(currentAngle * 10) / 10;

      // 1. Update clipPath
      if (photoObj && photoObj.clipPath) {
        photoObj.clipPath.set({
          left: currentCx,
          top: currentCy,
          width: scaledW,
          height: scaledH,
          angle: currentAngle,
          originX: "center",
          originY: "center",
          scaleX: 1,
          scaleY: 1,
        });
        photoObj.clipPath.setCoords();
      }

      // 2. Update photo object (recomputing cover scale for the new dimensions)
      if (photoObj) {
        const imgW = photoObj.width || 1;
        const imgH = photoObj.height || 1;
        const coverScale = Math.max(scaledW / imgW, scaledH / imgH);

        photoObj.set({
          left: currentCx,
          top: currentCy,
          scaleX: coverScale,
          scaleY: coverScale,
          angle: currentAngle,
        });

        (photoObj as any).slotCenterX = currentCx;
        (photoObj as any).slotCenterY = currentCy;
        (photoObj as any).slotAngle = currentAngle;
        (photoObj as any).slotWidth = scaledW;
        (photoObj as any).slotHeight = scaledH;
        (photoObj as any).slotLeft = Math.round(currentCx - scaledW / 2);
        (photoObj as any).slotTop = Math.round(currentCy - scaledH / 2);
        (photoObj as any).targetWidth = scaledW;
        (photoObj as any).targetHeight = scaledH;
        (photoObj as any).aspectRatio = +(scaledW / scaledH).toFixed(3);
        photoObj.setCoords();
      }

      setAdjustingGeometry({
        width: scaledW,
        height: scaledH,
        cx: currentCx,
        cy: currentCy,
        rotation: currentAngle,
      });

      fabricCanvas.renderAll();
    };

    adjusterRect.on("moving", applyGeometryUpdate);
    adjusterRect.on("scaling", applyGeometryUpdate);
    adjusterRect.on("rotating", applyGeometryUpdate);
    adjusterRect.on("modified", () => {
      // Normalize scale factors into width/height
      const finalW = Math.max(20, Math.round(adjusterRect.getScaledWidth()));
      const finalH = Math.max(20, Math.round(adjusterRect.getScaledHeight()));
      adjusterRect.set({
        width: finalW,
        height: finalH,
        scaleX: 1,
        scaleY: 1,
      });
      adjusterRect.setCoords();
      applyGeometryUpdate();
    });

    fabricCanvas.add(adjusterRect);
    fabricCanvas.bringToFront(adjusterRect);
    fabricCanvas.setActiveObject(adjusterRect);
    fabricCanvas.renderAll();

    adjusterRectRef.current = adjusterRect;
    setIsAdjustingSlot(true);
    setAdjustingGeometry({
      width: slotW,
      height: slotH,
      cx: slotCx,
      cy: slotCy,
      rotation: slotAngle,
    });
  };

  const stopAdjustSlotMode = async () => {
    if (!fabricCanvas || !adjusterRectRef.current) {
      setIsAdjustingSlot(false);
      setAdjustingGeometry(null);
      return;
    }

    const adjusterRect = adjusterRectRef.current;
    const targetSlotId = (adjusterRect as any).targetSlotId || selectedSlotId;

    const finalW = Math.max(20, Math.round(adjusterRect.getScaledWidth()));
    const finalH = Math.max(20, Math.round(adjusterRect.getScaledHeight()));
    const finalCx = Math.round(adjusterRect.left);
    const finalCy = Math.round(adjusterRect.top);
    let finalAngle = adjusterRect.angle % 360;
    if (finalAngle > 180) finalAngle -= 360;
    if (finalAngle < -180) finalAngle += 360;
    finalAngle = Math.round(finalAngle * 10) / 10;
    const finalLeft = Math.round(finalCx - finalW / 2);
    const finalTop = Math.round(finalCy - finalH / 2);

    // Remove adjuster rect from canvas
    fabricCanvas.remove(adjusterRect);
    adjusterRectRef.current = null;

    // Restore photo object interaction
    const photoObj = fabricCanvas.getObjects().find((o: any) => o.elementId === targetSlotId);
    if (photoObj) {
      photoObj.set({
        selectable: true,
        evented: true,
      });
      photoObj.setCoords();
      fabricCanvas.setActiveObject(photoObj);
    }

    // Update state and persist to IndexedDB
    setTemplate((prevTemplate) => {
      const updatedElements = prevTemplate.layoutJson.elements.map((el) => {
        if (el.id === targetSlotId) {
          return {
            ...el,
            left: finalLeft,
            top: finalTop,
            width: finalW,
            height: finalH,
            angle: finalAngle,
            rotation: finalAngle,
            cx: finalCx,
            cy: finalCy,
          };
        }
        return el;
      });

      const updatedTemplate: Template = {
        ...prevTemplate,
        layoutJson: {
          ...prevTemplate.layoutJson,
          elements: updatedElements,
        },
      };

      // Persist corrected template
      saveTemplate(updatedTemplate).catch((err) => {
        console.warn("Error saving updated slot geometry:", err);
      });

      return updatedTemplate;
    });

    setIsAdjustingSlot(false);
    setAdjustingGeometry(null);
    fabricCanvas.renderAll();
  };

  const handleNudgeSlot = (param: "cx" | "cy" | "width" | "height" | "rotation", delta: number) => {
    if (!adjusterRectRef.current || !fabricCanvas) return;
    const rect = adjusterRectRef.current;

    if (param === "cx") {
      rect.set("left", rect.left + delta);
    } else if (param === "cy") {
      rect.set("top", rect.top + delta);
    } else if (param === "width") {
      const currentW = rect.getScaledWidth();
      const newW = Math.max(20, Math.round(currentW + delta));
      rect.set({ width: newW, scaleX: 1 });
    } else if (param === "height") {
      const currentH = rect.getScaledHeight();
      const newH = Math.max(20, Math.round(currentH + delta));
      rect.set({ height: newH, scaleY: 1 });
    } else if (param === "rotation") {
      let newAngle = (rect.angle + delta) % 360;
      if (newAngle > 180) newAngle -= 360;
      if (newAngle < -180) newAngle += 360;
      rect.set("angle", Math.round(newAngle * 10) / 10);
    }

    rect.setCoords();
    rect.fire("moving");
    fabricCanvas.renderAll();
  };

  const handleResetSlotGeometry = (slot: PhotoSlot) => {
    const originalEl = initialTemplate.layoutJson.elements.find((el) => el.id === slot.id) as any;
    if (!originalEl) return;

    const origW = originalEl.width || 600;
    const origH = originalEl.height || 600;
    const origAngle = originalEl.rotation ?? originalEl.angle ?? 0;
    const origCx = originalEl.cx != null ? originalEl.cx : (originalEl.left || 0) + origW / 2;
    const origCy = originalEl.cy != null ? originalEl.cy : (originalEl.top || 0) + origH / 2;

    if (isAdjustingSlot && adjusterRectRef.current) {
      const rect = adjusterRectRef.current;
      rect.set({
        left: origCx,
        top: origCy,
        width: origW,
        height: origH,
        scaleX: 1,
        scaleY: 1,
        angle: origAngle,
      });
      rect.setCoords();
      rect.fire("moving");
      fabricCanvas?.renderAll();
    } else {
      const photoObj = fabricCanvas?.getObjects().find((o: any) => o.elementId === slot.id);
      if (photoObj) {
        if (photoObj.clipPath) {
          photoObj.clipPath.set({
            left: origCx,
            top: origCy,
            width: origW,
            height: origH,
            angle: origAngle,
            originX: "center",
            originY: "center",
            scaleX: 1,
            scaleY: 1,
          });
          photoObj.clipPath.setCoords();
        }

        const imgW = photoObj.width || 1;
        const imgH = photoObj.height || 1;
        const coverScale = Math.max(origW / imgW, origH / imgH);
        photoObj.set({
          left: origCx,
          top: origCy,
          scaleX: coverScale,
          scaleY: coverScale,
          angle: origAngle,
        });
        (photoObj as any).slotCenterX = origCx;
        (photoObj as any).slotCenterY = origCy;
        (photoObj as any).slotAngle = origAngle;
        (photoObj as any).slotWidth = origW;
        (photoObj as any).slotHeight = origH;
        (photoObj as any).slotLeft = Math.round(origCx - origW / 2);
        (photoObj as any).slotTop = Math.round(origCy - origH / 2);
        (photoObj as any).targetWidth = origW;
        (photoObj as any).targetHeight = origH;
        (photoObj as any).aspectRatio = +(origW / origH).toFixed(3);
        photoObj.setCoords();
        fabricCanvas?.renderAll();
      }

      setTemplate((prev) => {
        const updated = {
          ...prev,
          layoutJson: {
            ...prev.layoutJson,
            elements: prev.layoutJson.elements.map((el) =>
              el.id === slot.id
                ? {
                    ...el,
                    left: Math.round(origCx - origW / 2),
                    top: Math.round(origCy - origH / 2),
                    width: origW,
                    height: origH,
                    angle: origAngle,
                    rotation: origAngle,
                    cx: origCx,
                    cy: origCy,
                  }
                : el
            ),
          },
        };
        saveTemplate(updated).catch(() => {});
        return updated;
      });
    }
  };

  return (
    <div className="min-h-screen bg-plum text-cream flex flex-col overflow-hidden font-poppins selection:bg-mauve selection:text-cream">
      {/* Hidden file input for uploading images */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ------------------------------------------------------------- */}
      {/* TOP APP HEADER / TOOLBAR */}
      {/* ------------------------------------------------------------- */}
      <header className="h-16 px-4 sm:px-6 bg-plum-dark/95 border-b border-dustyPink/20 flex items-center justify-between z-30 backdrop-blur-md">
        {/* Left: Back Link & Template Info */}
        <div className="flex items-center space-x-3">
          <Link
            href="/gallery"
            className="p-2 rounded-full hover:bg-mauve/30 text-cream transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Upload another template"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">New Template</span>
          </Link>

          <div className="h-4 w-px bg-dustyPink/30 hidden sm:block" />

          <div className="flex flex-col">
            <h1 className="font-playfair text-base sm:text-lg font-bold text-cream truncate max-w-[180px] sm:max-w-xs">
              {template.name}
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-dustyPink font-semibold">
              {template.category} &middot; 1080 &times; 1920 Story
            </span>
          </div>
        </div>

        {/* Right: Zoom controls, Upload Photo & Export Button */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Upload Custom Photo Button */}
          <button
            onClick={triggerImageUpload}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-mauve/25 hover:bg-mauve/45 border border-dustyPink/30 text-cream font-medium text-xs sm:text-sm transition-all shadow-sm"
            title="Upload or replace photo"
          >
            <Upload className="w-4 h-4 text-dustyPink" />
            <span>Upload Photo</span>
          </button>

          {/* Zoom In/Out */}
          <div className="hidden md:flex items-center bg-plum/60 rounded-full border border-dustyPink/20 p-1">
            <button
              onClick={() => setCanvasScale((prev) => Math.max(0.2, prev - 0.04))}
              className="p-1.5 hover:bg-mauve/30 rounded-full text-cream transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold px-2 text-dustyPink">
              {Math.round(canvasScale * 100 * 2.63)}%
            </span>
            <button
              onClick={() => setCanvasScale((prev) => Math.min(0.55, prev + 0.04))}
              className="p-1.5 hover:bg-mauve/30 rounded-full text-cream transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export PNG Button */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cream text-plum font-semibold text-xs sm:text-sm hover:bg-dustyPink transition-all shadow-lg hover:shadow-xl transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <Sparkles className="w-4 h-4 animate-spin text-mauve" />
            ) : exportSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-green-700" />
            ) : (
              <Download className="w-4 h-4 text-mauve" />
            )}
            <span>{exportSuccess ? "Downloaded!" : isExporting ? "Exporting..." : "Export Story (PNG)"}</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN WORKSPACE: CANVAS + SIDEBAR TOOLS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        {/* Left / Center Viewport Area: Interactive Canvas + Mobile Slot Selector */}
        <div className="flex-grow flex flex-col items-center justify-between p-2 sm:p-6 overflow-auto bg-gradient-to-br from-plum-dark via-plum to-[#2A2A2A] relative">
          {/* Subtle grid pattern background (desktop) */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFF5F5_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none hidden md:block" />

          {/* Mobile-only Zen atmospheric background (desktop remains 100% untouched) */}
          <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none">
            <MobileAtmosphericBackground variant="zen" className="h-full" />
          </div>

          {/* Interactive Fabric.js Canvas */}
          <div className="relative z-10 transition-transform duration-200 my-auto">
            <TemplateCanvas
              layout={template.layoutJson}
              interactive={true}
              scale={canvasScale}
              onCanvasReady={handleCanvasReady}
              onSelectionChange={handleSelectionChange}
              className="border-2 border-dustyPink/40 ring-8 ring-plum/50 shadow-2xl"
            />
          </div>

          {/* Floating Canvas Hint (Desktop) */}
          <div className="absolute bottom-4 left-6 z-20 hidden md:flex items-center gap-2 text-[11px] text-cream/70 bg-plum-dark/80 px-3.5 py-1.5 rounded-full border border-dustyPink/20 backdrop-blur-md">
            <Move className="w-3 h-3 text-dustyPink" />
            <span>Click any text to edit &bull; Tap photo slot to crop &amp; replace</span>
          </div>

          {/* MOBILE-FIRST PHOTO SLOTS DOCK (Visible on mobile/tablet screens) */}
          {photoSlots.length > 0 && (
            <div className="md:hidden w-full max-w-lg mt-3 px-2 z-20">
              <div className="p-3 rounded-2xl bg-plum-dark/95 border border-dustyPink/30 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-dustyPink">
                    <Crop className="w-3.5 h-3.5" />
                    <span>Tap Photo to Crop &amp; Change</span>
                  </div>
                  <span className="text-[10px] text-cream/60 font-mono">
                    {photoSlots.length} {photoSlots.length === 1 ? "Slot" : "Slots"}
                  </span>
                </div>

                {/* Horizontal scrollable slot cards */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                  {photoSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const previewImg = slotThumbnails[slot.id] || slot.currentSrc;
                    return (
                      <div
                        key={slot.id}
                        onClick={() => handleSelectSlot(slot)}
                        className={`flex-shrink-0 flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-mauve/30 border-peachPink ring-2 ring-peachPink/50 shadow-lg"
                            : "bg-plum/60 border-dustyPink/20 hover:border-dustyPink/40"
                        }`}
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-cream/20 bg-charcoal flex-shrink-0 shadow-inner">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewImg}
                            alt={slot.label}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-cream leading-tight">
                            {slot.label}
                          </span>
                          <span className="text-[10px] text-dustyPink font-mono">
                            {Math.round(slot.width)}&times;{Math.round(slot.height)} ({slot.aspectRatio}:1)
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePickPhotoForSlot(slot);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cream text-plum hover:bg-dustyPink text-[10px] font-semibold transition-all shadow-sm"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>Replace</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdjustCropForSlot(slot);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-mauve/30 hover:bg-mauve/50 text-cream text-[10px] font-medium transition-all"
                            >
                              <Crop className="w-2.5 h-2.5 text-peachPink" />
                              <span>Crop</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSlot(slot);
                                startAdjustSlotMode(slot);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-mauve/30 hover:bg-mauve/50 text-cream text-[10px] font-medium transition-all"
                              title="Adjust slot geometry"
                            >
                              <Move className="w-2.5 h-2.5 text-peachPink" />
                              <span>Adjust</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* RIGHT EDITING TOOLBAR */}
        {/* ----------------------------------------------------------- */}
        <aside className="w-full md:w-84 lg:w-96 bg-plum-dark/95 border-t md:border-t-0 md:border-l border-dustyPink/20 p-5 overflow-y-auto max-h-[45vh] md:max-h-none flex flex-col gap-5 backdrop-blur-md z-20">
          {/* Section 1: Active Picture Studio */}
          <div className="p-4 rounded-2xl bg-plum/60 border border-dustyPink/30 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dustyPink">
                <Sliders className="w-4 h-4 text-peachPink" />
                <span>Picture Controls</span>
              </div>
              {activeSlot && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-mauve/30 border border-peachPink/40 text-peachPink font-medium">
                  {activeSlot.label}
                </span>
              )}
            </div>

            {activeSlot ? (
              <>
                {/* Active Photo Thumbnail & Meta Info */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-plum-dark/70 border border-dustyPink/20">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-cream/20 bg-charcoal flex-shrink-0 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeSlotPreview}
                      alt={activeSlot.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-cream truncate">
                      {activeSlot.label}
                    </h3>
                    <p className="text-[10px] text-dustyPink font-mono mt-0.5">
                      {Math.round(activeSlot.width)} &times; {Math.round(activeSlot.height)}px
                    </p>
                    <p className="text-[10px] text-cream/60 mt-0.5">
                      Frame Aspect: {activeSlot.aspectRatio}:1
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons: Replace & Crop */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handlePickPhotoForSlot(activeSlot)}
                    className="w-full py-2.5 px-3 rounded-xl bg-cream hover:bg-dustyPink text-plum text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-plum" />
                    <span>Choose Photo from Device</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustCropForSlot(activeSlot)}
                    className="w-full py-2 px-3 rounded-xl bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/40 text-cream text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5 text-peachPink" />
                    <span>Adjust Crop &amp; Proportions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isAdjustingSlot) {
                        stopAdjustSlotMode();
                      } else {
                        startAdjustSlotMode(activeSlot);
                      }
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      isAdjustingSlot
                        ? "bg-peachPink text-plum border-cream font-bold ring-2 ring-peachPink/50"
                        : "bg-mauve/40 hover:bg-mauve/60 border-dustyPink/40 text-cream"
                    }`}
                  >
                    {isAdjustingSlot ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Done Adjusting Slot</span>
                      </>
                    ) : (
                      <>
                        <Move className="w-3.5 h-3.5 text-peachPink" />
                        <span>Adjust Slot Boundary &amp; Tilt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Interactive Slot Geometry Editing Panel */}
                {isAdjustingSlot && adjustingGeometry && (
                  <div className="p-3.5 rounded-2xl bg-plum-dark/95 border-2 border-peachPink/50 space-y-3 shadow-xl ring-1 ring-peachPink/30">
                    <div className="flex items-center justify-between text-[11px] text-peachPink font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Move className="w-3.5 h-3.5" />
                        Slot Geometry Active
                      </span>
                      <span className="font-mono text-cream font-semibold px-2 py-0.5 rounded-md bg-mauve/30 border border-peachPink/30">
                        {adjustingGeometry.rotation > 0
                          ? `+${adjustingGeometry.rotation.toFixed(1)}°`
                          : `${adjustingGeometry.rotation.toFixed(1)}°`}
                      </span>
                    </div>

                    <p className="text-[11px] text-cream/80 leading-relaxed">
                      Drag the dashed box and circular handles on the canvas to resize, position, or rotate the slot frame window.
                    </p>

                    {/* Geometry Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="p-2 rounded-lg bg-plum/70 border border-dustyPink/20 flex flex-col">
                        <span className="text-dustyPink">Dimensions (W &times; H)</span>
                        <span className="text-cream font-bold text-xs mt-0.5">
                          {adjustingGeometry.width} &times; {adjustingGeometry.height}px
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-plum/70 border border-dustyPink/20 flex flex-col">
                        <span className="text-dustyPink">Center (X, Y)</span>
                        <span className="text-cream font-bold text-xs mt-0.5">
                          {adjustingGeometry.cx}, {adjustingGeometry.cy}
                        </span>
                      </div>
                    </div>

                    {/* Fine-Tuning Nudge Controls */}
                    <div className="space-y-2 pt-1 border-t border-dustyPink/20">
                      <div className="text-[10px] uppercase font-semibold text-dustyPink tracking-wider">
                        Fine-Tune Nudges
                      </div>

                      {/* Rotation Nudge */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-cream/90">Tilt Angle</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleNudgeSlot("rotation", -1)}
                            className="px-2 py-0.5 rounded bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/30 text-cream font-mono text-[11px] active:scale-95"
                            title="Rotate -1°"
                          >
                            -1°
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNudgeSlot("rotation", 1)}
                            className="px-2 py-0.5 rounded bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/30 text-cream font-mono text-[11px] active:scale-95"
                            title="Rotate +1°"
                          >
                            +1°
                          </button>
                        </div>
                      </div>

                      {/* Position Nudges */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-cream/90">Position (X / Y)</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleNudgeSlot("cx", -2)}
                            className="px-1.5 py-0.5 rounded bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/30 text-cream font-mono text-[10px] active:scale-95"
                            title="Move Left 2px"
                          >
                            &larr;
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNudgeSlot("cx", 2)}
                            className="px-1.5 py-0.5 rounded bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/30 text-cream font-mono text-[10px] active:scale-95"
                            title="Move Right 2px"
                          >
                            &rarr;
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNudgeSlot("cy", -2)}
                            className="px-1.5 py-0.5 rounded bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/30 text-cream font-mono text-[10px] active:scale-95"
                            title="Move Up 2px"
                          >
                            &uarr;
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNudgeSlot("cy", 2)}
                            className="px-1.5 py-0.5 rounded bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/30 text-cream font-mono text-[10px] active:scale-95"
                            title="Move Down 2px"
                          >
                            &darr;
                          </button>
                        </div>
                      </div>

                      {/* Size Nudges */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-cream/90">Size (W / H)</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleNudgeSlot("width", -4);
                              handleNudgeSlot("height", -4);
                            }}
                            className="px-2 py-0.5 rounded bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/30 text-cream font-mono text-[11px] active:scale-95"
                            title="Shrink by 4px"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleNudgeSlot("width", 4);
                              handleNudgeSlot("height", 4);
                            }}
                            className="px-2 py-0.5 rounded bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/30 text-cream font-mono text-[11px] active:scale-95"
                            title="Expand by 4px"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-dustyPink/20">
                      <button
                        type="button"
                        onClick={stopAdjustSlotMode}
                        className="flex-1 py-2 px-3 rounded-lg bg-cream hover:bg-peachPink text-plum font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-98"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm &amp; Save Slot</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetSlotGeometry(activeSlot)}
                        className="py-2 px-2.5 rounded-lg bg-plum/60 hover:bg-plum/90 border border-dustyPink/30 text-cream/80 hover:text-cream text-xs flex items-center justify-center gap-1 transition-all active:scale-98"
                        title="Reset slot geometry to initial template detection"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Picture Adjustments */}
                <div className="pt-3 border-t border-dustyPink/20 space-y-3">
                  {/* Opacity Slider */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-dustyPink font-semibold uppercase tracking-wider mb-1.5">
                      <span>Photo Opacity</span>
                      <span className="font-mono text-cream font-bold">
                        {Math.round(currentOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={currentOpacity}
                      onChange={(e) => updateActiveSlotProp("opacity", parseFloat(e.target.value))}
                      className="w-full accent-mauve cursor-pointer"
                    />
                  </div>

                  {/* Horizontal Flip & Reset */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleToggleFlipX}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        isFlippedX
                          ? "bg-mauve text-cream border-cream shadow-sm"
                          : "bg-plum-dark/60 text-cream/80 border-dustyPink/20 hover:border-dustyPink/40 hover:text-cream"
                      }`}
                      title="Mirror photo horizontally"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span>{isFlippedX ? "Mirrored" : "Flip Horizontal"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetSlotPhoto(activeSlot)}
                      className="py-1.5 px-2.5 rounded-lg bg-plum-dark/60 hover:bg-red-950/40 border border-dustyPink/20 hover:border-red-400/40 text-cream/70 hover:text-red-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                      title="Reset to default template photo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <ImageIcon className="w-8 h-8 text-dustyPink/60 mx-auto mb-2" />
                <p className="text-xs text-cream/70 mb-3">
                  Upload a photo to place into this template.
                </p>
                <button
                  type="button"
                  onClick={() => triggerImageUpload()}
                  className="w-full py-2.5 px-4 rounded-xl bg-cream text-plum text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: All Template Photo Slots (for templates with multiple slots - hidden on mobile) */}
          {photoSlots.length > 1 && (
            <div className="hidden md:flex p-4 rounded-2xl bg-plum/40 border border-dustyPink/20 flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-dustyPink">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Photo Slots</span>
                </div>
                <span className="text-[10px] lowercase px-2 py-0.5 rounded-full bg-mauve/20 border border-dustyPink/20 text-cream/80">
                  {photoSlots.length} slots
                </span>
              </div>

              <div className="space-y-2">
                {photoSlots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  const previewImg = slotThumbnails[slot.id] || slot.currentSrc;
                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleSelectSlot(slot)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? "bg-mauve/30 border-peachPink ring-1 ring-peachPink/50 shadow-sm"
                          : "bg-plum-dark/50 border-dustyPink/20 hover:border-dustyPink/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-cream/20 bg-charcoal flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewImg}
                            alt={slot.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-cream truncate block">
                            {slot.label}
                          </span>
                          <span className="text-[10px] text-dustyPink font-mono block">
                            {Math.round(slot.width)} &times; {Math.round(slot.height)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePickPhotoForSlot(slot);
                          }}
                          className="px-2 py-1 rounded-lg bg-cream text-plum hover:bg-dustyPink text-[11px] font-semibold transition-all shadow-sm flex items-center gap-1"
                        >
                          <Upload className="w-2.5 h-2.5" />
                          <span>Swap</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustCropForSlot(slot);
                          }}
                          className="p-1 rounded-lg bg-mauve/20 hover:bg-mauve/40 text-cream text-[10px] transition-all"
                          title="Adjust crop"
                        >
                          <Crop className="w-3 h-3 text-peachPink" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSlot(slot);
                            startAdjustSlotMode(slot);
                          }}
                          className="p-1 rounded-lg bg-mauve/20 hover:bg-mauve/40 text-cream text-[10px] transition-all"
                          title="Adjust slot geometry and tilt"
                        >
                          <Move className="w-3 h-3 text-peachPink" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Simple How-It-Works Guide */}
          <div className="p-4 rounded-2xl bg-plum/30 border border-dustyPink/15 text-cream/70 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-dustyPink font-semibold uppercase text-[10px] tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-peachPink" />
              <span>How To Create Your Story</span>
            </div>
            <ul className="text-[11px] space-y-1.5 list-disc list-inside text-cream/80 leading-relaxed">
              <li>Tap any photo inside the template or click a slot above.</li>
              <li>Choose a photo from your phone or PC.</li>
              <li>Crop and position to fit the frame perfectly.</li>
              <li>Click <strong className="text-cream">Export Story</strong> to download in full HD (1080&times;1920).</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Exact-Proportion Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        imageSrc={cropperModal.imageSrc}
        aspectRatio={cropperModal.targetSlot?.aspectRatio || 1}
        targetWidth={cropperModal.targetSlot?.width || 600}
        targetHeight={cropperModal.targetSlot?.height || 600}
        slotLabel={cropperModal.targetSlot?.label || "Photo Slot"}
        onConfirm={(croppedDataUrl) => {
          if (cropperModal.targetSlot) {
            applyCroppedImageToSlot(cropperModal.targetSlot, croppedDataUrl);
          }
          setCropperModal({ isOpen: false, imageSrc: "", targetSlot: null });
          pendingSlotRef.current = null;
        }}
        onCancel={() => {
          setCropperModal({ isOpen: false, imageSrc: "", targetSlot: null });
          pendingSlotRef.current = null;
        }}
      />
    </div>
  );
}
