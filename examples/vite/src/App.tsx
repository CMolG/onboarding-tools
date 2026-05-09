import { Link, NavLink, Route, Routes } from 'react-router-dom';
import {
  Unlockable,
  UnlockableCatalogRegistrar,
  UnlockableFlowProvider,
  UnlockableProvider,
  UnlockableTutorialEngineProvider,
  useUnlockableEvents,
  useUnlockableSignals,
} from 'onboarding-tools/react';

import { definitions } from './unlockables';
import { useOnboardingRouter } from './routerAdapter';
import { Profile } from './pages/Profile';
import { Dashboard } from './pages/Dashboard';
import { Advanced } from './pages/Advanced';

export function App() {
  return (
    <UnlockableProvider appId="onboarding-tools-vite-example">
      <UnlockableCatalogRegistrar definitions={definitions} />
      <RoutedExperience />
    </UnlockableProvider>
  );
}

function RoutedExperience() {
  const router = useOnboardingRouter();
  return (
    <UnlockableFlowProvider router={router}>
      <UnlockableTutorialEngineProvider router={router}>
        <Shell />
      </UnlockableTutorialEngineProvider>
    </UnlockableFlowProvider>
  );
}

function Shell() {
  return (
    <main className="app">
      <header>
        <h1>onboarding-tools · Vite demo</h1>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/advanced">Advanced</NavLink>
        </nav>
      </header>
      <DevToolbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/advanced" element={<Advanced />} />
      </Routes>
    </main>
  );
}

function Home() {
  return (
    <>
      <p>
        This demo wires three unlockables to three patterns. Use the toolbar
        below to fire events and toggle archetypes; watch the navigation,
        animations, and tutorial overlay react.
      </p>
      <Unlockable definition={definitions[0]} placeholder={<HiddenStub label="Profile (hidden)" />}>
        <article className="card" data-tour="profile-card">
          <h2>Profile</h2>
          <p>
            Visible by default — automatic activation with no criteria. Go
            to <Link to="/profile">/profile</Link>.
          </p>
        </article>
      </Unlockable>
      <Unlockable definition={definitions[1]} placeholder={<HiddenStub label="Dashboard (locked)" />}>
        <article className="card" data-tour="dashboard-card">
          <h2>Dashboard</h2>
          <p>
            Visible after the <code>profile.completed</code> event fires
            and you confirm the manual unlock.
          </p>
        </article>
      </Unlockable>
      <Unlockable definition={definitions[2]} placeholder={<HiddenStub label="Advanced (archetype-gated)" />}>
        <article className="card" data-tour="advanced-card">
          <h2>Advanced tools</h2>
          <p>
            Visible only when the user is tagged with the{' '}
            <code>power-user</code> archetype.
          </p>
        </article>
      </Unlockable>
    </>
  );
}

function HiddenStub({ label }: { readonly label: string }) {
  return (
    <article className="card" style={{ opacity: 0.55, borderStyle: 'dashed' }}>
      <span className="tag">hidden</span>
      <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>{label}</p>
    </article>
  );
}

function DevToolbar() {
  const { events, emitEvent } = useUnlockableEvents();
  const { userArchetypes, setUserArchetypes } = useUnlockableSignals();
  const isPowerUser = userArchetypes.includes('power-user');

  return (
    <div className="toolbar">
      <strong>Demo controls:</strong>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => emitEvent('profile.completed')}
      >
        Emit profile.completed
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setUserArchetypes(isPowerUser ? [] : ['power-user'])}
      >
        {isPowerUser ? 'Clear archetype' : 'Become power-user'}
      </button>
      <span className="tag">events: {events.join(', ') || '∅'}</span>
      <span className="tag">archetypes: {userArchetypes.join(', ') || '∅'}</span>
    </div>
  );
}
