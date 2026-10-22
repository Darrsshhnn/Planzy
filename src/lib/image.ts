/**
 * Browser-side photo resizing, so picked photos are small enough to keep in
 * local storage. With a backend these would be uploaded instead.
 */
async function draw(file: File, crop: "square" | "fit", max: number, quality: number) {
  if (!file.type.startsWith("image/")) throw new Error("not an image");
  const bitmap = await createImageBitmap(file);
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (crop === "square") {
    const side = Math.min(sw, sh);
    sx = (sw - side) / 2;
    sy = (sh - side) / 2;
    sw = sh = side;
  }
  const scale = Math.min(1, max / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** 256px square, for profile photos. */
export function toAvatarDataUrl(file: File) {
  return draw(file, "square", 256, 0.85);
}

/** Up to 720px on the long side, for review photos. */
export function toReviewPhotoDataUrl(file: File) {
  return draw(file, "fit", 720, 0.78);
}
