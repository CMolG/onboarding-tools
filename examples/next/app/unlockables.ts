import type { UnlockableDefinition } from 'onboarding-tools';

/**
 * Three onboarding stages that exercise the three main patterns:
 *
 *  1. profile    – automatic, no criteria → eligible immediately
 *  2. dashboard  – manual, gated by the `profile.completed` event
 *  3. advanced   – automatic, gated by the `power-user` archetype
 */
export const definitions: UnlockableDefinition[] = [
  {
    id: 'profile',
    activation: 'automatic',
    visibility: 'hidden',
    meta: {
      title: 'Profile',
      description: 'Tell us a bit about yourself to get started.',
    },
    flow: {
      stage: 'Profile',
      order: 10,
      route: '/profile',
      target: '[data-tour="profile-card"]',
      completionEvent: 'profile.completed',
    },
    tutorial: {
      title: 'Welcome aboard',
      body: 'Fill in your profile to unlock the dashboard.',
    },
  },
  {
    id: 'dashboard',
    activation: 'manual',
    visibility: 'hidden',
    meta: {
      title: 'Dashboard',
      description: 'Your daily workspace, available once your profile is ready.',
    },
    unlocksOn: { kind: 'event', event: 'profile.completed' },
    flow: {
      stage: 'Dashboard',
      order: 20,
      route: '/dashboard',
      target: '[data-tour="dashboard-card"]',
      completionEvent: 'dashboard.opened',
    },
    tutorial: {
      title: 'Dashboard unlocked',
      body: 'This is where everyday work happens. Click "Got it" to enter.',
      primaryActionLabel: 'Got it',
    },
  },
  {
    id: 'advanced',
    activation: 'automatic',
    visibility: 'hidden',
    archetype: 'power-user',
    autoAssignable: true,
    meta: {
      title: 'Advanced tools',
      description: 'Power-user-only utilities. Hidden until your archetype matches.',
      tags: ['power-user'],
    },
    unlocksOn: { kind: 'archetype', value: 'power-user' },
    flow: {
      stage: 'Advanced',
      order: 30,
      route: '/advanced',
      target: '[data-tour="advanced-card"]',
      completionEvent: 'advanced.opened',
    },
    tutorial: {
      title: 'Advanced tools unlocked',
      body: 'You opted into the power-user archetype, so the advanced surface is now visible.',
    },
  },
];
