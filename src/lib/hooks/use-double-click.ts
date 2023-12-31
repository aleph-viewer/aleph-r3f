import { useCallback, useRef } from 'react';

const useDoubleClick = (doubleClick: (e: MouseEvent) => void, timeout: number = 500) => {
  type Timeout = /*unresolved*/ any;

  const clickTimeout = useRef<string | number | Timeout | undefined>();

  const clearClickTimeout = () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
  };

  return useCallback(
    (event: any) => {
      clearClickTimeout();
      // if (click && event.detail === 1) {
      //   clickTimeout.current = setTimeout(() => {
      //     click(event);
      //   }, timeout);
      // }
      if (event.detail % 2 === 0) {
        doubleClick(event);
      }
    },
    [doubleClick, timeout]
  );
};

export default useDoubleClick;
