(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ═══════════════════════════════════════
//  SORTING VISUALIZER
// ═══════════════════════════════════════
let array = [], sorting = false, comparisons = 0, swaps = 0, startTime = 0;
const canvas = $('#sortCanvas');

function generateArray() {
  const size = parseInt($('#arraySize').value);
  $('#sizeLabel').textContent = size;
  array = Array.from({length: size}, () => Math.random() * 280 + 20);
  comparisons = 0; swaps = 0;
  updateStats();
  renderBars();
}

function renderBars(highlights = {}) {
  canvas.innerHTML = array.map((h, i) => {
    let cls = 'sort-bar';
    if (highlights.comparing?.includes(i)) cls += ' comparing';
    else if (highlights.swapping?.includes(i)) cls += ' swapping';
    else if (highlights.sorted?.includes(i)) cls += ' sorted';
    else if (highlights.pivot === i) cls += ' pivot';
    return `<div class="${cls}" style="height:${h}px"></div>`;
  }).join('');
}

function updateStats() {
  const compEl = $('#compCount'); if(compEl) compEl.textContent = comparisons;
  const swapEl = $('#swapCount'); if(swapEl) swapEl.textContent = swaps;
  const elapsed = startTime ? (performance.now() - startTime).toFixed(0) : 0;
  const timeEl = $('#sortTime'); if(timeEl) timeEl.textContent = elapsed + 'ms';
}

function getDelay() { const el = $('#sortSpeed'); return el ? Math.max(1, 101 - parseInt(el.value)) : 10; }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function swap(i, j) {
  [array[i], array[j]] = [array[j], array[i]];
  swaps++;
}

// Sorting Algorithms
async function bubbleSort() {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length - i - 1; j++) {
      if (!sorting) return;
      comparisons++;
      renderBars({comparing: [j, j+1]});
      await sleep(getDelay());
      if (array[j] > array[j+1]) {
        await swap(j, j+1);
        renderBars({swapping: [j, j+1]});
        await sleep(getDelay());
      }
    }
  }
}

async function selectionSort() {
  for (let i = 0; i < array.length; i++) {
    let minIdx = i;
    for (let j = i + 1; j < array.length; j++) {
      if (!sorting) return;
      comparisons++;
      renderBars({comparing: [minIdx, j], sorted: Array.from({length: i}, (_, k) => k)});
      await sleep(getDelay());
      if (array[j] < array[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      await swap(i, minIdx);
      renderBars({swapping: [i, minIdx]});
      await sleep(getDelay());
    }
  }
}

async function insertionSort() {
  for (let i = 1; i < array.length; i++) {
    let key = array[i], j = i - 1;
    while (j >= 0 && array[j] > key) {
      if (!sorting) return;
      comparisons++;
      array[j + 1] = array[j];
      swaps++;
      renderBars({comparing: [j, j+1]});
      await sleep(getDelay());
      j--;
    }
    array[j + 1] = key;
  }
}

async function mergeSort(start = 0, end = array.length - 1) {
  if (start >= end || !sorting) return;
  const mid = Math.floor((start + end) / 2);
  await mergeSort(start, mid);
  await mergeSort(mid + 1, end);
  await merge(start, mid, end);
}

async function merge(start, mid, end) {
  const left = array.slice(start, mid + 1);
  const right = array.slice(mid + 1, end + 1);
  let i = 0, j = 0, k = start;
  while (i < left.length && j < right.length) {
    if (!sorting) return;
    comparisons++;
    renderBars({comparing: [k]});
    await sleep(getDelay());
    if (left[i] <= right[j]) { array[k++] = left[i++]; }
    else { array[k++] = right[j++]; swaps++; }
  }
  while (i < left.length) { array[k++] = left[i++]; }
  while (j < right.length) { array[k++] = right[j++]; }
  renderBars();
}

async function quickSort(low = 0, high = array.length - 1) {
  if (low >= high || !sorting) return;
  const pi = await partition(low, high);
  await quickSort(low, pi - 1);
  await quickSort(pi + 1, high);
}

async function partition(low, high) {
  const pivot = array[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (!sorting) return low;
    comparisons++;
    renderBars({comparing: [j], pivot: high});
    await sleep(getDelay());
    if (array[j] < pivot) {
      i++;
      await swap(i, j);
      renderBars({swapping: [i, j]});
      await sleep(getDelay());
    }
  }
  await swap(i + 1, high);
  return i + 1;
}

async function heapSort() {
  const n = array.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    if (!sorting) return;
    await swap(0, i);
    renderBars({swapping: [0, i]});
    await sleep(getDelay());
    await heapify(i, 0);
  }
}

async function heapify(n, i) {
  let largest = i;
  const l = 2 * i + 1, r = 2 * i + 2;
  if (!sorting) return;
  comparisons++;
  if (l < n && array[l] > array[largest]) largest = l;
  if (r < n && array[r] > array[largest]) largest = r;
  if (largest !== i) {
    await swap(i, largest);
    renderBars({swapping: [i, largest]});
    await sleep(getDelay());
    await heapify(n, largest);
  }
}

// ─── New Sorting Algorithms ───

async function cocktailSort() {
  let swapped = true;
  let start = 0, end = array.length - 1;
  while (swapped && sorting) {
    swapped = false;
    for (let i = start; i < end; i++) {
      if (!sorting) return;
      comparisons++;
      renderBars({comparing: [i, i+1]});
      await sleep(getDelay());
      if (array[i] > array[i+1]) {
        await swap(i, i+1);
        renderBars({swapping: [i, i+1]});
        await sleep(getDelay());
        swapped = true;
      }
    }
    if (!swapped) break;
    swapped = false;
    end--;
    for (let i = end - 1; i >= start; i--) {
      if (!sorting) return;
      comparisons++;
      renderBars({comparing: [i, i+1]});
      await sleep(getDelay());
      if (array[i] > array[i+1]) {
        await swap(i, i+1);
        renderBars({swapping: [i, i+1]});
        await sleep(getDelay());
        swapped = true;
      }
    }
    start++;
  }
}

async function shellSort() {
  let gap = Math.floor(array.length / 2);
  while (gap > 0 && sorting) {
    for (let i = gap; i < array.length; i++) {
      if (!sorting) return;
      let temp = array[i];
      let j = i;
      while (j >= gap && array[j - gap] > temp) {
        comparisons++;
        array[j] = array[j - gap];
        swaps++;
        renderBars({comparing: [j, j - gap]});
        await sleep(getDelay());
        j -= gap;
      }
      array[j] = temp;
      renderBars();
    }
    gap = Math.floor(gap / 2);
  }
}

async function combSort() {
  let gap = array.length;
  const shrink = 1.3;
  let sorted = false;
  while (!sorted && sorting) {
    gap = Math.floor(gap / shrink);
    if (gap <= 1) { gap = 1; sorted = true; }
    for (let i = 0; i + gap < array.length; i++) {
      if (!sorting) return;
      comparisons++;
      renderBars({comparing: [i, i + gap]});
      await sleep(getDelay());
      if (array[i] > array[i + gap]) {
        await swap(i, i + gap);
        renderBars({swapping: [i, i + gap]});
        await sleep(getDelay());
        sorted = false;
      }
    }
  }
}

async function radixSort() {
  const max = Math.max(...array);
  for (let exp = 1; Math.floor(max / exp) > 0 && sorting; exp *= 10) {
    const output = new Array(array.length);
    const count = new Array(10).fill(0);
    for (let i = 0; i < array.length; i++) {
      const digit = Math.floor(array[i] / exp) % 10;
      count[digit]++;
    }
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];
    for (let i = array.length - 1; i >= 0; i--) {
      const digit = Math.floor(array[i] / exp) % 10;
      output[count[digit] - 1] = array[i];
      count[digit]--;
      swaps++;
    }
    for (let i = 0; i < array.length; i++) {
      if (!sorting) return;
      array[i] = output[i];
      renderBars({comparing: [i]});
      await sleep(getDelay());
    }
  }
}

async function countingSort() {
  const max = Math.ceil(Math.max(...array));
  const min = Math.floor(Math.min(...array));
  const range = max - min + 1;
  const count = new Array(range).fill(0);
  const output = new Array(array.length);
  for (let i = 0; i < array.length; i++) {
    count[Math.floor(array[i]) - min]++;
  }
  for (let i = 1; i < range; i++) count[i] += count[i - 1];
  for (let i = array.length - 1; i >= 0; i--) {
    const idx = Math.floor(array[i]) - min;
    output[count[idx] - 1] = array[i];
    count[idx]--;
    swaps++;
  }
  for (let i = 0; i < array.length; i++) {
    if (!sorting) return;
    array[i] = output[i];
    renderBars({comparing: [i]});
    await sleep(getDelay());
  }
}

const SORT_ALGOS = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort, merge: mergeSort, quick: quickSort, heap: heapSort, cocktail: cocktailSort, shell: shellSort, comb: combSort, radix: radixSort, counting: countingSort };

// ─── Algorithm Info Database ───
const ALGO_INFO = {
  bubble: { name: 'Bubble Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, desc: 'Repeatedly steps through the list, compares adjacent elements and swaps them if in wrong order. Best for nearly sorted data.' },
  selection: { name: 'Selection Sort', best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false, desc: 'Finds the minimum element and places it at the beginning. Always O(n²) — not adaptive.' },
  insertion: { name: 'Insertion Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, desc: 'Builds sorted array one item at a time. Excellent for small or nearly sorted arrays.' },
  cocktail: { name: 'Cocktail Shaker Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, desc: 'Bidirectional bubble sort — traverses in both directions alternately. Slightly better than bubble sort for certain distributions.' },
  merge: { name: 'Merge Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true, desc: 'Divides array in half, sorts recursively, then merges. Guaranteed O(n log n) but uses extra memory.' },
  quick: { name: 'Quick Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: false, desc: 'Picks a pivot, partitions around it. Fastest in practice for random data, but worst case is O(n²).' },
  heap: { name: 'Heap Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: false, desc: 'Builds a max-heap, repeatedly extracts the maximum. In-place with guaranteed O(n log n).' },
  shell: { name: 'Shell Sort', best: 'O(n log n)', avg: 'O(n^1.3)', worst: 'O(n²)', space: 'O(1)', stable: false, desc: 'Generalization of insertion sort using gap sequences. Much faster than insertion sort for large arrays.' },
  comb: { name: 'Comb Sort', best: 'O(n log n)', avg: 'O(n²/2^p)', worst: 'O(n²)', space: 'O(1)', stable: false, desc: 'Improvement on bubble sort using shrinking gaps. Eliminates "turtles" (small values at the end).' },
  radix: { name: 'Radix Sort (LSD)', best: 'O(nk)', avg: 'O(nk)', worst: 'O(nk)', space: 'O(n+k)', stable: true, desc: 'Non-comparative sort that distributes elements into buckets by digit. Linear time for fixed-width integers.' },
  counting: { name: 'Counting Sort', best: 'O(n+k)', avg: 'O(n+k)', worst: 'O(n+k)', space: 'O(k)', stable: true, desc: 'Counts occurrences of each value, then reconstructs the array. Efficient when range k is small.' }
};

function updateAlgoInfo(algoKey) {
  const info = ALGO_INFO[algoKey];
  if (!info) return;
  const nameEl = $('#algoInfoName'); if (nameEl) nameEl.textContent = info.name;
  const bestEl = $('#algoTimeBest'); if (bestEl) bestEl.textContent = 'Best: ' + info.best;
  const avgEl = $('#algoTimeAvg'); if (avgEl) avgEl.textContent = 'Avg: ' + info.avg;
  const worstEl = $('#algoTimeWorst'); if (worstEl) worstEl.textContent = 'Worst: ' + info.worst;
  const spaceEl = $('#algoSpace'); if (spaceEl) spaceEl.textContent = 'Space: ' + info.space;
  const stableEl = $('#algoStable'); if (stableEl) { stableEl.textContent = info.stable ? 'Stable ✓' : 'Unstable ✗'; stableEl.className = info.stable ? 'badge badge-stable' : 'badge badge-unstable'; }
  const descEl = $('#algoDescription'); if (descEl) descEl.textContent = info.desc;
}

$('#sortAlgo').addEventListener('change', (e) => updateAlgoInfo(e.target.value));

$('#startSortBtn').addEventListener('click', async () => {
  if (sorting) { sorting = false; $('#startSortBtn').textContent = '▶ Start'; return; }
  sorting = true; comparisons = 0; swaps = 0; startTime = performance.now();
  $('#startSortBtn').textContent = '⏸ Stop';
  const algo = $('#sortAlgo').value;
  await SORT_ALGOS[algo]();
  sorting = false;
  updateStats();
  const btn = $('#startSortBtn');
  if (btn) {
    renderBars({sorted: array.map((_, i) => i)});
    btn.textContent = '▶ Start';
  }
});

$('#resetBtn').addEventListener('click', () => { sorting = false; generateArray(); });
$('#arraySize').addEventListener('input', () => { if (!sorting) generateArray(); });

// ═══════════════════════════════════════
//  PATHFINDING VISUALIZER
// ═══════════════════════════════════════
const ROWS = 20, COLS = 30;
let grid = [], startNode = {r: 5, c: 3}, endNode = {r: 14, c: 26};
let isMouseDown = false, pathfinding = false, dragMode = null;

function initGrid() {
  grid = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => ({ wall: false, visited: false, path: false })));
  renderGrid();
}

function renderGrid() {
  const el = $('#pathGrid');
  el.style.gridTemplateColumns = `repeat(${COLS}, 24px)`;
  el.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'path-cell';
      if (r === startNode.r && c === startNode.c) cell.classList.add('start');
      else if (r === endNode.r && c === endNode.c) cell.classList.add('end');
      else if (grid[r][c].wall) cell.classList.add('wall');
      cell.dataset.r = r; cell.dataset.c = c;
      el.appendChild(cell);
    }
  }
}

function getCell(r, c) { return $$(`.path-cell`)[r * COLS + c]; }

$('#pathGrid').addEventListener('mousedown', e => {
  const cell = e.target.closest('.path-cell');
  if (!cell || pathfinding) return;
  isMouseDown = true;
  const r = +cell.dataset.r, c = +cell.dataset.c;
  if (r === startNode.r && c === startNode.c) dragMode = 'start';
  else if (r === endNode.r && c === endNode.c) dragMode = 'end';
  else { dragMode = 'wall'; grid[r][c].wall = !grid[r][c].wall; cell.classList.toggle('wall'); }
});

$('#pathGrid').addEventListener('mousemove', e => {
  if (!isMouseDown) return;
  const cell = e.target.closest('.path-cell');
  if (!cell) return;
  const r = +cell.dataset.r, c = +cell.dataset.c;
  if (dragMode === 'start') { startNode = {r, c}; clearVisualization(); renderGrid(); }
  else if (dragMode === 'end') { endNode = {r, c}; clearVisualization(); renderGrid(); }
  else if (dragMode === 'wall' && !(r === startNode.r && c === startNode.c) && !(r === endNode.r && c === endNode.c)) { grid[r][c].wall = true; cell.classList.add('wall'); }
});

document.addEventListener('mouseup', () => { isMouseDown = false; dragMode = null; });

function clearVisualization() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) { grid[r][c].visited = false; grid[r][c].path = false; }
  $$('.path-cell').forEach(c => { c.classList.remove('visited', 'path'); });
}

function neighbors(r, c) {
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  return dirs.map(([dr, dc]) => [r+dr, c+dc]).filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc].wall);
}

function heuristic(r1, c1, r2, c2) { return Math.abs(r1-r2) + Math.abs(c1-c2); }

async function bfs() {
  const queue = [[startNode.r, startNode.c]];
  const visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
  const parent = Array.from({length: ROWS}, () => Array(COLS).fill(null));
  visited[startNode.r][startNode.c] = true;
  while (queue.length && pathfinding) {
    const [r, c] = queue.shift();
    if (r === endNode.r && c === endNode.c) return tracePath(parent);
    for (const [nr, nc] of neighbors(r, c)) {
      if (!visited[nr][nc]) {
        visited[nr][nc] = true;
        parent[nr][nc] = [r, c];
        queue.push([nr, nc]);
        const cell = getCell(nr, nc);
        if (cell && !cell.classList.contains('end')) { cell.classList.add('visited'); }
        await sleep(15);
      }
    }
  }
}

async function dfs() {
  const stack = [[startNode.r, startNode.c]];
  const visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
  const parent = Array.from({length: ROWS}, () => Array(COLS).fill(null));
  visited[startNode.r][startNode.c] = true;
  while (stack.length && pathfinding) {
    const [r, c] = stack.pop();
    if (r === endNode.r && c === endNode.c) return tracePath(parent);
    for (const [nr, nc] of neighbors(r, c)) {
      if (!visited[nr][nc]) {
        visited[nr][nc] = true;
        parent[nr][nc] = [r, c];
        stack.push([nr, nc]);
        const cell = getCell(nr, nc);
        if (cell && !cell.classList.contains('end')) { cell.classList.add('visited'); }
        await sleep(15);
      }
    }
  }
}

async function dijkstra() {
  const dist = Array.from({length: ROWS}, () => Array(COLS).fill(Infinity));
  const parent = Array.from({length: ROWS}, () => Array(COLS).fill(null));
  const visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
  dist[startNode.r][startNode.c] = 0;
  const pq = [[0, startNode.r, startNode.c]];
  while (pq.length && pathfinding) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, r, c] = pq.shift();
    if (visited[r][c]) continue;
    visited[r][c] = true;
    if (r === endNode.r && c === endNode.c) return tracePath(parent);
    const cell = getCell(r, c);
    if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) cell.classList.add('visited');
    await sleep(10);
    for (const [nr, nc] of neighbors(r, c)) {
      const nd = d + 1;
      if (nd < dist[nr][nc]) { dist[nr][nc] = nd; parent[nr][nc] = [r, c]; pq.push([nd, nr, nc]); }
    }
  }
}

async function astar() {
  const gScore = Array.from({length: ROWS}, () => Array(COLS).fill(Infinity));
  const fScore = Array.from({length: ROWS}, () => Array(COLS).fill(Infinity));
  const parent = Array.from({length: ROWS}, () => Array(COLS).fill(null));
  const closed = Array.from({length: ROWS}, () => Array(COLS).fill(false));
  gScore[startNode.r][startNode.c] = 0;
  fScore[startNode.r][startNode.c] = heuristic(startNode.r, startNode.c, endNode.r, endNode.c);
  const open = [[fScore[startNode.r][startNode.c], startNode.r, startNode.c]];
  while (open.length && pathfinding) {
    open.sort((a, b) => a[0] - b[0]);
    const [, r, c] = open.shift();
    if (r === endNode.r && c === endNode.c) return tracePath(parent);
    if (closed[r][c]) continue;
    closed[r][c] = true;
    const cell = getCell(r, c);
    if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) cell.classList.add('visited');
    await sleep(10);
    for (const [nr, nc] of neighbors(r, c)) {
      if (closed[nr][nc]) continue;
      const tentG = gScore[r][c] + 1;
      if (tentG < gScore[nr][nc]) {
        gScore[nr][nc] = tentG;
        fScore[nr][nc] = tentG + heuristic(nr, nc, endNode.r, endNode.c);
        parent[nr][nc] = [r, c];
        open.push([fScore[nr][nc], nr, nc]);
      }
    }
  }
}

async function tracePath(parent) {
  let [r, c] = [endNode.r, endNode.c];
  const path = [];
  while (parent[r][c]) {
    path.unshift([r, c]);
    [r, c] = parent[r][c];
  }
  for (const [pr, pc] of path) {
    if (pr === endNode.r && pc === endNode.c) continue;
    const cell = getCell(pr, pc);
    if (cell) { cell.classList.remove('visited'); cell.classList.add('path'); }
    await sleep(30);
  }
}

function generateMaze() {
  clearVisualization();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      grid[r][c].wall = Math.random() < 0.3 && !(r === startNode.r && c === startNode.c) && !(r === endNode.r && c === endNode.c);
  renderGrid();
}

async function greedy() {
  const parent = Array.from({length: ROWS}, () => Array(COLS).fill(null));
  const closed = Array.from({length: ROWS}, () => Array(COLS).fill(false));
  const open = [[heuristic(startNode.r, startNode.c, endNode.r, endNode.c), startNode.r, startNode.c]];
  while (open.length && pathfinding) {
    open.sort((a, b) => a[0] - b[0]);
    const [, r, c] = open.shift();
    if (r === endNode.r && c === endNode.c) return tracePath(parent);
    if (closed[r][c]) continue;
    closed[r][c] = true;
    const cell = getCell(r, c);
    if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) cell.classList.add('visited');
    await sleep(10);
    for (const [nr, nc] of neighbors(r, c)) {
      if (closed[nr][nc]) continue;
      parent[nr][nc] = [r, c];
      open.push([heuristic(nr, nc, endNode.r, endNode.c), nr, nc]);
    }
  }
}

const PATH_ALGOS = { bfs, dfs, dijkstra, astar, greedy };

$('#startPathBtn').addEventListener('click', async () => {
  if (pathfinding) { pathfinding = false; return; }
  clearVisualization();
  pathfinding = true;
  await PATH_ALGOS[$('#pathAlgo').value]();
  pathfinding = false;
});

$('#clearPathBtn').addEventListener('click', () => { pathfinding = false; initGrid(); });
$('#mazeBtn').addEventListener('click', generateMaze);

// Theme
if (typeof QU !== 'undefined') { QU.initTheme(); }
else {
  $('#themeBtn').addEventListener('click', () => { const h = document.documentElement; const d = h.dataset.theme === 'dark'; h.dataset.theme = d ? 'light' : 'dark'; $('#themeBtn').textContent = d ? '☀️' : '🌙'; localStorage.setItem('theme', h.dataset.theme); });
  if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
}

// Init
generateArray();
initGrid();
})();
