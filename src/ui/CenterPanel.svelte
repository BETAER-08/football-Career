<script lang="ts">
  import PixelScene from './PixelScene.svelte';
  import TeamBox from './TeamBox.svelte';
  import FocusBox from './FocusBox.svelte';
  import DecisionCard from './DecisionCard.svelte';
  import LifeLog from './LifeLog.svelte';
</script>

<div class="center scroll">
  <PixelScene />
  <TeamBox />
  <FocusBox />
  <DecisionCard />
  <LifeLog limit={60} />
</div>

<style>
  .center { display: flex; flex-direction: column; gap: 10px; height: 100%; padding-right: 2px; }
</style>
