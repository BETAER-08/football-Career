import './app.css';
import { mount } from 'svelte';
import App from './ui/App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('app root missing');

async function boot(root: HTMLElement) {
  if (import.meta.env.DEV && location.pathname === '/dev/avatars') {
    const m = await import('./dev/AvatarSheet.svelte');
    mount(m.default, { target: root });
    return;
  }
  mount(App, { target: root });
}

void boot(target);
