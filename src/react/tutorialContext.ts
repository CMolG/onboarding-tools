import { createContext, useContext } from 'react';

export const UnlockableTutorialEngineContext = createContext(false);

export function useUnlockableTutorialEngineMounted(): boolean {
  return useContext(UnlockableTutorialEngineContext);
}
