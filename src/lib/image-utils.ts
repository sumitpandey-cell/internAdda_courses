/**
 * Image compression and processing utilities for thumbnail uploads
 * Handles validation, resizing, WebP conversion, and quality optimization
 */

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    targetSizeKB?: number;
    initialQuality?: number;
    minQuality?: number;
    format?: 'webp' | 'jpeg';
}

export interface CompressionResult {
    blob: Blob;
    url: string;
    width: number;
    height: number;
    sizeKB: number;
    format: string;
}

export interface ImageDimensions {
    width: number;
    height: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
    maxWidth: 800,
    maxHeight: 800,
    targetSizeKB: 120,
    initialQuality: 0.85,
    minQuality: 0.5,
    format: 'webp',
};

/**
 * Validates image file before processing
 * @throws Error if validation fails
 */
export async function validateImageFile(file: File): Promise<void> {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
    }

    // Check file size (max 3MB)
    const maxSizeMB = 3;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        throw new Error(`Image must be smaller than ${maxSizeMB}MB`);
    }

    // Check image dimensions
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < 400) {
        throw new Error('Image width must be at least 400px');
    }
}

/**
 * Gets dimensions of an image file
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Calculates new dimensions maintaining aspect ratio
 */
function calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
): ImageDimensions {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if width exceeds max
    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }

    // Scale down if height still exceeds max
    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }

    return {
        width: Math.round(width),
        height: Math.round(height),
    };
}

/**
 * Resizes image using canvas
 */
async function resizeImageWithCanvas(
    file: File,
    targetWidth: number,
    targetHeight: number
): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Use high-quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw resized image
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            resolve(canvas);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for resizing'));
        };

        img.src = url;
    });
}

/**
 * Converts canvas to blob with specified format and quality
 */
function canvasToBlob(
    canvas: HTMLCanvasElement,
    format: 'webp' | 'jpeg',
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error(`Failed to convert to ${format}`));
                }
            },
            mimeType,
            quality
        );
    });
}

/**
 * Checks if browser supports WebP
 */
function supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Compresses image iteratively to meet target size
 */
async function compressToTargetSize(
    canvas: HTMLCanvasElement,
    options: Required<CompressionOptions>
): Promise<Blob> {
    let format = options.format;

    // Fallback to JPEG if WebP not supported
    if (format === 'webp' && !supportsWebP()) {
        console.warn('WebP not supported, falling back to JPEG');
        format = 'jpeg';
    }

    const qualitySteps = [
        options.initialQuality,
        0.75,
        0.65,
        0.55,
        options.minQuality,
    ];

    for (const quality of qualitySteps) {
        if (quality < options.minQuality) break;

        try {
            const blob = await canvasToBlob(canvas, format, quality);
            const sizeKB = blob.size / 1024;

            // If size is acceptable, return
            if (sizeKB <= options.targetSizeKB) {
                return blob;
            }

            // If we're at minimum quality and still too large, try JPEG if we were using WebP
            if (quality === options.minQuality && format === 'webp') {
                format = 'jpeg';
                const jpegBlob = await canvasToBlob(canvas, format, quality);
                return jpegBlob; // Return even if larger, we've done our best
            }
        } catch (error) {
            // If WebP conversion fails, try JPEG
            if (format === 'webp') {
                console.warn('WebP conversion failed, trying JPEG');
                format = 'jpeg';
                return canvasToBlob(canvas, format, quality);
            }
            throw error;
        }
    }

    // If we couldn't meet target, return the smallest we could make
    return canvasToBlob(canvas, format, options.minQuality);
}

/**
 * Main compression function
 * Validates, resizes, and compresses image to meet requirements
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Validate file
    await validateImageFile(file);

    // Get original dimensions
    const originalDimensions = await getImageDimensions(file);

    // Calculate target dimensions
    const targetDimensions = calculateDimensions(
        originalDimensions.width,
        originalDimensions.height,
        opts.maxWidth,
        opts.maxHeight
    );

    // Resize image
    const canvas = await resizeImageWithCanvas(
        file,
        targetDimensions.width,
        targetDimensions.height
    );

    // Compress to target size
    const blob = await compressToTargetSize(canvas, opts);

    // Create object URL for preview
    const url = URL.createObjectURL(blob);

    return {
        blob,
        url,
        width: targetDimensions.width,
        height: targetDimensions.height,
        sizeKB: blob.size / 1024,
        format: blob.type.split('/')[1],
    };
}

/**
 * Revokes object URL to free memory
 */
export function revokeImageURL(url: string): void {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}
