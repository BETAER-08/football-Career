<script lang="ts">
  import { store } from './store.svelte';
  import { POSITIONS, POS_LABEL, type Pos } from '../engine/types';
  import { kstDateSeed, randomSeed } from './format';
  import { click } from './audio';

  let name = $state('');
  let pos = $state<Pos | 'random'>('random');
  let mode = $state<'normal' | 'daily' | 'code'>('normal');
  let code = $state('');
  let length = $state<30 | 60 | 90>(store.prefs.lengthMin);

  const dailyKey = kstDateSeed();
  const canGo = $derived(mode !== 'code' || code.trim().length >= 3);

  function go() {
    click();
    store.setLength(length);
    const seed = mode === 'daily' ? dailyKey : mode === 'code' ? code.trim() : randomSeed();
    store.pendingConfig = { seed, name, pos, mode, code: mode === 'code' ? code.trim() : '', lengthMin: length };
    store.screen = 'roulette';
  }
</script>

<div class="setup">
  <div class="panel card">
    <div class="panel-h">새 커리어</div>
    <div class="panel-b col" style="gap:16px">
      <label class="col" style="gap:4px">
        <span class="muted">이름 <span class="faint">(비우면 국적이 정해진 뒤 그 나라 이름으로 자동 생성)</span></span>
        <input type="text" maxlength="20" placeholder="이름" bind:value={name} />
      </label>
      <div class="row"><span class="muted" style="width:64px">성별</span><span class="tag">남성 고정</span></div>
      <label class="col" style="gap:4px">
        <span class="muted">선호 포지션</span>
        <select bind:value={pos}>
          <option value="random">무작위</option>
          {#each POSITIONS as p}<option value={p}>{POS_LABEL[p]} ({p})</option>{/each}
        </select>
      </label>
      <div class="col" style="gap:6px">
        <span class="muted">모드</span>
        <div class="row" style="flex-wrap:wrap">
          <button class="btn" class:on={mode === 'normal'} onclick={() => (mode = 'normal')}>일반</button>
          <button class="btn" class:on={mode === 'daily'} onclick={() => (mode = 'daily')}>오늘의 운명</button>
          <button class="btn" class:on={mode === 'code'} onclick={() => (mode = 'code')}>운명 코드 입력</button>
        </div>
        {#if mode === 'daily'}<div class="mini-hint">한국 시간 기준 날짜({dailyKey.slice(6)})를 시드로 모든 사람이 같은 국적·리그·구단을 받아요.</div>{/if}
        {#if mode === 'code'}<input type="text" placeholder="운명 코드" bind:value={code} />{/if}
      </div>
      <div class="col" style="gap:6px">
        <span class="muted">플레이 길이 <span class="faint">(선수 은퇴까지 기준)</span></span>
        <div class="row">
          <button class="btn" class:on={length === 30} onclick={() => (length = 30)}>약 30분 · 1년 ≈ 75초</button>
          <button class="btn" class:on={length === 60} onclick={() => (length = 60)}>약 1시간 · 1년 ≈ 150초</button>
          <button class="btn" class:on={length === 90} onclick={() => (length = 90)}>약 1시간 30분 · 1년 ≈ 225초</button>
        </div>
      </div>
      <div class="row">
        <button class="btn" onclick={() => (store.screen = 'menu')}>뒤로</button>
        <span class="spacer"></span>
        <button class="btn primary big" disabled={!canGo} onclick={go}>입단하기</button>
      </div>
    </div>
  </div>
</div>

<style>
  .setup { height: 100%; display: grid; place-items: center; }
  .card { width: 640px; }
  .big { padding: 10px 28px; font-size: 15px; }
</style>
