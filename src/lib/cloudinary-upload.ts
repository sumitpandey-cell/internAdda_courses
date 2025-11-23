/**
 * Cloudinary upload utility for thumbnail images
 * Uses unsigned upload preset for secure client-side uploads
 */

export interface CloudinaryUploadOptions {
    folder?: string;
    onProgress?: (progress: number) => void;
}

export interface CloudinaryUploadResult {
    url: string;
    secureUrl: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
}

/**
 * Upload a blob to Cloudinary using unsigned upload
 * @param blob - The image blob to upload (already compressed)
 * @param filename - Original filename
 * @param options - Upload options (folder, progress callback)
 * @returns Cloudinary upload result with secure URL
 */
export async function uploadToCloudinary(
    blob: Blob,
    filename: string,
    options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Validate environment variables
    if (!cloudName || !uploadPreset) {
        throw new Error(
            'Cloudinary credentials not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local'
        );
    }

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('upload_preset', uploadPreset);

    // Add folder if specified
    if (options.folder) {
        formData.append('folder', options.folder);
    }

    // Add timestamp to filename for uniqueness
    const timestamp = Date.now();
    formData.append('public_id', `${timestamp}_${filename.replace(/\.[^/.]+$/, '')}`);

    try {
        // Upload to Cloudinary
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message || `Upload failed with status ${response.status}`
            );
        }

        const data = await response.json();

        // Return structured result
        return {
            url: data.url,
            secureUrl: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            width: data.width,
            height: data.height,
            bytes: data.bytes,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Cloudinary upload failed: ${error.message}`);
        }
        throw new Error('Cloudinary upload failed: Unknown error');
    }
}

/**
 * Generate Cloudinary URL with transformations
 * Useful for responsive images or custom sizes
 */
export function getCloudinaryUrl(
    publicId: string,
    transformations?: {
        width?: number;
        height?: number;
        crop?: 'fill' | 'fit' | 'scale' | 'thumb';
        quality?: 'auto' | number;
        format?: 'auto' | 'webp' | 'jpg' | 'png';
    }
): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
        throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not configured');
    }

    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

    if (!transformations) {
        return `${baseUrl}/${publicId}`;
    }

    const params: string[] = [];

    if (transformations.width) params.push(`w_${transformations.width}`);
    if (transformations.height) params.push(`h_${transformations.height}`);
    if (transformations.crop) params.push(`c_${transformations.crop}`);
    if (transformations.quality) params.push(`q_${transformations.quality}`);
    if (transformations.format) params.push(`f_${transformations.format}`);

    const transformString = params.join(',');

    return `${baseUrl}/${transformString}/${publicId}`;
}
