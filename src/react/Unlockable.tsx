import { useEffect, useRef, type ReactNode } from 'react';
import { runUnlockEffect } from '../core/effects';
import { UnlockableOverlay } from './UnlockableOverlay';
import { useUnlockable, useUnlockableContext } from './UnlockableProvider';
import type { UnlockableDefinition } from '../core/types';

export interface UnlockableProps extends UnlockableDefinition {
  readonly children: ReactNode;
  readonly placeholder?: ReactNode;
  readonly disabledFallback?: ReactNode;
  readonly className?: string;
  readonly definition?: never;
}

export interface UnlockableDefinitionProps {
  readonly definition: UnlockableDefinition;
  readonly children: ReactNode;
  readonly placeholder?: ReactNode;
  readonly disabledFallback?: ReactNode;
  readonly className?: string;
}

export function Unlockable(props: UnlockableProps | UnlockableDefinitionProps) {
  const context = useUnlockableContext();
  const { completeUnlock, registerElement, registerUnlockable, theme } = context;
  const definition = toDefinition(props);
  const mountedDefinition = useRef(definition);
  const { status } = useUnlockable(definition.id);
  const contentRef = useRef<HTMLDivElement>(null);
  const effectStarted = useRef(false);
  const visibility = definition.visibility ?? 'hidden';
  const activation = definition.activation ?? 'automatic';

  useEffect(() => registerUnlockable(mountedDefinition.current), [registerUnlockable]);

  useEffect(() => {
    registerElement(definition.id, contentRef.current);
    return () => registerElement(definition.id, null);
  }, [definition.id, registerElement, status]);

  useEffect(() => {
    if (status !== 'UNLOCKING' || effectStarted.current) {
      if (status !== 'UNLOCKING') {
        effectStarted.current = false;
      }
      return;
    }

    effectStarted.current = true;
    runUnlockEffect(definition.effect, {
      element: contentRef.current,
      defaultEffect: theme.defaultEffect,
    }).then(() => {
      completeUnlock(definition.id);
    });
  }, [completeUnlock, definition.effect, definition.id, status, theme.defaultEffect]);

  if (status === 'UNLOCKED' || status === 'UNLOCKING') {
    return (
      <div ref={contentRef} tabIndex={-1} data-unlockable={definition.id} className={getClassName(props)}>
        {props.children}
      </div>
    );
  }

  if (status === 'ELIGIBLE' && activation === 'manual') {
    return (
      <>
        {renderShell(visibility, props)}
        <UnlockableOverlay definition={definition} status={status} />
      </>
    );
  }

  if (status === 'HIDDEN' || visibility === 'hidden') {
    return renderShell(visibility, props);
  }

  return renderShell(visibility, props);
}

function toDefinition(props: UnlockableProps | UnlockableDefinitionProps): UnlockableDefinition {
  if ('definition' in props && props.definition) {
    return props.definition;
  }

  const {
    children: _children,
    placeholder: _placeholder,
    disabledFallback: _disabledFallback,
    className: _className,
    ...definition
  } = props;
  return definition;
}

function renderShell(visibility: UnlockableDefinition['visibility'] | undefined, props: UnlockableProps | UnlockableDefinitionProps) {
  if (visibility === 'placeholder') {
    return props.placeholder ? <div data-unlockable-placeholder="true">{props.placeholder}</div> : null;
  }

  if (visibility === 'disabled') {
    return <div aria-disabled="true" data-unlockable-disabled="true">{props.disabledFallback ?? props.children}</div>;
  }

  return null;
}

function getClassName(props: UnlockableProps | UnlockableDefinitionProps): string | undefined {
  return 'className' in props ? props.className : undefined;
}
