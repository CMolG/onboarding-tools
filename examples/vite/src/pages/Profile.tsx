import { useUnlockableEvents } from 'onboarding-tools/react';

export function Profile() {
  const { events, emitEvent } = useUnlockableEvents();
  const completed = events.includes('profile.completed');

  return (
    <article className="card" data-tour="profile-card">
      <h2>Profile</h2>
      <p>
        In a real app this would be a form. For the demo, click the button
        below to emit the <code>profile.completed</code> event — that
        transitions the dashboard from <code>HIDDEN</code> to{' '}
        <code>ELIGIBLE</code>.
      </p>
      <button
        type="button"
        className="btn"
        disabled={completed}
        onClick={() => emitEvent('profile.completed')}
      >
        {completed ? 'Profile completed ✓' : 'Mark profile as complete'}
      </button>
    </article>
  );
}
