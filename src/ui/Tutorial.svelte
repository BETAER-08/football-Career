<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './store.svelte';
  import { dialog } from './dialog';

  const steps = [
    { sel: 'time', title: '시간 흐름과 속도', text: '위쪽 막대에서 재생·멈춤과 배속을 고를 수 있어요. 1년은 몇 분 안에 흘러가요. "다음 결정까지"는 선택할 일이 생길 때까지만 빠르게 감아요.' },
    { sel: 'focus', title: '올해의 초점', text: '이번 시기에 무엇에 힘을 쏟을지 하나를 고르세요. 훈련, 회복, 가족처럼 선택마다 능력과 생활이 다르게 달라져요. 언제든 바꿀 수 있어요.' },
    { sel: 'actions', title: '행동 버튼', text: '돈·투자, 커리어, 삶 버튼에서 지금 할 수 있는 행동을 골라요. 버튼 옆 숫자는 지금 가능한 행동 수예요. 쓰고 나면 쿨타임이 생겨요.' },
    { sel: 'decision', fallback: 'center', title: '결정 카드와 미리보기 칩', text: '중요한 순간마다 결정 카드가 나타나요. 선택지 아래 칩은 결과가 어느 쪽으로 기울지 미리 알려 주고, 오른쪽 막대는 성공 확률 범위예요. 숫자 키로도 고를 수 있어요.' }
  ];

  let step = $state(0);
  let rect = $state<{ x: number; y: number; w: number; h: number } | null>(null);
  let vw = $state(window.innerWidth);
  let vh = $state(window.innerHeight);

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    const s = steps[step];
    const el = document.querySelector<HTMLElement>(`[data-tour="${s.sel}"]`) ?? (s.fallback ? document.querySelector<HTMLElement>(`[data-tour="${s.fallback}"]`) : null);
    if (!el) {
      rect = null;
      return;
    }
    el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect();
    rect = { x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 };
  }

  $effect(() => {
    void step;
    measure();
  });

  onMount(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });

  const cardStyle = $derived.by(() => {
    const w = 340;
    if (!rect) return `left:${Math.max(16, (vw - w) / 2)}px;top:${Math.max(16, vh / 2 - 100)}px;width:${w}px`;
    const below = rect.y + rect.h + 12 + 190 < vh;
    const top = below ? rect.y + rect.h + 12 : Math.max(12, rect.y - 12 - 190);
    const left = Math.min(Math.max(12, rect.x), vw - w - 12);
    return `left:${left}px;top:${top}px;width:${w}px`;
  });

  function next() {
    if (step < steps.length - 1) step += 1;
    else store.closeTutorial();
  }
</script>

<div class="tour" role="presentation">
  {#if rect}<div class="hole" style="left:{rect.x}px;top:{rect.y}px;width:{rect.w}px;height:{rect.h}px"></div>{:else}<div class="dim"></div>{/if}
  <div class="card panel" style={cardStyle} role="dialog" aria-label="첫 플레이 안내" tabindex="-1" use:dialog={{ close: () => store.closeTutorial() }}>
    <div class="panel-h"><span>{step + 1} / {steps.length} · {steps[step].title}</span></div>
    <div class="panel-b col" style="gap:var(--s3)">
      <div class="tx">{steps[step].text}</div>
      <div class="row">
        <button class="btn sm ghost" onclick={() => store.closeTutorial()}>건너뛰기</button>
        <span class="spacer"></span>
        {#if step > 0}<button class="btn sm" onclick={() => (step -= 1)}>이전</button>{/if}
        <button class="btn sm primary" data-autofocus onclick={next}>{step < steps.length - 1 ? '다음' : '시작하기'}</button>
      </div>
    </div>
  </div>
</div>

<style>
  .tour { position: fixed; inset: 0; z-index: 120; }
  .hole { position: fixed; border-radius: var(--r-md); box-shadow: 0 0 0 9999px rgba(4, 7, 12, 0.72); border: 2px solid var(--accent); pointer-events: none; transition: all 0.2s ease; }
  .dim { position: fixed; inset: 0; background: rgba(4, 7, 12, 0.72); }
  .card { position: fixed; box-shadow: var(--shadow); }
  .tx { font-size: var(--fs-body); line-height: 1.6; }
</style>
