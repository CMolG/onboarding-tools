import { useEffect } from 'react';
import { useUnlockableContext } from './UnlockableProvider';
import type { UnlockableDefinition } from '../core/types';

export interface UnlockableCatalogRegistrarProps {
  readonly definitions: readonly UnlockableDefinition[];
}

export function UnlockableCatalogRegistrar({ definitions }: UnlockableCatalogRegistrarProps) {
  const { registerUnlockable } = useUnlockableContext();

  useEffect(() => {
    const unregister = definitions.map((definition) => registerUnlockable(definition));
    return () => {
      unregister.forEach((dispose) => dispose());
    };
  }, [definitions, registerUnlockable]);

  return null;
}
