<script lang="ts">
  import TeamBox from './TeamBox.svelte';
  import FocusBox from './FocusBox.svelte';
  import LifeLog from './LifeLog.svelte';
</script>

<div class="center scroll" data-tour="center">
  <div class="top">
    <TeamBox />
    <FocusBox />
  </div>
  <div class="logwrap"><LifeLog limit={60} /></div>
</div>

<style>
  .center { display: flex; flex-direction: column; gap: var(--s2); height: 100%; padding-right: 2px; }
  .top { display: flex; flex-direction: column; gap: var(--s2); flex: none; }
  .logwrap { flex: 1 1 auto; min-height: 460px; display: flex; flex-direction: column; }
  .logwrap :global(> .panel) { flex: 1; min-height: 0; }
  .top :global(.grid) { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: var(--s2); padding: var(--s2); }
  .top :global(.kv) { font-size: 12px; line-height: 1.25; }
  .top :global(.cap) { padding-top: var(--s1); }
  .top :global(.h) { font-size: 11px; }
  .top :global(.card) { padding: var(--s2); gap: var(--s1); }
  .top :global(.big) { font-size: 15px; }
  .top :global(.panel-b) { padding: var(--s2); }
  .top :global(.foc) { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); }
  .top :global(.fc) { padding: var(--s1) var(--s2); }
</style>
