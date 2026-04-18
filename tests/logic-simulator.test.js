/**
 * Logic Simulator — Unit Tests
 * Tests: gate logic (AND/OR/NOT/XOR/NAND/NOR), DFF, 7-seg, truth table generation
 */
import { describe, it, expect } from 'vitest';

// ─── Pure Logic Functions ───
const LOGIC = {
    and:  (inps) => (inps[0] && inps[1]) ? 1 : 0,
    or:   (inps) => (inps[0] || inps[1]) ? 1 : 0,
    not:  (inps) => inps[0] ? 0 : 1,
    xor:  (inps) => (inps[0] ^ inps[1]) ? 1 : 0,
    nand: (inps) => !(inps[0] && inps[1]) ? 1 : 0,
    nor:  (inps) => !(inps[0] || inps[1]) ? 1 : 0,
};

// ─── DFF Logic ───
function dffUpdate(mem, data, clk) {
    let newMem = mem;
    if (clk === 1) newMem = data;
    return { q: newMem, qn: newMem ? 0 : 1, mem: newMem };
}

// ─── 7-Segment Decoder ───
function seg7Decode(a, b, c, d) {
    return (a * 8 + b * 4 + c * 2 + d * 1).toString(16).toUpperCase();
}

// ─── Truth Table Generator ───
function generateTruthTable(numSwitches, evaluator) {
    const rows = [];
    const numRows = 1 << numSwitches;
    for (let r = 0; r < numRows; r++) {
        const inputs = [];
        for (let i = 0; i < numSwitches; i++) {
            inputs.push((r >> (numSwitches - 1 - i)) & 1);
        }
        rows.push({ inputs, output: evaluator(inputs) });
    }
    return rows;
}

describe('Logic Simulator', () => {
    describe('AND Gate', () => {
        it('0 AND 0 = 0', () => expect(LOGIC.and([0, 0])).toBe(0));
        it('0 AND 1 = 0', () => expect(LOGIC.and([0, 1])).toBe(0));
        it('1 AND 0 = 0', () => expect(LOGIC.and([1, 0])).toBe(0));
        it('1 AND 1 = 1', () => expect(LOGIC.and([1, 1])).toBe(1));
    });

    describe('OR Gate', () => {
        it('0 OR 0 = 0', () => expect(LOGIC.or([0, 0])).toBe(0));
        it('0 OR 1 = 1', () => expect(LOGIC.or([0, 1])).toBe(1));
        it('1 OR 0 = 1', () => expect(LOGIC.or([1, 0])).toBe(1));
        it('1 OR 1 = 1', () => expect(LOGIC.or([1, 1])).toBe(1));
    });

    describe('NOT Gate', () => {
        it('NOT 0 = 1', () => expect(LOGIC.not([0])).toBe(1));
        it('NOT 1 = 0', () => expect(LOGIC.not([1])).toBe(0));
    });

    describe('XOR Gate', () => {
        it('0 XOR 0 = 0', () => expect(LOGIC.xor([0, 0])).toBe(0));
        it('0 XOR 1 = 1', () => expect(LOGIC.xor([0, 1])).toBe(1));
        it('1 XOR 0 = 1', () => expect(LOGIC.xor([1, 0])).toBe(1));
        it('1 XOR 1 = 0', () => expect(LOGIC.xor([1, 1])).toBe(0));
    });

    describe('NAND Gate', () => {
        it('0 NAND 0 = 1', () => expect(LOGIC.nand([0, 0])).toBe(1));
        it('1 NAND 1 = 0', () => expect(LOGIC.nand([1, 1])).toBe(0));
        it('0 NAND 1 = 1', () => expect(LOGIC.nand([0, 1])).toBe(1));
    });

    describe('NOR Gate', () => {
        it('0 NOR 0 = 1', () => expect(LOGIC.nor([0, 0])).toBe(1));
        it('1 NOR 1 = 0', () => expect(LOGIC.nor([1, 1])).toBe(0));
        it('0 NOR 1 = 0', () => expect(LOGIC.nor([0, 1])).toBe(0));
    });

    describe('D Flip-Flop', () => {
        it('latches data on clock high', () => {
            const r = dffUpdate(0, 1, 1);
            expect(r.q).toBe(1);
            expect(r.qn).toBe(0);
        });
        it('holds state on clock low', () => {
            const r = dffUpdate(1, 0, 0);
            expect(r.q).toBe(1);
        });
        it('clears on clock with data=0', () => {
            const r = dffUpdate(1, 0, 1);
            expect(r.q).toBe(0);
            expect(r.qn).toBe(1);
        });
    });

    describe('7-Segment Decoder', () => {
        it('decodes 0000 to 0', () => expect(seg7Decode(0,0,0,0)).toBe('0'));
        it('decodes 1001 to 9', () => expect(seg7Decode(1,0,0,1)).toBe('9'));
        it('decodes 1111 to F', () => expect(seg7Decode(1,1,1,1)).toBe('F'));
        it('decodes 1010 to A', () => expect(seg7Decode(1,0,1,0)).toBe('A'));
    });

    describe('Truth Table Generator', () => {
        it('generates 4 rows for 2 switches', () => {
            const table = generateTruthTable(2, ins => LOGIC.and(ins));
            expect(table).toHaveLength(4);
        });
        it('generates 8 rows for 3 switches', () => {
            const table = generateTruthTable(3, ins => LOGIC.and([ins[0], ins[1]]));
            expect(table).toHaveLength(8);
        });
        it('AND truth table is correct', () => {
            const table = generateTruthTable(2, ins => LOGIC.and(ins));
            expect(table[0].output).toBe(0); // 00
            expect(table[1].output).toBe(0); // 01
            expect(table[2].output).toBe(0); // 10
            expect(table[3].output).toBe(1); // 11
        });
        it('XOR truth table is correct', () => {
            const table = generateTruthTable(2, ins => LOGIC.xor(ins));
            expect(table[0].output).toBe(0);
            expect(table[1].output).toBe(1);
            expect(table[2].output).toBe(1);
            expect(table[3].output).toBe(0);
        });
    });

    describe('Combined circuits', () => {
        it('Half adder: sum = XOR, carry = AND', () => {
            const sum = LOGIC.xor([1, 1]);
            const carry = LOGIC.and([1, 1]);
            expect(sum).toBe(0);
            expect(carry).toBe(1);
        });
        it('NAND is universal: NOT via NAND', () => {
            const notA = LOGIC.nand([1, 1]);
            expect(notA).toBe(0);
            const notB = LOGIC.nand([0, 0]);
            expect(notB).toBe(1);
        });
    });
});
