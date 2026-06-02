import sharp from "sharp";

export class ImageResizeService {
  public static readonly AI_COPY_WIDTH = 2048;
  public static readonly PREVIEW_WIDTH = 1600;
  public static readonly THUMBNAIL_WIDTH = 300;

  /**
   * Resizes an image buffer to a maximum width, keeping aspect ratio.
   * If the original image is narrower than maxWidth, it is not upscaled.
   */
  async resizeImage(buffer: Buffer, maxWidth: number): Promise<Buffer> {
    return sharp(buffer)
      .resize({
        width: maxWidth,
        withoutEnlargement: true
      })
      .toBuffer();
  }

  /**
   * Extracts metadata (width, height, format) from an image buffer.
   */
  async getImageMetadata(buffer: Buffer): Promise<{ width?: number; height?: number; format?: string }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    };
  }
}

export const imageResizeService = new ImageResizeService();
