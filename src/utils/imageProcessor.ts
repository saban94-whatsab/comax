import { FilterMode, CropRect } from '../types';

/**
 * Applies document filters (B&W Threshold, Grayscale, Contrast, Original)
 * and optional crop & rotation onto a canvas and returns Base64 data.
 */
export async function processDocumentImage(
  imageBase64: string,
  filterMode: FilterMode = 'bw',
  cropRect?: CropRect,
  rotation: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(imageBase64);
        }

        let width = img.width;
        let height = img.height;

        // Calculate crop bounds if provided
        let cropX = 0;
        let cropY = 0;
        let cropWidth = width;
        let cropHeight = height;

        if (cropRect) {
          cropX = (cropRect.x / 100) * width;
          cropY = (cropRect.y / 100) * height;
          cropWidth = (cropRect.width / 100) * width;
          cropHeight = (cropRect.height / 100) * height;
        }

        // Handle Rotation dimensions
        if (rotation === 90 || rotation === 270) {
          canvas.width = cropHeight;
          canvas.height = cropWidth;
        } else {
          canvas.width = cropWidth;
          canvas.height = cropHeight;
        }

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        if (rotation === 90 || rotation === 270) {
          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            -cropHeight / 2,
            -cropWidth / 2,
            cropHeight,
            cropWidth
          );
        } else {
          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            -cropWidth / 2,
            -cropHeight / 2,
            cropWidth,
            cropHeight
          );
        }

        ctx.restore();

        // If filter is original, just return current canvas
        if (filterMode === 'original') {
          return resolve(canvas.toDataURL('image/jpeg', 0.9));
        }

        // Apply Pixel Filters
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const len = data.length;

        if (filterMode === 'grayscale') {
          for (let i = 0; i < len; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
        } else if (filterMode === 'contrast') {
          // Contrast boost (contrast factor = 1.5)
          const factor = (259 * (128 + 255)) / (255 * (259 - 128));
          for (let i = 0; i < len; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            let newColor = factor * (gray - 128) + 128;
            newColor = Math.min(255, Math.max(0, newColor));
            data[i] = newColor;
            data[i + 1] = newColor;
            data[i + 2] = newColor;
          }
        } else if (filterMode === 'bw') {
          // High Contrast B&W Document Thresholding (Document Mode)
          // 1. Calculate Average Luminance
          let totalLuminance = 0;
          for (let i = 0; i < len; i += 16) {
            totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          }
          const avgLuminance = totalLuminance / (len / 16);
          // Set threshold slightly below average to keep text crisp white background
          const threshold = Math.min(210, Math.max(100, avgLuminance - 15));

          for (let i = 0; i < len; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const v = gray > threshold ? 255 : 0;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = imageBase64;
  });
}

/**
 * Detects document edges automatically and returns a recommended CropRect.
 */
export async function autoDetectEdges(imageBase64: string): Promise<CropRect> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          return resolve({ x: 4, y: 4, width: 92, height: 92 });
        }

        const scale = Math.min(1, 400 / img.width);
        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);
        tempCanvas.width = w;
        tempCanvas.height = h;

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Simple edge bounds finder based on contrast diffs
        let minX = w, maxX = 0, minY = h, maxY = 0;
        const threshold = 35;

        for (let y = 10; y < h - 10; y += 4) {
          for (let x = 10; x < w - 10; x += 4) {
            const idx = (y * w + x) * 4;
            const rightIdx = (y * w + (x + 2)) * 4;
            const downIdx = ((y + 2) * w + x) * 4;

            const val = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            const rightVal = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
            const downVal = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];

            if (Math.abs(val - rightVal) > threshold || Math.abs(val - downVal) > threshold) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX <= minX || maxY <= minY) {
          return resolve({ x: 3, y: 3, width: 94, height: 94 });
        }

        // Add 3% margin to detected box
        const cropXPercent = Math.max(0, Math.floor((minX / w) * 100) - 2);
        const cropYPercent = Math.max(0, Math.floor((minY / h) * 100) - 2);
        const cropWPercent = Math.min(100 - cropXPercent, Math.ceil(((maxX - minX) / w) * 100) + 4);
        const cropHPercent = Math.min(100 - cropYPercent, Math.ceil(((maxY - minY) / h) * 100) + 4);

        resolve({
          x: cropXPercent,
          y: cropYPercent,
          width: cropWPercent,
          height: cropHPercent,
        });
      } catch {
        resolve({ x: 2, y: 2, width: 96, height: 96 });
      }
    };
    img.onerror = () => resolve({ x: 2, y: 2, width: 96, height: 96 });
    img.src = imageBase64;
  });
}
