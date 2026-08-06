export type CropRect = { sx: number; sy: number; sw: number; sh: number };

export const calculateCropRect = (
  imageWidth: number,
  imageHeight: number,
  aspect: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
): CropRect => {
  const safeZoom = Math.min(3, Math.max(1, zoom));
  const safeX = Math.min(1, Math.max(-1, offsetX));
  const safeY = Math.min(1, Math.max(-1, offsetY));
  const imageAspect = imageWidth / imageHeight;
  const baseWidth = imageAspect > aspect ? imageHeight * aspect : imageWidth;
  const baseHeight = imageAspect > aspect ? imageHeight : imageWidth / aspect;
  const sw = baseWidth / safeZoom;
  const sh = baseHeight / safeZoom;
  return {
    sx: (imageWidth - sw) / 2 + safeX * ((imageWidth - sw) / 2),
    sy: (imageHeight - sh) / 2 + safeY * ((imageHeight - sh) / 2),
    sw,
    sh,
  };
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не вдалося прочитати зображення.'));
    };
    image.src = url;
  });

export async function cropImage(
  file: File,
  options: {
    aspect: number;
    width: number;
    height: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
  },
) {
  const image = await loadImage(file);
  const crop = calculateCropRect(
    image.naturalWidth,
    image.naturalHeight,
    options.aspect,
    options.zoom,
    options.offsetX,
    options.offsetY,
  );
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Обрізання зображення не підтримується браузером.');
  context.drawImage(
    image,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    options.width,
    options.height,
  );
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Не вдалося створити WebP.'))),
      'image/webp',
      0.88,
    ),
  );
}
