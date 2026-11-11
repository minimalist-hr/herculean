import { base64Bytes, pickScreenshots } from './pick-screenshots';

const mockLibrary = jest.fn();
const mockPermission = jest.fn();
const mockResize = jest.fn();
const mockSave = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => mockPermission() as unknown,
  launchImageLibraryAsync: (options: unknown) =>
    mockLibrary(options) as unknown,
}));

jest.mock('expo-image-manipulator', () => {
  const rendered = {
    saveAsync: (options: unknown) => mockSave(options) as unknown,
  };
  const context = {
    resize: (size: unknown) => {
      mockResize(size);
      return context;
    },
    renderAsync: () => Promise.resolve(rendered),
  };
  return {
    SaveFormat: { JPEG: 'jpeg' },
    ImageManipulator: { manipulate: () => context },
  };
});

const megabyte = 1024 * 1024;

/** Base64 text that holds this many bytes. */
function base64Of(bytes: number) {
  return 'A'.repeat((bytes / 3) * 4);
}

function asset(width: number, height: number) {
  return { uri: 'file:///shot.png', width, height };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockPermission.mockResolvedValue({ granted: true });
  mockLibrary.mockResolvedValue({
    canceled: false,
    assets: [asset(1080, 2400)],
  });
  mockSave.mockResolvedValue({ base64: 'small' });
});

test('base64 text counts its bytes, without the padding', () => {
  expect(base64Bytes('AAAA')).toBe(3);
  expect(base64Bytes('AAA=')).toBe(2);
  expect(base64Bytes('AA==')).toBe(1);
});

test('picks up to the limit from the library, as JPEGs with the longest side at 1600', async () => {
  await expect(pickScreenshots(2)).resolves.toEqual({
    kind: 'picked',
    images: ['small'],
  });
  expect(mockLibrary).toHaveBeenCalledWith(
    expect.objectContaining({
      allowsMultipleSelection: true,
      selectionLimit: 2,
    }),
  );
  expect(mockResize).toHaveBeenCalledWith({ height: 1600 });
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({ format: 'jpeg', compress: 0.7, base64: true }),
  );
});

test('a wide screenshot is sized by its width, and a small one stays as it is', async () => {
  mockLibrary.mockResolvedValue({
    canceled: false,
    assets: [asset(2400, 1080), asset(800, 600)],
  });

  await pickScreenshots(3);

  expect(mockResize).toHaveBeenCalledTimes(1);
  expect(mockResize).toHaveBeenCalledWith({ width: 1600 });
});

test('a screenshot over 1 MB is saved smaller until it fits', async () => {
  mockSave
    .mockResolvedValueOnce({ base64: base64Of(megabyte + 3) })
    .mockResolvedValueOnce({ base64: base64Of(megabyte) });

  await expect(pickScreenshots(1)).resolves.toEqual({
    kind: 'picked',
    images: [base64Of(megabyte)],
  });
  expect(mockSave).toHaveBeenLastCalledWith(
    expect.objectContaining({ compress: 0.5 }),
  );
});

test('a screenshot that never fits fails', async () => {
  mockSave.mockResolvedValue({ base64: base64Of(megabyte + 3) });

  await expect(pickScreenshots(1)).rejects.toThrow('too large');
});

test('a screenshot that can’t be read fails', async () => {
  mockSave.mockResolvedValue({});

  await expect(pickScreenshots(1)).rejects.toThrow('could not be read');
});

test('blocked photo access and a cancelled pick return no screenshot', async () => {
  mockPermission.mockResolvedValueOnce({ granted: false });
  await expect(pickScreenshots(3)).resolves.toEqual({ kind: 'denied' });

  mockLibrary.mockResolvedValueOnce({ canceled: true });
  await expect(pickScreenshots(3)).resolves.toEqual({ kind: 'cancelled' });
});
