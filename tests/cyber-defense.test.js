/**
 * Cyber Defense — Unit Tests
 * Tests: firewall rules, packet classification, scoring, threat types, integrity
 */
import { describe, it, expect } from 'vitest';

// ─── Firewall Rule Engine ───
function matchRule(packet, rules) {
    for (const rule of rules) {
        if (rule.port && packet.port !== rule.port) continue;
        if (rule.proto && packet.proto !== rule.proto) continue;
        if (rule.srcIp && packet.src !== rule.srcIp) continue;
        if (rule.type && packet.type !== rule.type) continue;
        return rule.action; // 'block' or 'allow'
    }
    return 'allow'; // default
}

// ─── Packet Classification ───
const ATTACK_TYPES = {
    ddos:       { name: 'DDoS Attack', severity: 'critical', color: '#ef4444', points: 50 },
    portScan:   { name: 'Port Scan', severity: 'high', color: '#f97316', points: 30 },
    sqlInject:  { name: 'SQL Injection', severity: 'critical', color: '#ef4444', points: 50 },
    phishing:   { name: 'Phishing', severity: 'medium', color: '#f59e0b', points: 20 },
    malware:    { name: 'Malware Delivery', severity: 'critical', color: '#ef4444', points: 50 },
    bruteForce: { name: 'Brute Force', severity: 'high', color: '#f97316', points: 30 },
    normal:     { name: 'Normal Traffic', severity: 'low', color: '#10b981', points: 0 },
};

function classifyPacket(packet) {
    if (packet.payload && packet.payload.includes('DROP TABLE')) return 'sqlInject';
    if (packet.payload && packet.payload.includes('<script>')) return 'phishing';
    if (packet.rate && packet.rate > 1000) return 'ddos';
    if (packet.ports && packet.ports.length > 5) return 'portScan';
    if (packet.payload && packet.payload.includes('exec(')) return 'malware';
    if (packet.attempts && packet.attempts > 3) return 'bruteForce';
    return 'normal';
}

// ─── Score System ───
function calculateScore(blocked, passed, leaked) {
    const score = blocked * 10 - leaked * 50 + (passed > 0 ? 5 : 0);
    return Math.max(0, score);
}

// ─── Network Integrity ───
function calcIntegrity(totalNodes, compromised) {
    if (totalNodes === 0) return 100;
    return Math.round((1 - compromised / totalNodes) * 100);
}

// ─── Threat Level ───
function threatLevel(activeThreats) {
    if (activeThreats >= 10) return { level: 'CRITICAL', color: '#ef4444' };
    if (activeThreats >= 5) return { level: 'HIGH', color: '#f97316' };
    if (activeThreats >= 2) return { level: 'ELEVATED', color: '#f59e0b' };
    return { level: 'LOW', color: '#10b981' };
}

// ─── IP Rate Limiter ───
function isRateLimited(ip, requestLog, limit, windowMs) {
    const now = Date.now();
    const recentRequests = (requestLog[ip] || []).filter(t => now - t < windowMs);
    return recentRequests.length >= limit;
}

describe('Cyber Defense', () => {
    describe('Firewall Rules', () => {
        const rules = [
            { port: 22, action: 'block' },
            { port: 80, proto: 'HTTP', action: 'allow' },
            { port: 443, action: 'allow' },
            { type: 'ddos', action: 'block' },
        ];

        it('blocks port 22 (SSH)', () => {
            expect(matchRule({ port: 22 }, rules)).toBe('block');
        });
        it('allows port 80 HTTP', () => {
            expect(matchRule({ port: 80, proto: 'HTTP' }, rules)).toBe('allow');
        });
        it('blocks DDoS type', () => {
            expect(matchRule({ type: 'ddos' }, rules)).toBe('block');
        });
        it('allows unknown ports by default', () => {
            expect(matchRule({ port: 8080 }, rules)).toBe('allow');
        });
    });

    describe('Packet Classification', () => {
        it('detects SQL injection', () => {
            expect(classifyPacket({ payload: "SELECT * DROP TABLE users" })).toBe('sqlInject');
        });
        it('detects phishing', () => {
            expect(classifyPacket({ payload: "<script>alert('xss')</script>" })).toBe('phishing');
        });
        it('detects DDoS by rate', () => {
            expect(classifyPacket({ rate: 5000 })).toBe('ddos');
        });
        it('detects port scan', () => {
            expect(classifyPacket({ ports: [22, 80, 443, 8080, 3306, 5432] })).toBe('portScan');
        });
        it('detects malware', () => {
            expect(classifyPacket({ payload: "exec(malicious_code)" })).toBe('malware');
        });
        it('detects brute force', () => {
            expect(classifyPacket({ attempts: 10 })).toBe('bruteForce');
        });
        it('classifies normal traffic', () => {
            expect(classifyPacket({ payload: "Hello world" })).toBe('normal');
        });
    });

    describe('Score System', () => {
        it('scores blocked threats', () => {
            expect(calculateScore(5, 10, 0)).toBe(55);
        });
        it('penalizes leaked packets', () => {
            expect(calculateScore(0, 0, 1)).toBe(0);
        });
        it('never returns negative', () => {
            expect(calculateScore(0, 0, 100)).toBe(0);
        });
    });

    describe('Network Integrity', () => {
        it('100% when no nodes compromised', () => {
            expect(calcIntegrity(10, 0)).toBe(100);
        });
        it('0% when all compromised', () => {
            expect(calcIntegrity(10, 10)).toBe(0);
        });
        it('handles zero nodes', () => {
            expect(calcIntegrity(0, 0)).toBe(100);
        });
    });

    describe('Threat Level', () => {
        it('CRITICAL at 10+ threats', () => {
            expect(threatLevel(15).level).toBe('CRITICAL');
        });
        it('HIGH at 5-9', () => {
            expect(threatLevel(7).level).toBe('HIGH');
        });
        it('ELEVATED at 2-4', () => {
            expect(threatLevel(3).level).toBe('ELEVATED');
        });
        it('LOW at 0-1', () => {
            expect(threatLevel(1).level).toBe('LOW');
        });
    });

    describe('Rate Limiter', () => {
        it('allows under limit', () => {
            const log = { '1.2.3.4': [Date.now() - 100, Date.now() - 200] };
            expect(isRateLimited('1.2.3.4', log, 5, 60000)).toBe(false);
        });
        it('blocks at limit', () => {
            const now = Date.now();
            const log = { '1.2.3.4': [now-100, now-200, now-300, now-400, now-500] };
            expect(isRateLimited('1.2.3.4', log, 5, 60000)).toBe(true);
        });
        it('allows unknown IP', () => {
            expect(isRateLimited('5.6.7.8', {}, 5, 60000)).toBe(false);
        });
    });

    describe('Attack Types Database', () => {
        it('has 7 attack types', () => {
            expect(Object.keys(ATTACK_TYPES)).toHaveLength(7);
        });
        it('all have required fields', () => {
            for (const [key, info] of Object.entries(ATTACK_TYPES)) {
                expect(info).toHaveProperty('name');
                expect(info).toHaveProperty('severity');
                expect(info).toHaveProperty('color');
                expect(info).toHaveProperty('points');
            }
        });
    });
});
