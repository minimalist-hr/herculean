import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const photoSide = 512;
const photoQuality = 0.8;

export type PhotoSource = 'camera' | 'library';

export type PickedPhoto =
  | { kind: 'picked'; image: string }
  | { kind: 'denied' }
  | { kind: 'cancelled' };

async function askPermission(source: PhotoSource) {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  return permission.granted;
}

/** Lets the user take or choose a photo, drag and zoom it to a square, and returns it small, as a Base64 JPEG. */
export async function pickPhoto(source: PhotoSource): Promise<PickedPhoto> {
  if (!(await askPermission(source))) {
    return { kind: 'denied' };
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) {
    return { kind: 'cancelled' };
  }

  const rendered = await ImageManipulator.manipulate(result.assets[0].uri)
    .resize({ width: photoSide, height: photoSide })
    .renderAsync();
  const { base64 } = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: photoQuality,
    base64: true,
  });
  if (base64 === undefined) {
    throw new Error('The photo could not be read.');
  }

  return { kind: 'picked', image: base64 };
}
