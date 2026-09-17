/**
 * Downscale and compress base64 image data URLs for memory safety on mobile devices (Android WebView).
 * Converts multi-megabyte camera/gallery photos to a lightweight JPEG string (~100KB - 250KB).
 */
export async function compressAndResizeImage(
  dataUrl: string,
  maxDimension = 1024,
  quality = 0.8
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return dataUrl || '';
  }

  // If base64 string is already compact (< 350KB chars), return as is
  if (dataUrl.length < 350 * 1024) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

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
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            console.info(
              `[FoodCheck Image] Compressed base64 from ${dataUrl.length} to ${compressed.length} chars (${width}x${height})`
            );
            resolve(compressed);
          } else {
            resolve(dataUrl);
          }
        } catch (err) {
          console.warn('[FoodCheck Image] Compression canvas error:', err);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch (err) {
      console.warn('[FoodCheck Image] Image load error:', err);
      resolve(dataUrl);
    }
  });
}
