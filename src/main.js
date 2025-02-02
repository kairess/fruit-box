import './style.css';

// 상수 정의
const GRID_COLS = 17;
const GRID_ROWS = 10;
const TOTAL_TIME = 120; // 120초 = 2분

// 게임 상태 변수
let score = 0;
let remainingTime = TOTAL_TIME;
let timerInterval = null;
let gameRunning = false;
let autoSolveEnabled = false;

// DOM 요소 참조
const grid = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const timerBar = document.getElementById('timer-bar');
const timeRemainingDisplay = document.getElementById('time-remaining');
const selectionBox = document.getElementById('selection-box');
const startButton = document.getElementById('start-button');
const splashScreen = document.getElementById('splash-screen');
const resultModal = document.getElementById('result-modal');
const finalScoreDisplay = document.getElementById('final-score');
const closeButton = document.getElementById('close-button');
const autoSolveButton = document.getElementById('auto-solve-button');

// 드래그 관련 변수
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

/**
 * 그리드에 사과들을 생성합니다.
 * 각 사과는 1~9 사이의 랜덤 숫자를 가집니다.
 */
function createGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    const appleDiv = document.createElement('div');
    appleDiv.classList.add('apple');
    const value = Math.floor(Math.random() * 9) + 1;
    appleDiv.textContent = value;
    appleDiv.dataset.value = value;
    grid.appendChild(appleDiv);
  }
}

/**
 * 점수를 업데이트합니다.
 */
function updateScore(points) {
  score += points;
  scoreDisplay.textContent = score;
}

/**
 * 타이머를 시작합니다.
 */
function startTimer() {
  remainingTime = TOTAL_TIME;
  timerBar.style.width = "100%";
  timeRemainingDisplay.textContent = `${remainingTime}`;

  timerInterval = setInterval(() => {
    remainingTime--;
    const percentage = (remainingTime / TOTAL_TIME) * 100;
    timerBar.style.width = `${percentage}%`;
    timeRemainingDisplay.textContent = `${remainingTime}`;
    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

/**
 * 게임 종료: 결과 모달을 표시하여 최종 점수를 보여줍니다.
 */
function endGame() {
  grid.removeEventListener('mousedown', onMouseDown);
  grid.removeEventListener('mousemove', onMouseMove);
  grid.removeEventListener('mouseup', onMouseUp);
  grid.removeEventListener('mouseleave', onMouseUp);

  gameRunning = false;
  startButton.disabled = false;
  startButton.textContent = "게임 재시작";

  finalScoreDisplay.textContent = score;
  resultModal.classList.remove('hidden');
}

/**
 * grid의 위치 정보를 반환합니다.
 */
function getGridRect() {
  return grid.getBoundingClientRect();
}

/**
 * 주어진 엘리먼트의 중심이 선택 영역 내에 있는지 확인합니다.
 */
function isElementInSelection(el, selectionRect) {
  const rect = el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return (
    centerX >= selectionRect.left &&
    centerX <= selectionRect.right &&
    centerY >= selectionRect.top &&
    centerY <= selectionRect.bottom
  );
}

/**
 * 드래그 영역 좌표를 계산합니다.
 */
function getSelectionRect() {
  const left = Math.min(startX, currentX);
  const right = Math.max(startX, currentX);
  const top = Math.min(startY, currentY);
  const bottom = Math.max(startY, currentY);
  return { left, right, top, bottom };
}

/**
 * 드래그 선택 박스 업데이트
 */
function updateSelectionBox() {
  const selectionRect = getSelectionRect();
  const gridRect = getGridRect();
  selectionBox.style.left = `${selectionRect.left - gridRect.left}px`;
  selectionBox.style.top = `${selectionRect.top - gridRect.top}px`;
  selectionBox.style.width = `${selectionRect.right - selectionRect.left}px`;
  selectionBox.style.height = `${selectionRect.bottom - selectionRect.top}px`;
}

/* ========== 마우스 이벤트 핸들러 ========== */
function onMouseDown(e) {
  if (!gameRunning) return;
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  currentX = e.clientX;
  currentY = e.clientY;
  selectionBox.classList.remove('hidden');
  updateSelectionBox();
}

function onMouseMove(e) {
  if (!isDragging) return;
  currentX = e.clientX;
  currentY = e.clientY;
  updateSelectionBox();

  const selectionRect = getSelectionRect();
  const apples = Array.from(document.querySelectorAll('.apple'));
  let sum = 0;
  apples.forEach(apple => {
    if (isElementInSelection(apple, selectionRect)) {
      sum += parseInt(apple.dataset.value);
      apple.classList.add('selected-apple');
    } else {
      apple.classList.remove('selected-apple');
    }
  });
  selectionBox.style.borderColor = sum === 10 ? 'red' : 'blue';
}

function onMouseUp(e) {
  if (!isDragging) return;
  isDragging = false;
  selectionBox.classList.add('hidden');
  document.querySelectorAll('.apple').forEach(apple => {
    apple.classList.remove('selected-apple');
  });

  const selectionRect = getSelectionRect();
  const apples = Array.from(document.querySelectorAll('.apple'));
  let sum = 0;
  const selectedApples = [];

  apples.forEach(apple => {
    if (isElementInSelection(apple, selectionRect)) {
      sum += parseInt(apple.dataset.value);
      selectedApples.push(apple);
    }
  });

  if (sum === 10 && selectedApples.length > 0) {
    selectedApples.forEach(apple => {
      apple.classList.add('pop');
      apple.addEventListener('animationend', () => {
        apple.classList.remove('apple', 'pop');
        apple.classList.add('empty');
        apple.textContent = '';
        apple.dataset.value = 0;
        if (autoSolveEnabled) {
          autoSolve();
        }
      }, { once: true });
    });
    updateScore(selectedApples.length);
  }
}

/**
 * 게임 시작: 초기화 후 이벤트 등록
 */
function startGame() {
  score = 0;
  scoreDisplay.textContent = score;
  remainingTime = TOTAL_TIME;
  timerBar.style.width = "100%";
  timeRemainingDisplay.textContent = `${remainingTime}`;

  createGrid();

  splashScreen.classList.add('hidden');
  resultModal.classList.add('hidden');

  grid.addEventListener('mousedown', onMouseDown);
  grid.addEventListener('mousemove', onMouseMove);
  grid.addEventListener('mouseup', onMouseUp);
  grid.addEventListener('mouseleave', onMouseUp);

  startTimer();

  gameRunning = true;
  startButton.disabled = true;
  startButton.textContent = "게임 진행 중";

  autoSolveEnabled = false;
  autoSolveButton.textContent = "자동 풀기";
  autoSolveButton.disabled = false;

  let container = document.getElementById("auto-solve-container");
  if (container) {
    container.remove();
  }
}

/* ========== 자동 풀기 기능 ========== */
/**
 * 자동 풀기: 현재 그리드에서 제거 가능한 조합(합이 10인 직사각형 영역)을
 * 찾아 overlay로 표시합니다.
 * 이미 표시되어 있다면 제거(토글 기능)합니다.
 */
function autoSolve() {
  autoSolveEnabled = true;
  autoSolveButton.textContent = "자동 풀기 중";
  autoSolveButton.disabled = true;

  let container = document.getElementById("auto-solve-container");
  if (container) {
    container.remove();
  }
  container = document.createElement("div");
  container.id = "auto-solve-container";
  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.pointerEvents = "none";

  const gridContainer = document.getElementById("grid-container");
  gridContainer.appendChild(container);

  // 2차원 누적합 배열 계산 (prefix sum)
  const prefixSum = [];
  const prefixCount = [];
  for (let r = 0; r <= GRID_ROWS; r++) {
    prefixSum[r] = new Array(GRID_COLS + 1).fill(0);
    prefixCount[r] = new Array(GRID_COLS + 1).fill(0);
  }
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const index = r * GRID_COLS + c;
      const cell = grid.children[index];
      const val = parseInt(cell.dataset.value) || 0;
      const cnt = (!cell.classList.contains("empty") && val > 0) ? 1 : 0;
      prefixSum[r+1][c+1] = prefixSum[r+1][c] + prefixSum[r][c+1] - prefixSum[r][c] + val;
      prefixCount[r+1][c+1] = prefixCount[r+1][c] + prefixCount[r][c+1] - prefixCount[r][c] + cnt;
    }
  }

  // 모든 직사각형 영역에 대해 합과 유효 사과 수를 O(1)에 계산
  for (let r1 = 0; r1 < GRID_ROWS; r1++) {
    for (let r2 = r1; r2 < GRID_ROWS; r2++) {
      for (let c1 = 0; c1 < GRID_COLS; c1++) {
        for (let c2 = c1; c2 < GRID_COLS; c2++) {
          const sum = prefixSum[r2+1][c2+1] - prefixSum[r1][c2+1] - prefixSum[r2+1][c1] + prefixSum[r1][c1];
          const count = prefixCount[r2+1][c2+1] - prefixCount[r1][c2+1] - prefixCount[r2+1][c1] + prefixCount[r1][c1];
          if (sum === 10 && count > 0) {
            const topLeftCell = grid.children[r1 * GRID_COLS + c1];
            const bottomRightCell = grid.children[r2 * GRID_COLS + c2];
            const gridContainerRect = gridContainer.getBoundingClientRect();
            const tlRect = topLeftCell.getBoundingClientRect();
            const brRect = bottomRightCell.getBoundingClientRect();
            const left = tlRect.left - gridContainerRect.left;
            const top = tlRect.top - gridContainerRect.top;
            const right = brRect.right - gridContainerRect.left;
            const bottom = brRect.bottom - gridContainerRect.top;
            const width = right - left;
            const height = bottom - top;

            const overlay = document.createElement("div");
            overlay.classList.add("auto-solve-overlay");
            overlay.style.position = "absolute";
            overlay.style.left = left + "px";
            overlay.style.top = top + "px";
            overlay.style.width = width + "px";
            overlay.style.height = height + "px";
            container.appendChild(overlay);
          }
        }
      }
    }
  }
}

/* ========== 이벤트 등록 ========== */
startButton.addEventListener('click', () => {
  if (!gameRunning) {
    startGame();
  }
});
closeButton.addEventListener('click', () => {
  resultModal.classList.add('hidden');
});
autoSolveButton.addEventListener('click', () => {
  autoSolve();
});
