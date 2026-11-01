import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/** The height of the keyboard, or 0 while it is closed. */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showing = Keyboard.addListener('keyboardDidShow', (event) => {
      setHeight(event.endCoordinates.height);
    });
    const hiding = Keyboard.addListener('keyboardDidHide', () => {
      setHeight(0);
    });

    return () => {
      showing.remove();
      hiding.remove();
    };
  }, []);

  return height;
}
