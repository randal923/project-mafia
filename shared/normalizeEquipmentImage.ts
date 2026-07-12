type EquipmentImage = {
  alt: string;
  src: string;
};

const LEGACY_EQUIPMENT_IMAGE_PATTERN =
  /^\/images\/items\/([^/?#]+)\.(?:png|svg)$/;

export function normalizeEquipmentImage(
  image: EquipmentImage,
): EquipmentImage {
  const src = image.src.replace(
    LEGACY_EQUIPMENT_IMAGE_PATTERN,
    "/images/items/$1.webp",
  );

  return src === image.src ? image : { ...image, src };
}
