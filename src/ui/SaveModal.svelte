<script lang="ts">
  import { dialog } from './dialog';
  import { store } from './store.svelte';

  let text = $state('');
  let msg = $state('');

  function download() {
    const g = store.game;
    store.downloadText(store.exportText(), `태어난김에축구_${g ? g.p.name : 'save'}.json`);
    msg = '저장 파일을 내보냈어요.';
  }
  function copy() {
    text = store.exportText();
    navigator.clipboard?.writeText(text).then(() => (msg = '클립보드에 복사했어요.'), () => (msg = '아래 텍스트를 직접 복사해 주세요.'));
  }
  function doImport() {
    const r = store.importText(text);
    if (!r) store.panel = '';
    else msg = r;
  }
  function onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) f.text().then((t) => (text = t));
  }
</script>

<div class="modal-bg" role="presentation">
  <div class="modal" style="max-width:600px" role="dialog" aria-label="저장 · 나가기" tabindex="-1" use:dialog={{ close: () => (store.panel = '') }}>
    <div class="modal-h">저장 · 나가기</div>
    <div class="modal-b col" style="gap:10px">
      <div class="muted">자동 저장은 매주 이뤄져요. 나가도 이어하기로 돌아올 수 있어요.</div>
      <div class="row" style="flex-wrap:wrap">
        <button class="btn" onclick={() => { store.saveNow(); msg = '저장했어요.'; }}>지금 저장</button>
        <button class="btn" onclick={download}>JSON 내보내기</button>
        <button class="btn" onclick={copy}>텍스트 복사</button>
        <button class="btn" onclick={() => { store.panel = ''; store.openTutorial(); }}>첫 플레이 안내 다시 보기</button>
      </div>
      <input type="file" accept=".json,application/json" onchange={onFile} />
      <textarea rows="5" placeholder="가져올 저장 JSON" bind:value={text}></textarea>
      <div class="row"><button class="btn" onclick={doImport}>이 저장으로 불러오기</button>{#if msg}<span class="muted">{msg}</span>{/if}</div>
      <div class="row">
        <button class="btn" onclick={() => (store.panel = '')}>계속 플레이</button>
        <span class="spacer"></span>
        <button class="btn danger" onclick={() => { store.quitToMenu(); store.panel = ''; }}>저장하고 나가기</button>
      </div>
    </div>
  </div>
</div>
