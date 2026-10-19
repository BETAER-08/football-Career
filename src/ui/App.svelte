<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './store.svelte';
  import Menu from './Menu.svelte';
  import Setup from './Setup.svelte';
  import Roulette from './Roulette.svelte';
  import GameScreen from './GameScreen.svelte';
  import EndScreen from './EndScreen.svelte';
  import Vault from './Vault.svelte';

  let width = $state(window.innerWidth);
  onMount(() => {
    const on = () => (width = window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  });
</script>

{#if width < 1280}
  <div class="narrow">
    <div class="narrow-card">
      <h1>태어난 김에 축구</h1>
      <p>이 게임은 데스크톱 전용입니다.</p>
      <p class="muted">화면 너비가 1280px 이상인 창에서 열어 주세요. (권장 1440px 이상)</p>
    </div>
  </div>
{:else}
  <div class="app" class:compact={width < 1440}>
    {#if store.screen === 'menu'}
      <Menu />
    {:else if store.screen === 'setup'}
      <Setup />
    {:else if store.screen === 'roulette'}
      <Roulette />
    {:else if store.screen === 'game'}
      <GameScreen />
    {:else if store.screen === 'end'}
      <EndScreen />
    {:else if store.screen === 'vault'}
      <Vault />
    {/if}
  </div>
{/if}

<style>
  .app { height: 100%; }
  .narrow { height: 100%; display: grid; place-items: center; padding: 24px; text-align: center; }
  .narrow-card { max-width: 420px; }
  h1 { margin: 0 0 12px; }
</style>
