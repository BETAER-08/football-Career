<script lang="ts">
  import type { Snippet } from 'svelte';
  import { GLOSSARY, type TermId } from './glossary';

  let { id, children }: { id: TermId; children?: Snippet } = $props();
  const entry = $derived(GLOSSARY[id]);
  let open = $state(false);
  let timer = 0;

  function show() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => (open = true), 300);
  }

  function hide() {
    window.clearTimeout(timer);
    open = false;
  }
</script>

<span class="term" role="button" tabindex="0" aria-describedby={open ? `tip-${id}` : undefined} onmouseenter={show} onmouseleave={hide} onfocus={show} onblur={hide} onkeydown={(e) => e.key === 'Escape' && hide()}>
  {#if children}{@render children()}{:else}{entry.label}{/if}
  {#if open}<span class="tip" id={`tip-${id}`} role="tooltip"><b>{entry.label}</b>{entry.text}</span>{/if}
</span>

<style>
  .term { position: relative; border-bottom: 1px dotted var(--faint); cursor: help; }
  .tip { position: absolute; left: 0; top: calc(100% + var(--s1)); z-index: 90; width: 240px; padding: var(--s2) var(--s3); border-radius: var(--r-md); background: var(--bg); border: 1px solid var(--line); box-shadow: var(--shadow); font-size: var(--fs-sub); font-weight: 500; line-height: 1.5; color: var(--text); white-space: normal; text-align: left; }
  .tip b { display: block; margin-bottom: 2px; color: var(--accent); }
</style>
