import { pickPhoto } from './pick-photo';

const mockCamera = jest.fn();
const mockLibrary = jest.fn();
const mockCameraPermission = jest.fn();
const mockLibraryPermission = jest.fn();
const mockResize = jest.fn();
const mockSave = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: () => mockCameraPermission() as unknown,
  requestMediaLibraryPermissionsAsync: () => mockLibraryPermission() as unknown,
  launchCameraAsync: (options: unknown) => mockCamera(options) as unknown,
  launchImageLibraryAsync: (options: unknown) =>
    mockLibrary(options) as unknown,
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: () => ({
      resize: (size: unknown) => {
        mockResize(size);
        return {
          renderAsync: () =>
            Promise.resolve({
              saveAsync: (options: unknown) => mockSave(options) as unknown,
            }),
        };
      },
    }),
  },
}));

const picked = { canceled: false, assets: [{ uri: 'file:///photo.jpg' }] };

beforeEach(() => {
  jest.resetAllMocks();
  mockCameraPermission.mockResolvedValue({ granted: true });
  mockLibraryPermission.mockResolvedValue({ granted: true });
  mockCamera.mockResolvedValue(picked);
  mockLibrary.mockResolvedValue(picked);
  mockSave.mockResolvedValue({ base64: 'small' });
});

test.each([
  ['camera', mockCamera],
  ['library', mockLibrary],
] as const)(
  'from the %s it crops to a square and returns a small JPEG',
  async (source, launch) => {
    await expect(pickPhoto(source)).resolves.toEqual({
      kind: 'picked',
      image: 'small',
    });
    expect(launch).toHaveBeenCalledWith(
      expect.objectContaining({ allowsEditing: true, aspect: [1, 1] }),
    );
    expect(mockResize).toHaveBeenCalledWith({ width: 512, height: 512 });
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'jpeg', base64: true }),
    );
  },
);

test('without permission it says denied and opens nothing', async () => {
  mockCameraPermission.mockResolvedValue({ granted: false });

  await expect(pickPhoto('camera')).resolves.toEqual({ kind: 'denied' });
  expect(mockCamera).not.toHaveBeenCalled();
});

test('cancelling picks nothing', async () => {
  mockLibrary.mockResolvedValue({ canceled: true, assets: null });

  await expect(pickPhoto('library')).resolves.toEqual({ kind: 'cancelled' });
  expect(mockSave).not.toHaveBeenCalled();
});

test('an unreadable photo throws', async () => {
  mockSave.mockResolvedValue({});

  await expect(pickPhoto('library')).rejects.toThrow();
});
