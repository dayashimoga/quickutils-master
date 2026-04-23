/**
 * City Pathfinding — Unit Tests
 * Tests: A* algorithm, grid operations, agent state, congestion, heuristics
 */
import { describe, it, expect } from 'vitest';

// ─── Grid Cell Types ───
const CELL = { ROAD: 0, BUILDING: 1, PARK: 2, WATER: 3 };

// ─── A* Algorithm ───
function astar(grid, start, end, cols, rows) {
    const key = (x, y) => `${x},${y}`;
    const open = [{ x: start.x, y: start.y, g: 0, f: 0, parent: null }];
    const closed = new Set();
    
    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();
        const ck = key(current.x, current.y);
        
        if (current.x === end.x && current.y === end.y) {
            const path = [];
            let node = current;
            while (node) { path.unshift({ x: node.x, y: node.y }); node = node.parent; }
            return path;
        }
        
        if (closed.has(ck)) continue;
        closed.add(ck);
        
        const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        for (const [dx, dy] of dirs) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
            if (grid[ny][nx] === CELL.BUILDING || grid[ny][nx] === CELL.WATER) continue;
            if (closed.has(key(nx, ny))) continue;
            
            const g = current.g + 1;
            const h = Math.abs(nx - end.x) + Math.abs(ny - end.y);
            open.push({ x: nx, y: ny, g, f: g + h, parent: current });
        }
    }
    return null; // no path
}

// ─── Dijkstra (for comparison mode) ───
function dijkstra(grid, start, end, cols, rows) {
    const key = (x, y) => `${x},${y}`;
    const dist = {};
    const prev = {};
    const visited = new Set();
    const queue = [{ x: start.x, y: start.y, d: 0 }];
    dist[key(start.x, start.y)] = 0;
    
    while (queue.length > 0) {
        queue.sort((a, b) => a.d - b.d);
        const u = queue.shift();
        const uk = key(u.x, u.y);
        if (visited.has(uk)) continue;
        visited.add(uk);
        
        if (u.x === end.x && u.y === end.y) {
            const path = [];
            let k = uk;
            while (k) { const [px, py] = k.split(',').map(Number); path.unshift({ x: px, y: py }); k = prev[k]; }
            return path;
        }
        
        const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        for (const [dx, dy] of dirs) {
            const nx = u.x + dx, ny = u.y + dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
            if (grid[ny][nx] === CELL.BUILDING || grid[ny][nx] === CELL.WATER) continue;
            const nk = key(nx, ny);
            const alt = u.d + 1;
            if (alt < (dist[nk] ?? Infinity)) {
                dist[nk] = alt;
                prev[nk] = uk;
                queue.push({ x: nx, y: ny, d: alt });
            }
        }
    }
    return null;
}

// ─── Heuristics ───
function manhattan(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function euclidean(a, b) { return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }

// ─── Congestion Model ───
function congestionLevel(agentsOnCell, capacity) {
    if (agentsOnCell >= capacity) return 'jammed';
    if (agentsOnCell >= capacity * 0.7) return 'heavy';
    if (agentsOnCell >= capacity * 0.3) return 'moderate';
    return 'free';
}

// ─── Agent State Machine ───
function nextAgentState(current, hasPath, atDest) {
    if (current === 'idle' && hasPath) return 'moving';
    if (current === 'moving' && atDest) return 'arrived';
    if (current === 'moving' && !hasPath) return 'rerouting';
    if (current === 'rerouting' && hasPath) return 'moving';
    if (current === 'arrived') return 'idle';
    return current;
}

describe('City Pathfinding', () => {
    describe('A* Algorithm', () => {
        const emptyGrid = [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
        ];

        it('finds path in empty grid', () => {
            const path = astar(emptyGrid, {x:0,y:0}, {x:4,y:4}, 5, 5);
            expect(path).not.toBeNull();
            expect(path[0]).toEqual({x:0,y:0});
            expect(path[path.length-1]).toEqual({x:4,y:4});
        });
        it('path length is optimal (Manhattan distance + 1)', () => {
            const path = astar(emptyGrid, {x:0,y:0}, {x:4,y:4}, 5, 5);
            expect(path).toHaveLength(9); // 4+4+1
        });
        it('avoids buildings', () => {
            const grid = [
                [0,0,0],
                [0,1,0],
                [0,0,0],
            ];
            const path = astar(grid, {x:0,y:0}, {x:2,y:2}, 3, 3);
            expect(path).not.toBeNull();
            const blocked = path.find(p => p.x === 1 && p.y === 1);
            expect(blocked).toBeUndefined();
        });
        it('returns null for impossible path', () => {
            const grid = [
                [0,1,0],
                [0,1,0],
                [0,1,0],
            ];
            const path = astar(grid, {x:0,y:0}, {x:2,y:0}, 3, 3);
            expect(path).toBeNull();
        });
        it('handles start == end', () => {
            const path = astar(emptyGrid, {x:2,y:2}, {x:2,y:2}, 5, 5);
            expect(path).toHaveLength(1);
        });
    });

    describe('Dijkstra', () => {
        const emptyGrid = [[0,0,0],[0,0,0],[0,0,0]];
        
        it('finds same path as A* on unweighted grid', () => {
            const pathA = astar(emptyGrid, {x:0,y:0}, {x:2,y:2}, 3, 3);
            const pathD = dijkstra(emptyGrid, {x:0,y:0}, {x:2,y:2}, 3, 3);
            expect(pathA).toHaveLength(pathD.length);
        });
    });

    describe('Heuristics', () => {
        it('Manhattan distance is correct', () => {
            expect(manhattan({x:0,y:0}, {x:3,y:4})).toBe(7);
        });
        it('Euclidean distance is correct', () => {
            expect(euclidean({x:0,y:0}, {x:3,y:4})).toBeCloseTo(5);
        });
        it('Manhattan >= Euclidean (admissibility)', () => {
            const m = manhattan({x:0,y:0}, {x:3,y:4});
            const e = euclidean({x:0,y:0}, {x:3,y:4});
            expect(m).toBeGreaterThanOrEqual(e);
        });
    });

    describe('Congestion Model', () => {
        it('free when no agents', () => {
            expect(congestionLevel(0, 10)).toBe('free');
        });
        it('moderate at 30%', () => {
            expect(congestionLevel(3, 10)).toBe('moderate');
        });
        it('heavy at 70%', () => {
            expect(congestionLevel(7, 10)).toBe('heavy');
        });
        it('jammed at capacity', () => {
            expect(congestionLevel(10, 10)).toBe('jammed');
        });
    });

    describe('Agent State Machine', () => {
        it('idle -> moving when path found', () => {
            expect(nextAgentState('idle', true, false)).toBe('moving');
        });
        it('moving -> arrived at destination', () => {
            expect(nextAgentState('moving', true, true)).toBe('arrived');
        });
        it('moving -> rerouting when path lost', () => {
            expect(nextAgentState('moving', false, false)).toBe('rerouting');
        });
        it('arrived -> idle', () => {
            expect(nextAgentState('arrived', false, false)).toBe('idle');
        });
    });
});
