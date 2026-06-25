import { describe, it, expect } from 'vitest';
import {
    ipToInt, intToIp, isValidIp, getIpClass, isPrivateIp, calcSubnet,
    expandIPv6, compressIPv6, isValidIPv6, getIPv6Type,
    lookupMac, formatBandwidth, calcBandwidth, PORT_REFERENCE, lookupPort, formatTime
} from '../projects/network-tools/network-tools-utils.js';

// ═══════ IP CONVERSION ═══════
describe('ipToInt/intToIp', () => {
    it('0.0.0.0 = 0', () => expect(ipToInt('0.0.0.0')).toBe(0));
    it('255.255.255.255 = 4294967295', () => expect(ipToInt('255.255.255.255')).toBe(4294967295));
    it('round-trips 192.168.1.1', () => expect(intToIp(ipToInt('192.168.1.1'))).toBe('192.168.1.1'));
    it('round-trips 10.0.0.1', () => expect(intToIp(ipToInt('10.0.0.1'))).toBe('10.0.0.1'));
    it('round-trips 172.16.255.254', () => expect(intToIp(ipToInt('172.16.255.254'))).toBe('172.16.255.254'));
});

// ═══════ IP VALIDATION ═══════
describe('isValidIp()', () => {
    it('accepts valid', () => { expect(isValidIp('192.168.1.1')).toBe(true); expect(isValidIp('0.0.0.0')).toBe(true); });
    it('rejects invalid', () => { expect(isValidIp('256.0.0.0')).toBe(false); expect(isValidIp('abc')).toBe(false); expect(isValidIp(null)).toBe(false); expect(isValidIp('')).toBe(false); });
    it('rejects leading zeros', () => expect(isValidIp('01.02.03.04')).toBe(false));
    it('rejects extra octets', () => expect(isValidIp('1.2.3.4.5')).toBe(false));
});

// ═══════ IP CLASS ═══════
describe('getIpClass()', () => {
    it('A for 10.x', () => expect(getIpClass('10.0.0.1').cls).toBe('A'));
    it('B for 172.x', () => expect(getIpClass('172.16.0.1').cls).toBe('B'));
    it('C for 192.x', () => expect(getIpClass('192.168.1.1').cls).toBe('C'));
    it('D for 224.x', () => expect(getIpClass('224.0.0.1').cls).toBe('D'));
    it('E for 240.x', () => expect(getIpClass('240.0.0.1').cls).toBe('E'));
    it('A for 0.x', () => expect(getIpClass('0.0.0.0').cls).toBe('A'));
    it('A for 127.x', () => expect(getIpClass('127.0.0.1').cls).toBe('A'));
});

// ═══════ PRIVATE IP ═══════
describe('isPrivateIp()', () => {
    it('10.x is private', () => expect(isPrivateIp('10.0.0.1')).toBe(true));
    it('10.255.255.255 is private', () => expect(isPrivateIp('10.255.255.255')).toBe(true));
    it('172.16-31 is private', () => { expect(isPrivateIp('172.16.0.1')).toBe(true); expect(isPrivateIp('172.31.255.254')).toBe(true); });
    it('172.32 is public', () => expect(isPrivateIp('172.32.0.1')).toBe(false));
    it('192.168.x is private', () => expect(isPrivateIp('192.168.0.1')).toBe(true));
    it('8.8.8.8 is public', () => expect(isPrivateIp('8.8.8.8')).toBe(false));
});

// ═══════ SUBNET CALC ═══════
describe('calcSubnet()', () => {
    it('/24 has 254 usable', () => { const s=calcSubnet('192.168.1.0',24); expect(s.usableHosts).toBe(254); expect(s.network).toBe('192.168.1.0'); expect(s.broadcast).toBe('192.168.1.255'); });
    it('/32 has 0 usable', () => { const s=calcSubnet('10.0.0.1',32); expect(s.totalHosts).toBe(1); });
    it('/8 has 16M+ hosts', () => { const s=calcSubnet('10.0.0.0',8); expect(s.totalHosts).toBe(16777216); });
    it('/16 mask correct', () => expect(calcSubnet('172.16.0.0',16).mask).toBe('255.255.0.0'));
    it('/0 covers all', () => { const s=calcSubnet('0.0.0.0',0); expect(s.totalHosts).toBe(4294967296); });
    it('first/last hosts correct for /24', () => { const s=calcSubnet('192.168.1.0',24); expect(s.firstHost).toBe('192.168.1.1'); expect(s.lastHost).toBe('192.168.1.254'); });
});

// ═══════ IPv6 ═══════
describe('expandIPv6()', () => {
    it('expands ::1', () => expect(expandIPv6('::1')).toBe('0000:0000:0000:0000:0000:0000:0000:0001'));
    it('expands ::', () => expect(expandIPv6('::')).toBe('0000:0000:0000:0000:0000:0000:0000:0000'));
    it('expands fe80::1', () => { const r=expandIPv6('fe80::1'); expect(r.startsWith('fe80')).toBe(true); expect(r.split(':')).toHaveLength(8); });
    it('preserves full address', () => expect(expandIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe('2001:0db8:0000:0000:0000:0000:0000:0001'));
});

describe('compressIPv6()', () => {
    it('compresses all-zero groups', () => { const r=compressIPv6('0000:0000:0000:0000:0000:0000:0000:0001'); expect(r).toContain('::'); });
    it('compresses loopback', () => { const r=compressIPv6('0000:0000:0000:0000:0000:0000:0000:0001'); expect(r).toContain('::'); expect(r).toContain('01'); });
    it('no compression when no consecutive zeros', () => { const r=compressIPv6('2001:0db8:0001:0002:0003:0004:0005:0006'); expect(r).not.toContain('::'); });
});

describe('isValidIPv6()', () => {
    it('accepts ::1', () => expect(isValidIPv6('::1')).toBe(true));
    it('rejects garbage', () => expect(isValidIPv6('not-ipv6')).toBe(false));
    it('rejects null', () => expect(isValidIPv6(null)).toBe(false));
});

describe('getIPv6Type()', () => {
    it('loopback for ::1', () => expect(getIPv6Type('::1')).toBe('Loopback'));
    it('unspecified for ::', () => expect(getIPv6Type('::')).toBe('Unspecified'));
    it('link-local for fe80::', () => expect(getIPv6Type('fe80::1')).toBe('Link-Local'));
    it('multicast for ff02::', () => expect(getIPv6Type('ff02::1')).toBe('Multicast'));
    it('unique local for fd00::', () => expect(getIPv6Type('fd00::1')).toBe('Unique Local'));
    it('global unicast for 2001::', () => expect(getIPv6Type('2001:db8::1')).toBe('Global Unicast'));
});

// ═══════ MAC LOOKUP ═══════
describe('lookupMac()', () => {
    it('finds VMware', () => { const r=lookupMac('00:50:56:12:34:56'); expect(r.vendor).toBe('VMware'); });
    it('returns Unknown for unknown', () => { const r=lookupMac('AA:BB:CC:DD:EE:FF'); expect(r.vendor).toBe('Unknown Vendor'); });
    it('handles dash-separated', () => { const r=lookupMac('00-50-56-12-34-56'); expect(r.valid).toBe(true); });
    it('rejects invalid format', () => { const r=lookupMac('invalid'); expect(r.valid).toBe(false); });
    it('returns null for null', () => expect(lookupMac(null)).toBeNull());
    it('normalizes to uppercase', () => expect(lookupMac('00:50:56:ab:cd:ef').formatted).toBe('00:50:56:AB:CD:EF'));
});

// ═══════ BANDWIDTH ═══════
describe('formatBandwidth()', () => {
    it('formats Tbps', () => expect(formatBandwidth(1.5e12)).toContain('Tbps'));
    it('formats Gbps', () => expect(formatBandwidth(1e9)).toContain('Gbps'));
    it('formats Mbps', () => expect(formatBandwidth(1e6)).toContain('Mbps'));
    it('formats Kbps', () => expect(formatBandwidth(1e3)).toContain('Kbps'));
    it('formats bps', () => expect(formatBandwidth(500)).toContain('bps'));
});

describe('calcBandwidth()', () => {
    it('calculates MB in seconds', () => { const r=calcBandwidth(100,'MB',1,'s'); expect(r.Bps).toBe(100*1024*1024); });
    it('returns null for zero time', () => expect(calcBandwidth(100,'MB',0,'s')).toBeNull());
    it('handles GB', () => { const r=calcBandwidth(1,'GB',8,'s'); expect(r.bps).toBeGreaterThan(1e9); });
});

// ═══════ PORT LOOKUP ═══════
describe('lookupPort()', () => {
    it('HTTP is port 80', () => expect(lookupPort(80).service).toBe('HTTP'));
    it('HTTPS is port 443', () => expect(lookupPort(443).service).toBe('HTTPS'));
    it('SSH is port 22', () => expect(lookupPort(22).service).toBe('SSH'));
    it('unknown port', () => expect(lookupPort(12345).service).toBe('Unknown'));
    it('well-known range', () => expect(lookupPort(80).range).toBe('Well-known'));
    it('registered range', () => expect(lookupPort(8080).range).toBe('Registered'));
    it('dynamic range', () => expect(lookupPort(50000).range).toBe('Dynamic'));
    it('invalid port', () => expect(lookupPort(-1)).toBeNull());
    it('over 65535', () => expect(lookupPort(70000)).toBeNull());
});

// ═══════ FORMAT TIME ═══════
describe('formatTime()', () => {
    it('formats seconds', () => expect(formatTime(30)).toBe('30.0s'));
    it('formats minutes', () => expect(formatTime(90)).toContain('m'));
    it('formats hours', () => expect(formatTime(7200)).toContain('h'));
});
