<script lang="ts">
  import { store } from './store.svelte';
  import { POSITIONS, POS_LABEL, type Pos } from '../engine/types';
  import { kstDateSeed, randomSeed } from './format';
  import { click } from './audio';
  import Icon from './Icon.svelte';

  let step = $state(0);
  let name = $state('');
  let pos = $state<Pos | 'random'>('random');
  let mode = $state<'normal' | 'daily' | 'code'>('normal');
  let code = $state('');
  let length = $state<30 | 60 | 90>(store.prefs.lengthMin);

  const dailyKey = kstDateSeed();
  const steps = ['이름', '포지션', '모드', '플레이 길이'];
  const canNext = $derived(step !== 2 || mode !== 'code' || code.trim().length >= 3);
  const modes: { id: 'normal' | 'daily' | 'code'; label: string; desc: string }[] = [
    { id: 'normal', label: '일반', desc: '무작위 시드로 새로운 인생을 시작해요.' },
    { id: 'daily', label: '오늘의 운명', desc: `한국 시간 기준 날짜(${dailyKey.slice(6)})를 시드로 모든 사람이 같은 국적·리그·구단을 받아요.` },
    { id: 'code', label: '운명 코드 입력', desc: '친구가 공유한 코드를 넣으면 같은 출발선에서 시작해요.' }
  ];
  const lengths: { id: 30 | 60 | 90; label: string; desc: string }[] = [
    { id: 30, label: '약 30분', desc: '1년 ≈ 75초. 빠르게 한 인생을 훑어봐요.' },
    { id: 60, label: '약 1시간', desc: '1년 ≈ 150초. 기본 속도예요.' },
    { id: 90, label: '약 1시간 30분', desc: '1년 ≈ 225초. 선택 하나하나를 천천히 음미해요.' }
  ];

  function go() {
    click();
    store.setLength(length);
    const seed = mode === 'daily' ? dailyKey : mode === 'code' ? code.trim() : randomSeed();
    store.pendingConfig = { seed, name, pos, mode, code: mode === 'code' ? code.trim() : '', lengthMin: length };
    store.screen = 'roulette';
  }

  function next() {
    if (!canNext) return;
    if (step < steps.length - 1) step += 1;
    else go();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      next();
    }
  }
</script>

<div class="setup">
  <div class="panel card">
    <div class="panel-h">새 커리어 <span class="spacer"></span><span class="faint">{step + 1} / {steps.length}</span></div>
    <ol class="steps" aria-label="진행 단계">
      {#each steps as s, i}
        <li class:on={i === step} class:done={i < step}><button class="dotb" onclick={() => (step = Math.min(step, i))} disabled={i > step} aria-current={i === step ? 'step' : undefined}>{#if i < step}<Icon name="check" size={14} />{:else}{i + 1}{/if}</button><span>{s}</span></li>
      {/each}
    </ol>
    <div class="panel-b col" style="gap:var(--s4)" onkeydown={onKey} role="presentation">
      {#if step === 0}
        <label class="col" style="gap:var(--s1)">
          <span class="muted">이름 <span class="faint">(비우면 국적이 정해진 뒤 그 나라 이름으로 자동 생성)</span></span>
          <input type="text" maxlength="20" placeholder="이름" bind:value={name} data-autofocus />
        </label>
        <div class="row"><span class="muted" style="width:64px">성별</span><span class="tag">남성 고정</span></div>
      {:else if step === 1}
        <div class="muted">선호 포지션 <span class="faint">(고르지 않으면 무작위)</span></div>
        <div class="posgrid" role="radiogroup" aria-label="포지션">
          <button class="opt" role="radio" aria-checked={pos === 'random'} class:on={pos === 'random'} onclick={() => (pos = 'random')}><b>무작위</b><span>룰렛 결과에 맡겨요</span></button>
          {#each POSITIONS as p}
            <button class="opt" role="radio" aria-checked={pos === p} class:on={pos === p} onclick={() => (pos = p)}><b>{POS_LABEL[p]}</b><span>{p}</span></button>
          {/each}
        </div>
      {:else if step === 2}
        <div class="col" style="gap:var(--s2)" role="radiogroup" aria-label="모드">
          {#each modes as m}
            <button class="opt wide" role="radio" aria-checked={mode === m.id} class:on={mode === m.id} onclick={() => (mode = m.id)}><b>{m.label}</b><span>{m.desc}</span></button>
          {/each}
          {#if mode === 'code'}<input type="text" placeholder="운명 코드 (3자 이상)" bind:value={code} data-autofocus />{/if}
        </div>
      {:else}
        <div class="muted">플레이 길이 <span class="faint">(선수 은퇴까지 기준)</span></div>
        <div class="col" style="gap:var(--s2)" role="radiogroup" aria-label="플레이 길이">
          {#each lengths as l}
            <button class="opt wide" role="radio" aria-checked={length === l.id} class:on={length === l.id} onclick={() => (length = l.id)}><b>{l.label}</b><span>{l.desc}</span></button>
          {/each}
        </div>
        <div class="sum">이름 <b>{name || '자동 생성'}</b> · 포지션 <b>{pos === 'random' ? '무작위' : POS_LABEL[pos]}</b> · 모드 <b>{modes.find((m) => m.id === mode)?.label}</b></div>
      {/if}
      <div class="row">
        <button class="btn" onclick={() => (step === 0 ? (store.screen = 'menu') : (step -= 1))}>{step === 0 ? '메뉴로' : '이전'}</button>
        <span class="spacer"></span>
        <button class="btn primary big" disabled={!canNext} onclick={next}>{step < steps.length - 1 ? '다음' : '입단하기'}</button>
      </div>
    </div>
  </div>
</div>

<style>
  .setup { height: 100%; display: grid; place-items: center; }
  .card { width: 640px; }
  .steps { list-style: none; display: flex; gap: var(--s3); margin: 0; padding: var(--s3) var(--s4) 0; }
  .steps li { display: flex; align-items: center; gap: var(--s2); font-size: var(--fs-sub); color: var(--faint); flex: 1; }
  .steps li.on { color: var(--text); font-weight: 700; }
  .dotb { width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--line); background: var(--panel2); color: inherit; display: grid; place-items: center; font-size: var(--fs-panel); font-weight: 800; cursor: pointer; }
  .steps li.on .dotb { background: var(--accent); color: var(--accent-ink); border-color: transparent; }
  .steps li.done .dotb { color: var(--accent); border-color: var(--accent); }
  .opt { display: flex; flex-direction: column; gap: 2px; text-align: left; padding: var(--s3); border-radius: var(--r-md); border: 1px solid var(--line); background: var(--panel2); cursor: pointer; }
  .opt:hover { border-color: var(--faint); }
  .opt.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--panel2)); }
  .opt b { font-size: var(--fs-body); }
  .opt span { font-size: var(--fs-sub); color: var(--muted); }
  .posgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s2); }
  .sum { padding: var(--s2) var(--s3); border: 1px dashed var(--line); border-radius: var(--r-sm); font-size: var(--fs-sub); color: var(--muted); }
  .big { padding: var(--s3) var(--s5); font-size: 15px; }
</style>
