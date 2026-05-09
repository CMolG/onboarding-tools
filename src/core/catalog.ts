import type { SerializableRecord, SerializableValue, UnlockableDefinition } from './types';

export type SerializableUnlockableDefinition = Omit<UnlockableDefinition, 'meta' | 'effect' | 'tutorial'> & {
  readonly meta: SerializableRecord;
  readonly effect?: SerializableValue;
  readonly tutorial?: SerializableRecord;
};

export function createSerializableCatalog(
  definitions: readonly UnlockableDefinition[],
  options: { readonly warn?: (message: string) => void } = {},
): readonly SerializableUnlockableDefinition[] {
  return definitions.map((definition) => serializeDefinition(definition, options.warn));
}

function serializeDefinition(
  definition: UnlockableDefinition,
  warn: ((message: string) => void) | undefined,
): SerializableUnlockableDefinition {
  const serializable: Omit<SerializableUnlockableDefinition, 'effect' | 'tutorial'> & {
    effect?: SerializableValue;
    tutorial?: SerializableRecord;
  } = {
    id: definition.id,
    ...(definition.archetype === undefined ? {} : { archetype: definition.archetype }),
    ...(definition.autoAssignable === undefined ? {} : { autoAssignable: definition.autoAssignable }),
    meta: sanitizeRecord(definition.meta as unknown as Record<string, unknown>, `Unlockable ${definition.id} meta`, warn),
    ...(definition.unlocksOn === undefined ? {} : { unlocksOn: definition.unlocksOn }),
    ...(definition.visibility === undefined ? {} : { visibility: definition.visibility }),
    ...(definition.activation === undefined ? {} : { activation: definition.activation }),
  };

  if (definition.effect !== undefined) {
    const effect = sanitizeValue(definition.effect, `Unlockable ${definition.id} effect`, warn);
    if (effect !== undefined) {
      serializable.effect = effect;
    }
  }

  if (definition.tutorial !== undefined) {
    serializable.tutorial = sanitizeRecord(definition.tutorial as Record<string, unknown>, `Unlockable ${definition.id} tutorial`, warn);
  }

  return serializable;
}

function sanitizeRecord(
  source: Readonly<Record<string, unknown>>,
  path: string,
  warn: ((message: string) => void) | undefined,
): SerializableRecord {
  const output: Record<string, SerializableValue> = {};
  for (const [key, value] of Object.entries(source)) {
    const serializable = sanitizeValue(value, `${path}.${key}`, warn);
    if (serializable !== undefined) {
      output[key] = serializable;
    }
  }
  return output;
}

function sanitizeValue(
  value: unknown,
  path: string,
  warn: ((message: string) => void) | undefined,
): SerializableValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value;
    }
    warn?.(`${path} is not serializable and was omitted from the unlockable catalog.`);
    return undefined;
  }

  if (Array.isArray(value)) {
    const items: SerializableValue[] = [];
    for (const [index, item] of value.entries()) {
      const serializable = sanitizeValue(item, `${path}[${index}]`, warn);
      if (serializable !== undefined) {
        items.push(serializable);
      }
    }
    return items;
  }

  if (typeof value === 'object' && value !== null) {
    return sanitizeRecord(value as Record<string, unknown>, path, warn);
  }

  warn?.(`${path} is not serializable and was omitted from the unlockable catalog.`);
  return undefined;
}
