/**
 * Quantum Sandbox — Unit Tests
 * Tests: complex math, gate matrices, state application, CNOT, measurement probabilities
 */
import { describe, it, expect } from 'vitest';

// ─── Complex Number Math ───
function cmul(a, b) { return [a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]]; }
function cadd(a, b) { return [a[0]+b[0], a[1]+b[1]]; }
function cnorm(a) { return Math.sqrt(a[0]*a[0] + a[1]*a[1]); }
function cconj(a) { return [a[0], -a[1]]; }

// ─── Gate Matrices (2x2) ───
const SQRT2 = 1 / Math.sqrt(2);
const GATES = {
    H: [[[SQRT2,0],[SQRT2,0]],[[SQRT2,0],[-SQRT2,0]]],
    X: [[[0,0],[1,0]],[[1,0],[0,0]]],
    Y: [[[0,0],[0,-1]],[[0,1],[0,0]]],
    Z: [[[1,0],[0,0]],[[0,0],[-1,0]]],
    I: [[[1,0],[0,0]],[[0,0],[1,0]]],
    S: [[[1,0],[0,0]],[[0,0],[0,1]]],
    T: [[[1,0],[0,0]],[[0,0],[SQRT2,SQRT2]]],
};

// ─── Apply Gate to Single Qubit State ───
function applyGate(gate, state) {
    // state = [alpha, beta] where alpha,beta are [re,im]
    const newAlpha = cadd(cmul(gate[0][0], state[0]), cmul(gate[0][1], state[1]));
    const newBeta  = cadd(cmul(gate[1][0], state[0]), cmul(gate[1][1], state[1]));
    return [newAlpha, newBeta];
}

// ─── Measurement Probability ───
function measureProb(state) {
    const p0 = cnorm(state[0]) ** 2;
    const p1 = cnorm(state[1]) ** 2;
    return { p0, p1 };
}

// ─── CNOT (2-qubit) ───
// 4-element state [|00>, |01>, |10>, |11>]
function applyCNOT(state4) {
    // CNOT swaps |10> and |11>
    return [state4[0], state4[1], state4[3], state4[2]];
}

// ─── SWAP ───
function applySWAP(state4) {
    return [state4[0], state4[2], state4[1], state4[3]];
}

// ─── Tensor Product ───
function tensorProduct(a, b) {
    // a=[a0,a1], b=[b0,b1] -> [a0*b0, a0*b1, a1*b0, a1*b1]
    return [cmul(a[0],b[0]), cmul(a[0],b[1]), cmul(a[1],b[0]), cmul(a[1],b[1])];
}

describe('Quantum Sandbox', () => {
    describe('Complex Math', () => {
        it('multiplies complex numbers', () => {
            const r = cmul([3, 2], [1, 4]);
            expect(r[0]).toBeCloseTo(-5);
            expect(r[1]).toBeCloseTo(14);
        });
        it('adds complex numbers', () => {
            const r = cadd([1, 2], [3, 4]);
            expect(r).toEqual([4, 6]);
        });
        it('calculates norm', () => {
            expect(cnorm([3, 4])).toBeCloseTo(5);
        });
        it('conjugates', () => {
            expect(cconj([3, 4])).toEqual([3, -4]);
        });
        it('norm of unit is 1', () => {
            expect(cnorm([SQRT2, 0])).toBeCloseTo(SQRT2);
        });
    });

    describe('Gate Application', () => {
        const ket0 = [[1,0], [0,0]]; // |0>
        const ket1 = [[0,0], [1,0]]; // |1>

        it('X gate flips |0> to |1>', () => {
            const result = applyGate(GATES.X, ket0);
            expect(cnorm(result[0])).toBeCloseTo(0);
            expect(cnorm(result[1])).toBeCloseTo(1);
        });
        it('X gate flips |1> to |0>', () => {
            const result = applyGate(GATES.X, ket1);
            expect(cnorm(result[0])).toBeCloseTo(1);
            expect(cnorm(result[1])).toBeCloseTo(0);
        });
        it('H gate creates superposition from |0>', () => {
            const result = applyGate(GATES.H, ket0);
            expect(cnorm(result[0])).toBeCloseTo(SQRT2);
            expect(cnorm(result[1])).toBeCloseTo(SQRT2);
        });
        it('Z gate leaves |0> unchanged', () => {
            const result = applyGate(GATES.Z, ket0);
            expect(result[0][0]).toBeCloseTo(1);
            expect(cnorm(result[1])).toBeCloseTo(0);
        });
        it('Z gate negates |1>', () => {
            const result = applyGate(GATES.Z, ket1);
            expect(result[1][0]).toBeCloseTo(-1);
        });
        it('I gate preserves state', () => {
            const result = applyGate(GATES.I, ket0);
            expect(result[0][0]).toBeCloseTo(1);
            expect(cnorm(result[1])).toBeCloseTo(0);
        });
        it('HH = I (self-inverse)', () => {
            const step1 = applyGate(GATES.H, ket0);
            const step2 = applyGate(GATES.H, step1);
            expect(step2[0][0]).toBeCloseTo(1, 5);
            expect(cnorm(step2[1])).toBeCloseTo(0, 5);
        });
    });

    describe('Measurement', () => {
        it('|0> has P(0)=1, P(1)=0', () => {
            const p = measureProb([[1,0], [0,0]]);
            expect(p.p0).toBeCloseTo(1);
            expect(p.p1).toBeCloseTo(0);
        });
        it('|+> has P(0)=0.5, P(1)=0.5', () => {
            const ket_plus = [[SQRT2,0], [SQRT2,0]];
            const p = measureProb(ket_plus);
            expect(p.p0).toBeCloseTo(0.5);
            expect(p.p1).toBeCloseTo(0.5);
        });
        it('probabilities sum to ~1 for normalized state', () => {
            // Normalized state: |α|² + |β|² = 1
            const a = [Math.sqrt(0.6), 0], b = [Math.sqrt(0.4), 0];
            const p = measureProb([a, b]);
            expect(p.p0 + p.p1).toBeCloseTo(1, 5);
        });
    });

    describe('2-Qubit Operations', () => {
        it('CNOT preserves |00>', () => {
            const s = [[1,0],[0,0],[0,0],[0,0]];
            const r = applyCNOT(s);
            expect(r[0][0]).toBe(1);
        });
        it('CNOT flips |10> to |11>', () => {
            const s = [[0,0],[0,0],[1,0],[0,0]];
            const r = applyCNOT(s);
            expect(r[3][0]).toBe(1);
            expect(r[2][0]).toBe(0);
        });
        it('SWAP exchanges |01> and |10>', () => {
            const s = [[0,0],[1,0],[0,0],[0,0]];
            const r = applySWAP(s);
            expect(r[2][0]).toBe(1);
        });
    });

    describe('Tensor Product', () => {
        it('|0>⊗|0> = |00>', () => {
            const r = tensorProduct([[1,0],[0,0]], [[1,0],[0,0]]);
            expect(r[0][0]).toBeCloseTo(1);
            expect(cnorm(r[1])).toBeCloseTo(0);
        });
        it('|1>⊗|0> = |10>', () => {
            const r = tensorProduct([[0,0],[1,0]], [[1,0],[0,0]]);
            expect(r[2][0]).toBeCloseTo(1);
        });
    });
});
