'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, Loader2, ImageIcon, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { compressImage, revokeImageURL, type CompressionResult } from '@/lib/image-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ThumbnailUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    onFileReady?: (file: Blob, filename: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
}

export function ThumbnailUploader({
    value,
    onChange,
    onFileReady,
    onError,
    disabled = false,
}: ThumbnailUploaderProps) {
    const [compressing, setCompressing] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const [error, setError] = useState<string | null>(null);
    const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
    const [urlInput, setUrlInput] = useState<string>('');
    const [validatingUrl, setValidatingUrl] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleError = (errorMessage: string) => {
        setError(errorMessage);
        if (onError) {
            onError(errorMessage);
        }
    };

    const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        setCompressing(true);

        try {
            // Compress the image
            const result = await compressImage(file, {
                maxWidth: 800,
                maxHeight: 800,
                targetSizeKB: 120,
                initialQuality: 0.85,
                minQuality: 0.5,
                format: 'webp',
            });

            // Clean up old preview
            if (preview && preview.startsWith('blob:')) {
                revokeImageURL(preview);
            }

            // Set new preview
            setPreview(result.url);
            setCompressionInfo(result);

            // Notify parent component
            if (onFileReady) {
                const filename = `thumbnail_${Date.now()}.${result.format}`;
                onFileReady(result.blob, filename);
            }

            // For now, just set the preview URL (actual upload happens in parent)
            onChange(result.url);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
            handleError(errorMessage);
        } finally {
            setCompressing(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        if (preview && preview.startsWith('blob:')) {
            revokeImageURL(preview);
        }
        setPreview(null);
        setCompressionInfo(null);
        setError(null);
        onChange('');
    };

    const handleClick = () => {
        if (!disabled && !compressing) {
            fileInputRef.current?.click();
        }
    };

    const handleUrlSubmit = async () => {
        if (!urlInput.trim()) {
            handleError('Please enter a valid URL');
            return;
        }

        setValidatingUrl(true);
        setError(null);

        try {
            // Validate that URL is accessible and is an image
            const response = await fetch(urlInput, { method: 'HEAD' });
            if (!response.ok) {
                throw new Error('URL is not accessible');
            }

            const contentType = response.headers.get('content-type');
            if (!contentType?.startsWith('image/')) {
                throw new Error('URL does not point to an image');
            }

            // Clean up old preview
            if (preview && preview.startsWith('blob:')) {
                revokeImageURL(preview);
            }

            setPreview(urlInput);
            setCompressionInfo(null);
            onChange(urlInput);
            setUrlInput('');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to validate image URL';
            handleError(errorMessage);
        } finally {
            setValidatingUrl(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Tabs for Upload and URL */}
            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        From URL
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                    {/* Upload Area */}
                    <div
                        onClick={handleClick}
                        className={`
              relative border-2 border-dashed rounded-lg overflow-hidden
              transition-colors cursor-pointer
              ${disabled || compressing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
              ${error ? 'border-destructive' : 'border-muted-foreground/25'}
              ${preview ? 'aspect-video' : 'aspect-video md:aspect-[2/1]'}
            `}
                    >
                        {preview && !urlInput ? (
                            // Preview
                            <div className="relative w-full h-full">
                                <img
                                    src={preview}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                />
                                {!disabled && !compressing && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove();
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            // Upload Prompt
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                {compressing ? (
                                    <>
                                        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                                        <p className="text-sm text-muted-foreground font-medium">
                                            Compressing image...
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This may take a moment
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="rounded-full bg-muted p-4 mb-4">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium mb-1">
                                            Click to upload thumbnail
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            PNG, JPG, WebP (max 3MB, min width 400px)
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Will be optimized to ≤120KB
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={disabled || compressing}
                            className="hidden"
                        />
                    </div>

                    {/* Compression Info */}
                    {compressionInfo && !error && (
                        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md">
                            <div className="flex justify-between">
                                <span>Dimensions:</span>
                                <span className="font-medium">
                                    {compressionInfo.width} × {compressionInfo.height}px
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>File size:</span>
                                <span className="font-medium">
                                    {compressionInfo.sizeKB.toFixed(1)} KB
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Format:</span>
                                <span className="font-medium uppercase">{compressionInfo.format}</span>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                    {/* URL Input Area */}
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                type="url"
                                placeholder="e.g., https://example.com/image.jpg"
                                value={urlInput}
                                onChange={(e) => {
                                    setUrlInput(e.target.value);
                                    setError(null);
                                }}
                                disabled={validatingUrl || disabled}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                onClick={handleUrlSubmit}
                                disabled={validatingUrl || disabled || !urlInput.trim()}
                                className="px-6"
                            >
                                {validatingUrl ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Add'
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Paste the direct URL to an image (JPEG, PNG, WebP, etc.)
                        </p>
                    </div>

                    {/* URL Preview */}
                    {preview && urlInput === '' && (
                        <div className="space-y-2">
                            <div
                                className={`
                  relative border-2 border-solid rounded-lg overflow-hidden
                  ${error ? 'border-destructive' : 'border-primary/20'}
                  aspect-video
                `}
                            >
                                <img
                                    src={preview}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                />
                                {!disabled && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8"
                                        onClick={() => handleRemove()}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Image preview from URL
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
