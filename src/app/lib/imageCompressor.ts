// lib/imageCompressor.ts
// Compresses raw user photos in-browser using HTML5 Canvas before uploading to Supabase

export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1600,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve, reject) => {
    // If SVG or gif or already very small, return as is
    if (file.type === "image/svg+xml" || file.type === "image/gif" || file.size < 150 * 1024) {
      return resolve(file);
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        return resolve(file);
      }
      img.src = e.target.result as string;
    };

    reader.onerror = () => resolve(file);

    img.onload = () => {
      let { width, height } = img;

      // Maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(file);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
