/**
 * Utility to optimize and compress document / exam photos on the client side
 * before sending them to the backend. This prevents HTTP 413 (Payload Too Large)
 * errors, drastically cuts network latency, and ensures Gemini receives
 * crisp, perfectly-sized images for OCR and handwriting evaluation.
 */

export interface OptimizeOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export async function optimizeImage(
  input: File | string,
  options: OptimizeOptions = {}
): Promise<string> {
  const {
    maxDimension = 1600,
    quality = 0.82,
    maxSizeBytes = 1_000_000, // ~1MB max per page base64
  } = options;

  // If it's an external HTTP/HTTPS URL, don't re-compress
  if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
    return input;
  }

  // Load into Image
  const img = await loadImage(input);

  // Calculate scaled dimensions
  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // If canvas context fails, fallback to raw data
    if (typeof input === 'string') return input;
    return fileToDataURL(input);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  let currentQuality = quality;
  let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

  // If still too large (e.g. very dense or noisy scan), step down quality slightly
  if (dataUrl.length > maxSizeBytes && currentQuality > 0.65) {
    currentQuality = 0.72;
    dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
  }

  return dataUrl;
}

function loadImage(input: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Nie udało się załadować obrazu: ' + err));

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(input);
    }
  });
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable size (e.g. 420 KB)
 */
export function formatDataSize(base64String: string): string {
  if (!base64String) return '0 KB';
  if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return 'URL';
  }
  // Base64 length * 0.75 ≈ actual byte count
  const bytes = Math.round(base64String.length * 0.75);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
