<script lang="ts">
  import { store } from './store.svelte';
  import TeamBox from './TeamBox.svelte';
  import FocusBox from './FocusBox.svelte';
  import DecisionCard from './DecisionCard.svelte';
  import ResultCard from './ResultCard.svelte';
  import LifeLog from './LifeLog.svelte';

  const pending = $derived(!!store.game?.decision);
</script>

<div class="center scroll" data-tour="center">
  {#if pending}<DecisionCard />{/if}
  <ResultCard />
  <TeamBox />
  <FocusBox />
  <LifeLog limit={60} />
</div>

<style>
  .center { display: flex; flex-direction: column; gap: var(--s3); height: 100%; padding-right: 2px; }
</style>
