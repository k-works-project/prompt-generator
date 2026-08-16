// DOM要素の取得
const roleInput = document.getElementById('role');
const taskInput = document.getElementById('task');
const contextInput = document.getElementById('context');
const constraintsInput = document.getElementById('constraints');
const formatInput = document.getElementById('format');

// チェックボックス要素の取得
const optStrict = document.getElementById('optStrict');
const optFix = document.getElementById('optFix');
const optRewrite = document.getElementById('optRewrite');
const optResultOnly = document.getElementById('optResultOnly');
const optFiller = document.getElementById('optFiller');
const optNoTimestamp = document.getElementById('optNoTimestamp');

// プレビュー・ボタン要素の取得
const promptPreview = document.getElementById('promptPreview');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');

// 監視対象の入力要素グループ
const inputs = [roleInput, taskInput, contextInput, constraintsInput, formatInput];
const checkboxes = [optStrict, optFix, optRewrite, optResultOnly, optFiller, optNoTimestamp];

// プロンプト生成処理
function generatePrompt() {
  const role = roleInput.value.trim();
  const task = taskInput.value.trim();
  const context = contextInput.value.trim();
  const constraints = constraintsInput.value.trim();
  const format = formatInput.value.trim();

  let promptParts = [];

  // 1. 設定（役割）：接頭辞を補完して自然な指示文にする
  if (role) {
    promptParts.push(`# あなたの役割\nあなたは${role}です。以下のタスクをプロフェッショナルとして実行してください。`);
  }

// 2. 依頼（実行タスク）：口語表現や不要な語尾を綺麗に自動整流化する
  if (task) {
    let cleanTask = task;

    // 「〜っぽく」「〜風に」などの口語表現を置換・調整
    cleanTask = cleanTask.replace(/っぽく/g, '形式に');
    cleanTask = cleanTask.replace(/風に/g, '形式に');

    // 語尾の口語表現をプロンプト用の文末へ置換
    cleanTask = cleanTask.replace(/してほしい$/g, 'を行ってください。');
    cleanTask = cleanTask.replace(/まとめてほしい$/g, '整理・作成してください。');

    // 文末の自動整形（「〜してください」等がなければ追加）
    if (!cleanTask.endsWith('。') && !cleanTask.endsWith('ださい')) {
      cleanTask += 'を行ってください。';
    }

    promptParts.push(`# 実行タスク\n${cleanTask}`);
  } else {
    promptPreview.textContent = '「2. 依頼（具体的に作成してほしいもの）」を入力すると、ここにプロンプトが生成されます。';
    return;
  }

  // 3. 前提条件：補足テキストを添える
  if (context) {
    promptParts.push(`# 背景・前提条件\n以下の背景情報および文脈を踏まえて作業を実施してください。\n- ${context}`);
  }

// 4. 制約事項・ルールの組み立て
  let finalConstraints = [];

  if (constraints) {
    constraints
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .forEach(line => {
        let cleanLine = line.replace(/^[・\-\*]\s*/, '');

        // 文末の口語・体言止めを丁寧な指示文に自動整形
        if (!cleanLine.endsWith('。') && !cleanLine.endsWith('こと') && !cleanLine.endsWith('こと。')) {
          if (cleanLine.endsWith('分ける')) cleanLine = cleanLine.replace(/分ける$/, '明確に分けて出力してください。');
          else if (cleanLine.endsWith('書く')) cleanLine = cleanLine.replace(/書く$/, '明記してください。');
          else if (cleanLine.endsWith('そのまま')) cleanLine += '使用してください。';
          else cleanLine += 'こと。';
        }

        finalConstraints.push(cleanLine);
      });
  }

  // (以降のチェックボックス処理・結合処理はそのまま)

  // チェックボックスによる自動ルールの追加
  if (optStrict && optStrict.checked) {
    finalConstraints.push('要約や脚色、意訳を一切行わず、入力・指定されたデータを忠実にそのまま出力してください。');
  }
  if (optFix && optFix.checked) {
    finalConstraints.push('誤字脱字や記号・単位の表記揺れを正しく整えて出力してください。');
  }
  if (optRewrite && optRewrite.checked) {
    finalConstraints.push('読み手が理解しやすいよう、論理的かつ自然な文章構成に整えてください。');
  }
  if (optResultOnly && optResultOnly.checked) {
    finalConstraints.push('前置きの挨拶や解説、思考プロセスは出力せず、要求された成果物のみを出力してください。');
  }
  if (optFiller && optFiller.checked) {
    finalConstraints.push('「えー」「あの」「その」などの言い淀み（フィラー）は除去して整理してください。');
  }
  if (optNoTimestamp && optNoTimestamp.checked) {
    finalConstraints.push('発言ごとのタイムスタンプ（時間表示）は付与せず、テキストのみを出力してください。');
  }

  // ルールが存在すれば箇条書きにして追加
  if (finalConstraints.length > 0) {
    const formattedConstraints = finalConstraints.map(line => `- ${line}`).join('\n');
    promptParts.push(`# 制約事項・ルール\n${formattedConstraints}`);
  }

  // 5. 出力形式
  if (format) {
    promptParts.push(`# 出力形式\n${format}`);
  }

  // 全体を改行2つ挟んで結合して表示
  promptPreview.textContent = promptParts.join('\n\n---\n\n');
}

// クリップボードコピー処理
async function copyToClipboard() {
  const textToCopy = promptPreview.textContent;

  if (!textToCopy.trim() || textToCopy.startsWith('「2. 依頼')) {
    alert('コピーできるプロンプトがありません。');
    return;
  }

  try {
    await navigator.clipboard.writeText(textToCopy);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'コピーしました！';
    copyBtn.style.backgroundColor = '#10b981';

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.backgroundColor = '';
    }, 2000);
  } catch (err) {
    alert('コピーに失敗しました。');
  }
}

// フォームのリセット処理
function resetForm() {
  inputs.forEach(input => (input.value = ''));
  checkboxes.forEach(cb => (cb.checked = false));
  generatePrompt();
}

// リアルタイム生成のためのイベントリスナー設定
inputs.forEach(input => input.addEventListener('input', generatePrompt));
checkboxes.forEach(cb => cb.addEventListener('change', generatePrompt));

copyBtn.addEventListener('click', copyToClipboard);
resetBtn.addEventListener('click', resetForm);

// 初回ロード時に自動でプロンプトを組み立てる
document.addEventListener('DOMContentLoaded', generatePrompt);