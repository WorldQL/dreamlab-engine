import { useCallback, useState } from "react";

export const useForceUpdate = () => {
  // eslint-disable-next-line react/hook-use-state
  const [_, updateState] = useState<unknown>();
  return useCallback(() => updateState({}), []);
};
