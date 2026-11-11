import {
  ImageManipulator,
  SaveFormat,
  type ImageRef,
} from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** The API takes at most 1 MB a screenshot. */
export const screenshotMaxBytes = 1024 * 1024;

// Big enough to read any text on a phone's screen.
const longestSide = 1600;
const qualities = [0.7, 0.5, 0.3];

export type PickedScreenshots =
  | { kind: 'picked'; images: string[] }
  | { kind: 'denied' }
  | { kind: 'cancelled' };

/** How many bytes a Base64 text holds. */
export function base64Bytes(base64: string) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;

  return (base64.length * 3) / 4 - padding;
}

/** Lets the user choose up to `limit` screenshots, and returns each as a Base64 JPEG of at most 1 MB. */
export async function pickScreenshots(
  limit: number,
): Promise<PickedScreenshots> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { kind: 'denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 1,
  });
  if (result.canceled) {
    return { kind: 'cancelled' };
  }

  return {
    kind: 'picked',
    images: await Promise.all(result.assets.slice(0, limit).map(compress)),
  };
}

async function compress(asset: ImagePicker.ImagePickerAsset) {
  const context = ImageManipulator.manipulate(asset.uri);
  const sized =
    Math.max(asset.width, asset.height) > longestSide
      ? context.resize(
          asset.width >= asset.height
            ? { width: longestSide }
            : { height: longestSide },
        )
      : context;
  const rendered = await sized.renderAsync();

  for (const quality of qualities) {
    const base64 = await save(rendered, quality);
    if (base64Bytes(base64) <= screenshotMaxBytes) {
      return base64;
    }
  }

  throw new Error('The screenshot is too large.');
}

async function save(rendered: ImageRef, quality: number) {
  const { base64 } = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: quality,
    base64: true,
  });
  if (base64 === undefined) {
    throw new Error('The screenshot could not be read.');
  }

  return base64;
}
