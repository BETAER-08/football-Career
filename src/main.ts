import './app.css';
import { mount } from 'svelte';
import App from './ui/App.svelte';
import { store } from './ui/store.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('app root missing');

async function boot(root: HTMLElement) {
  if (import.meta.env.DEV && location.pathname === '/dev/avatars') {
    const m = await import('./dev/AvatarSheet.svelte');
    mount(m.default, { target: root });
    return;
  }
  if (import.meta.env.DEV && location.pathname === '/dev/ui') {
    const f = await import('./dev/fixtures');
    const name = (new URLSearchParams(location.search).get('state') ?? 'youth') as import('./dev/fixtures').FixtureName;
    store.prefs.tutorialSeen = true;
    store.game = f.buildFixture(name);
    store.screen = 'game';
    if (name === 'review' && store.game.reviews.length) store.openReviewAt(store.game.reviews.length - 1);
    if (name === 'end') store.finish();
    mount(App, { target: root });
    return;
  }
  mount(App, { target: root });
}

void boot(target);
