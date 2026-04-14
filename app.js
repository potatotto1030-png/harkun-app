// app.js

// ========== ジャンル定義 ==========
const GENRES = {
  law_harmful: { name: '法令（有害）', fullName: '関係法令（有害業務に係るもの）' },
  health_harmful: { name: '衛生（有害）', fullName: '労働衛生（有害業務に係るもの）' },
  law_general: { name: '法令（一般）', fullName: '関係法令（有害業務に係るもの以外のもの）' },
  health_general: { name: '衛生（一般）', fullName: '労働衛生（有害業務に係るもの以外のもの）' },
  physiology: { name: '労働生理', fullName: '労働生理' }
};

// ========== 状態管理 ==========
let currentQuiz = {
  mode: '',
  genre: '',
  questions: [],
  currentIndex: 0,
  answers: [],
  totalCount: 0,
  selectedChoice: null
};

// ========== 初期化 ==========
function init() {
  updateResumeButton();
}

// ========== 画面遷移 ==========
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// ========== モード選択画面 ==========
function startComprehensive() {
  showScreen('screen-count');
}

function showGenreSelect() {
  showScreen('screen-genre');
}

function showResults() {
  showScreen('screen-stats');
}

// ========== 中断ボタンの状態更新 ==========
function updateResumeButton() {
  const saved = localStorage.getItem('suspendedQuiz');
  document.getElementById('btn-resume').disabled = !saved;
}

// ========== クイズ開始 ==========
function startQuiz(genreOrMode, count) {
  let questions = [];

  if (genreOrMode === 'comprehensive') {
    const perGenre = count / 5;
    const genreKeys = Object.keys(GENRES);
    genreKeys.forEach(key => {
      const genreQuestions = QUESTIONS.filter(q => q.genre === key);
      const shuffled = shuffleArray([...genreQuestions]);
      questions = questions.concat(shuffled.slice(0, perGenre));
    });
    currentQuiz.mode = 'comprehensive';
    currentQuiz.genre = '';
  } else {
    const genreQuestions = QUESTIONS.filter(q => q.genre === genreOrMode);
    questions = shuffleArray([...genreQuestions]).slice(0, count);
    currentQuiz.mode = 'genre';
    currentQuiz.genre = genreOrMode;
  }

  currentQuiz.questions = shuffleArray(questions);
  currentQuiz.currentIndex = 0;
  currentQuiz.answers = [];
  currentQuiz.totalCount = currentQuiz.questions.length;
  currentQuiz.selectedChoice = null;

  showQuestion();
}

// ========== 問題表示 ==========
function showQuestion() {
  showScreen('screen-quiz');

  const q = currentQuiz.questions[currentQuiz.currentIndex];
  const genreInfo = GENRES[q.genre];

  currentQuiz.selectedChoice = null;

  // ヘッダー
  document.getElementById('quiz-genre').textContent = genreInfo.name;
  document.getElementById('quiz-progress').textContent =
    `${currentQuiz.currentIndex + 1} / ${currentQuiz.totalCount}`;

  // 前回の正誤マーク
  const prevMark = getPrevMark(q.id);
  const markEl = document.getElementById('quiz-prev-mark');
  if (prevMark === 'good') {
    markEl.innerHTML = '<span class="mark-good">👍 前回正解</span>';
  } else if (prevMark === 'warn') {
    markEl.innerHTML = '<span class="mark-warn">⚠️ 前回不正解</span>';
  } else {
    markEl.innerHTML = '<span class="mark-new">NEW</span>';
  }

  // 問題文
  document.getElementById('quiz-question').textContent = q.question;

  // 選択肢
  const choicesEl = document.getElementById('quiz-choices');
  choicesEl.innerHTML = '';
  q.choices.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = `(${index + 1}) ${choice}`;
    btn.onclick = () => selectChoice(index);
    choicesEl.appendChild(btn);
  });

  // 回答ボタンを無効状態で表示
  const submitBtn = document.getElementById('btn-submit');
  submitBtn.disabled = true;
  submitBtn.classList.remove('hidden');

  // 回答後エリアを隠す
  document.getElementById('quiz-result').classList.add('hidden');
}

// ========== 選択肢を選ぶ ==========
function selectChoice(index) {
  currentQuiz.selectedChoice = index;

  const choiceBtns = document.querySelectorAll('.choice-btn');
  choiceBtns.forEach((btn, i) => {
    if (i === index) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });

  document.getElementById('btn-submit').disabled = false;
}

// ========== 回答を確定する ==========
function submitAnswer() {
  const selectedIndex = currentQuiz.selectedChoice;
  if (selectedIndex === null) return;

  const q = currentQuiz.questions[currentQuiz.currentIndex];
  const isCorrect = selectedIndex === q.answer;

  currentQuiz.answers.push({
    questionId: q.id,
    selected: selectedIndex,
    correct: q.answer,
    isCorrect: isCorrect
  });

  document.getElementById('btn-submit').classList.add('hidden');

  const choiceBtns = document.querySelectorAll('.choice-btn');
  choiceBtns.forEach((btn, index) => {
    btn.classList.add('disabled');
    btn.classList.remove('selected');
    if (index === selectedIndex && isCorrect) {
      btn.classList.add('selected-correct');
    } else if (index === selectedIndex && !isCorrect) {
      btn.classList.add('selected-wrong');
    }
    if (index === q.answer && !isCorrect) {
      btn.classList.add('show-correct');
    }
  });

  const resultMark = document.getElementById('quiz-result-mark');
  if (isCorrect) {
    resultMark.textContent = '正解！';
    resultMark.className = 'result-mark correct';
  } else {
    resultMark.textContent = '不正解…';
    resultMark.className = 'result-mark wrong';
  }

  document.getElementById('quiz-correct-answer').textContent =
    `正解：(${q.answer + 1}) ${q.choices[q.answer]}`;

  document.getElementById('quiz-explanation').textContent = q.explanation;

  const nextBtn = document.getElementById('btn-next');
  if (currentQuiz.currentIndex >= currentQuiz.totalCount - 1) {
    nextBtn.textContent = '結果を見る';
  } else {
    nextBtn.textContent = '次へ';
  }

  document.getElementById('quiz-result').classList.remove('hidden');

  saveQuestionHistory(q.id, isCorrect);
}

// ========== 次の問題 ==========
function nextQuestion() {
  currentQuiz.currentIndex++;
  if (currentQuiz.currentIndex >= currentQuiz.totalCount) {
    showResultScreen();
  } else {
    showQuestion();
  }
}

// ========== 結果画面 ==========
function showResultScreen() {
  localStorage.removeItem('suspendedQuiz');
  updateResumeButton();

  const correctCount = currentQuiz.answers.filter(a => a.isCorrect).length;
  const total = currentQuiz.totalCount;
  const percentage = Math.round((correctCount / total) * 100);

  document.getElementById('result-score').textContent =
    `${correctCount} / ${total} 正解！`;
  document.getElementById('result-percentage').textContent = `${percentage}%`;

  const breakdownEl = document.getElementById('result-genre-breakdown');
  if (currentQuiz.mode === 'comprehensive') {
    let html = '<h3>ジャンル別</h3>';
    Object.keys(GENRES).forEach(key => {
      const genreAnswers = currentQuiz.answers.filter(a => {
        const question = QUESTIONS.find(q => q.id === a.questionId);
        return question && question.genre === key;
      });
      if (genreAnswers.length > 0) {
        const genreCorrect = genreAnswers.filter(a => a.isCorrect).length;
        const genrePercent = Math.round((genreCorrect / genreAnswers.length) * 100);
        html += `
          <div class="genre-row">
            <span class="genre-row-name">${GENRES[key].name}</span>
            <span class="genre-row-score">${genreCorrect}/${genreAnswers.length}（${genrePercent}%）</span>
          </div>`;
      }
    });
    breakdownEl.innerHTML = html;
    breakdownEl.style.display = 'block';
  } else {
    breakdownEl.style.display = 'none';
  }

  saveSessionResult(correctCount, total);
  showScreen('screen-result');
}

// ========== 振り返りA ==========
function showReviewA() {
  const listEl = document.getElementById('review-a-list');
  let html = '';

  currentQuiz.answers.forEach((answer, index) => {
    const q = QUESTIONS.find(question => question.id === answer.questionId);
    if (!q) return;

    const markIcon = answer.isCorrect ? '⭕' : '❌';
    html += `
      <div class="review-item" onclick="toggleReviewItem(this)">
        <div class="review-item-header">
          <span class="review-item-mark">${markIcon}</span>
          <span class="review-item-question">${q.question}</span>
          <span class="review-item-toggle">▼</span>
        </div>
        <div class="review-item-body">
          <div class="review-answer-info">
            <p><strong>あなたの回答：</strong>(${answer.selected + 1}) ${q.choices[answer.selected]}</p>
            <p><strong>正解：</strong>(${q.answer + 1}) ${q.choices[q.answer]}</p>
          </div>
          <div class="review-explanation">
            <p><strong>解説：</strong>${q.explanation}</p>
          </div>
        </div>
      </div>`;
  });

  listEl.innerHTML = html;
  showScreen('screen-review-a');
}

function toggleReviewItem(el) {
  el.classList.toggle('open');
}

// ========== 中断機能 ==========
function confirmSuspend() {
  document.getElementById('dialog-suspend').classList.remove('hidden');
}

function closeSuspendDialog() {
  document.getElementById('dialog-suspend').classList.add('hidden');
}

function suspendQuiz() {
  const saveData = {
    mode: currentQuiz.mode,
    genre: currentQuiz.genre,
    questions: currentQuiz.questions,
    currentIndex: currentQuiz.currentIndex,
    answers: currentQuiz.answers,
    totalCount: currentQuiz.totalCount
  };
  localStorage.setItem('suspendedQuiz', JSON.stringify(saveData));
  closeSuspendDialog();
  updateResumeButton();
  showScreen('screen-menu');
}

// ========== 中断データから再開 ==========
function resumeQuiz() {
  const saved = localStorage.getItem('suspendedQuiz');
  if (!saved) return;

  const data = JSON.parse(saved);
  currentQuiz.mode = data.mode;
  currentQuiz.genre = data.genre;
  currentQuiz.questions = data.questions;
  currentQuiz.currentIndex = data.currentIndex;
  currentQuiz.answers = data.answers;
  currentQuiz.totalCount = data.totalCount;
  currentQuiz.selectedChoice = null;

  showQuestion();
}

// ========== リセット機能 ==========
function confirmReset() {
  document.getElementById('dialog-reset').classList.remove('hidden');
}

function closeResetDialog() {
  document.getElementById('dialog-reset').classList.add('hidden');
}

function executeReset() {
  localStorage.removeItem('questionHistory');
  localStorage.removeItem('sessionResults');
  localStorage.removeItem('suspendedQuiz');
  updateResumeButton();
  closeResetDialog();
  showScreen('screen-menu');
}

// ========== 問題ごとの履歴保存 ==========
function saveQuestionHistory(questionId, isCorrect) {
  let history = JSON.parse(localStorage.getItem('questionHistory') || '{}');

  if (!history[questionId]) {
    history[questionId] = { attempts: 0, correct: 0, lastCorrect: null };
  }

  history[questionId].attempts++;
  if (isCorrect) history[questionId].correct++;
  history[questionId].lastCorrect = isCorrect;

  localStorage.setItem('questionHistory', JSON.stringify(history));
}

// ========== 前回の正誤マーク取得 ==========
function getPrevMark(questionId) {
  const history = JSON.parse(localStorage.getItem('questionHistory') || '{}');
  if (!history[questionId]) return 'new';
  return history[questionId].lastCorrect ? 'good' : 'warn';
}

// ========== セッション結果の保存 ==========
function saveSessionResult(correctCount, totalCount) {
  let sessions = JSON.parse(localStorage.getItem('sessionResults') || '[]');
  sessions.push({
    date: new Date().toISOString(),
    mode: currentQuiz.mode,
    genre: currentQuiz.genre,
    correct: correctCount,
    total: totalCount
  });
  localStorage.setItem('sessionResults', JSON.stringify(sessions));
}

// ========== ユーティリティ ==========
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== アプリ起動 ==========
init();
