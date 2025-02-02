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
const closeButton = document.getElementById('close-button'); // 모달 버튼 ID 변경됨

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
  // 기존의 사과들을 모두 제거
  grid.innerHTML = '';
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    const appleDiv = document.createElement('div');
    appleDiv.classList.add('apple');
    // 1~9 랜덤 숫자
    const value = Math.floor(Math.random() * 9) + 1;
    appleDiv.textContent = value;
    appleDiv.dataset.value = value;
    grid.appendChild(appleDiv);
  }
}

/**
 * 점수를 업데이트합니다.
 * @param {number} points - 획득한 점수
 */
function updateScore(points) {
  score += points;
  scoreDisplay.textContent = score;
}

/**
 * 타이머를 시작합니다.
 * 1초마다 남은 시간을 업데이트하며,
 * 시간이 다 되면 게임을 종료합니다.
 */
function startTimer() {
  remainingTime = TOTAL_TIME;
  timerBar.style.width = "100%";
  timeRemainingDisplay.textContent = `${remainingTime}초`;

  timerInterval = setInterval(() => {
    remainingTime--;
    const percentage = (remainingTime / TOTAL_TIME) * 100;
    timerBar.style.width = `${percentage}%`;
    timeRemainingDisplay.textContent = `${remainingTime}초`;
    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

/**
 * 게임을 종료합니다.
 * 결과 모달을 표시하여 최종 점수를 보여줍니다.
 */
function endGame() {
  // 드래그 관련 이벤트 제거
  grid.removeEventListener('mousedown', onMouseDown);
  grid.removeEventListener('mousemove', onMouseMove);
  grid.removeEventListener('mouseup', onMouseUp);
  grid.removeEventListener('mouseleave', onMouseUp);

  gameRunning = false;
  startButton.disabled = false;
  startButton.textContent = "게임 재시작";

  // 결과 모달에 최종 점수 업데이트 후 표시 (배경의 게임 결과는 그대로 보임)
  finalScoreDisplay.textContent = score;
  resultModal.classList.remove('hidden');
}

/**
 * grid 요소의 위치 정보를 반환합니다.
 */
function getGridRect() {
  return grid.getBoundingClientRect();
}

/**
 * 주어진 엘리먼트의 중심이 선택 영역(selectionRect) 내에 있는지 판단합니다.
 * @param {Element} el - 사과 엘리먼트
 * @param {Object} selectionRect - {left, right, top, bottom}
 * @returns {boolean}
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
 * 드래그 시작점과 현재 마우스 위치로부터 선택 영역의 좌표를 계산합니다.
 * (viewport 기준)
 */
function getSelectionRect() {
  const left = Math.min(startX, currentX);
  const right = Math.max(startX, currentX);
  const top = Math.min(startY, currentY);
  const bottom = Math.max(startY, currentY);
  return { left, right, top, bottom };
}

/**
 * 드래그 선택 박스의 위치와 크기를 업데이트합니다.
 * grid 컨테이너 내부 기준 좌표로 설정합니다.
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

/** 마우스 버튼을 누르면 드래그 시작 */
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

/** 드래그 중 마우스 이동 시 */
function onMouseMove(e) {
  if (!isDragging) return;
  currentX = e.clientX;
  currentY = e.clientY;
  updateSelectionBox();

  // 드래그 영역에 포함된 사과들을 하이라이트하고 합 계산
  const selectionRect = getSelectionRect();
  const apples = Array.from(document.querySelectorAll('.apple'));
  let sum = 0;
  apples.forEach(apple => {
    if (isElementInSelection(apple, selectionRect)) {
      sum += parseInt(apple.dataset.value);
      apple.classList.add('selected-apple');  // 노란 테두리 적용
    } else {
      apple.classList.remove('selected-apple'); // 원래대로 복구
    }
  });
  // 선택 영역의 테두리 색상은 합계에 따라 설정
  selectionBox.style.borderColor = sum === 10 ? 'red' : 'blue';
}

/** 마우스 버튼을 떼면 드래그 종료 */
function onMouseUp(e) {
  if (!isDragging) return;
  isDragging = false;
  selectionBox.classList.add('hidden');

  // 드래그 종료 시 모든 사과에서 노란 테두리 클래스 제거
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

  // 선택한 사과들의 합이 10이면 pop 애니메이션 후 사과를 삭제(빈 셀로 변경)하고 점수 업데이트
  if (sum === 10 && selectedApples.length > 0) {
    selectedApples.forEach(apple => {
      apple.classList.add('pop');
      apple.addEventListener('animationend', () => {
        apple.classList.remove('apple', 'pop');
        apple.classList.add('empty');
        apple.textContent = '';
        apple.dataset.value = 0;
      }, { once: true });
    });
    updateScore(selectedApples.length);
  }
}

/**
 * 게임 시작 시 실행되는 함수
 */
function startGame() {
  // 초기화
  score = 0;
  scoreDisplay.textContent = score;
  remainingTime = TOTAL_TIME;
  timerBar.style.width = "100%";
  timeRemainingDisplay.textContent = `${remainingTime}초`;

  createGrid();

  // 게임 시작 시 splash 화면과 결과 모달 모두 숨김 처리
  splashScreen.classList.add('hidden');
  resultModal.classList.add('hidden');

  // 드래그 관련 이벤트 리스너 등록
  grid.addEventListener('mousedown', onMouseDown);
  grid.addEventListener('mousemove', onMouseMove);
  grid.addEventListener('mouseup', onMouseUp);
  grid.addEventListener('mouseleave', onMouseUp);

  startTimer();

  gameRunning = true;
  startButton.disabled = true;
  startButton.textContent = "게임 진행 중";
}

/* ========== 이벤트 등록 ========== */
// 시작 버튼을 눌러 게임 시작
startButton.addEventListener('click', () => {
  if (!gameRunning) {
    startGame();
  }
});

// 결과 모달의 닫기 버튼을 눌러 모달 닫기 (게임 결과를 그대로 볼 수 있도록 함)
closeButton.addEventListener('click', () => {
  resultModal.classList.add('hidden');
});
