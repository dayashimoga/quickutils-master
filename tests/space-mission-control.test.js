/**
 * Space Mission Control — Unit Tests
 * Tests: mission state machine, telemetry, orbit calculations, fuel management
 */
import { describe, it, expect } from 'vitest';

// ─── Mission State Machine ───
const VALID_TRANSITIONS = {
    PLANNING:   ['COUNTDOWN'],
    COUNTDOWN:  ['LAUNCH', 'ABORTED'],
    LAUNCH:     ['ASCENT', 'TRAVEL', 'ABORTED'],
    ASCENT:     ['TRAVEL', 'ABORTED'],
    TRAVEL:     ['ARRIVAL', 'ABORTED'],
    ARRIVAL:    ['LANDING'],
    LANDING:    ['LANDED', 'ABORTED'],
    LANDED:     [],
    ABORTED:    [],
};

function canTransition(from, to) {
    return (VALID_TRANSITIONS[from] || []).includes(to);
}

// ─── Telemetry Calculator ───
function updateTelemetry(data, phase) {
    const updated = { ...data };
    switch (phase) {
        case 'LAUNCH':
            updated.alt += 60 * 0.1;
            updated.vel += 0.4;
            updated.fuel -= 0.15;
            break;
        case 'TRAVEL':
            updated.alt += 400;
            updated.vel = 12.8;
            break;
        case 'LANDING':
            updated.alt = Math.max(0, updated.alt * 0.92);
            updated.vel = Math.max(0, updated.vel * 0.92);
            updated.fuel -= 0.2;
            break;
    }
    updated.fuel = Math.max(0, updated.fuel);
    return updated;
}

// ─── Time Formatting ───
function formatMissionTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `T+${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── Orbit Calculation ───
function orbitalVelocity(dist) {
    // v = sqrt(G*M/r), simplified to v = k / sqrt(r)
    const k = 29.8; // km/s at 1 AU
    return k / Math.sqrt(dist / 150); // 150 = Earth distance in data units
}

// ─── Fuel Consumption Model ───
function fuelBurn(thrust, duration) {
    return thrust * duration * 0.001;
}

describe('Space Mission Control', () => {
    describe('State Machine', () => {
        it('PLANNING can transition to COUNTDOWN', () => {
            expect(canTransition('PLANNING', 'COUNTDOWN')).toBe(true);
        });
        it('PLANNING cannot jump to LANDING', () => {
            expect(canTransition('PLANNING', 'LANDING')).toBe(false);
        });
        it('COUNTDOWN can abort', () => {
            expect(canTransition('COUNTDOWN', 'ABORTED')).toBe(true);
        });
        it('LAUNCH goes to TRAVEL or ABORTED', () => {
            expect(canTransition('LAUNCH', 'TRAVEL')).toBe(true);
            expect(canTransition('LAUNCH', 'ABORTED')).toBe(true);
        });
        it('LANDED is terminal', () => {
            expect(canTransition('LANDED', 'PLANNING')).toBe(false);
        });
        it('ABORTED is terminal', () => {
            expect(canTransition('ABORTED', 'LAUNCH')).toBe(false);
        });
    });

    describe('Telemetry Updates', () => {
        const base = { alt: 0, vel: 0, fuel: 100, thrust: 100 };

        it('LAUNCH increases altitude and velocity', () => {
            const next = updateTelemetry(base, 'LAUNCH');
            expect(next.alt).toBeGreaterThan(0);
            expect(next.vel).toBeGreaterThan(0);
        });
        it('LAUNCH decreases fuel', () => {
            const next = updateTelemetry(base, 'LAUNCH');
            expect(next.fuel).toBeLessThan(100);
        });
        it('TRAVEL sets velocity to transit speed', () => {
            const next = updateTelemetry(base, 'TRAVEL');
            expect(next.vel).toBe(12.8);
        });
        it('LANDING reduces altitude and velocity', () => {
            const mid = { alt: 10000, vel: 10, fuel: 50, thrust: 60 };
            const next = updateTelemetry(mid, 'LANDING');
            expect(next.alt).toBeLessThan(10000);
            expect(next.vel).toBeLessThan(10);
        });
        it('fuel never goes below 0', () => {
            const low = { alt: 100, vel: 5, fuel: 0.1, thrust: 100 };
            const next = updateTelemetry(low, 'LANDING');
            expect(next.fuel).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Time Formatting', () => {
        it('formats 0 seconds', () => {
            expect(formatMissionTime(0)).toBe('T+00:00:00');
        });
        it('formats 3661 seconds correctly', () => {
            expect(formatMissionTime(3661)).toBe('T+01:01:01');
        });
        it('handles large times', () => {
            expect(formatMissionTime(86400)).toBe('T+24:00:00');
        });
    });

    describe('Orbital Velocity', () => {
        it('Earth distance gives ~29.8 km/s', () => {
            expect(orbitalVelocity(150)).toBeCloseTo(29.8, 0);
        });
        it('farther orbits are slower', () => {
            expect(orbitalVelocity(900)).toBeLessThan(orbitalVelocity(150));
        });
        it('returns positive values', () => {
            expect(orbitalVelocity(250)).toBeGreaterThan(0);
        });
    });

    describe('Fuel Consumption', () => {
        it('calculates burn correctly', () => {
            expect(fuelBurn(100, 10)).toBe(1);
        });
        it('zero thrust = zero burn', () => {
            expect(fuelBurn(0, 100)).toBe(0);
        });
    });
});
