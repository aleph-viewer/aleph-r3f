import { useEffect, useCallback } from 'react';

function useEventListener<T = unknown>(eventName: string, handler: (e: CustomEvent<T>) => void) {
  useEffect(() => {
    window.addEventListener(eventName, handler as EventListener);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener(eventName, handler as EventListener);
    };
  }, [eventName, handler]); // Re-run if eventName or handler changes
}

function useEventTrigger(eventName: string) {
  // Event trigger function
  const triggerEvent = useCallback(
    (detail?: unknown) => {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    },
    [eventName]
  );

  return triggerEvent;
}

export { useEventListener, useEventTrigger };
