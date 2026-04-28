import { describe, it, expect } from 'vitest';
import {
    validateIpv4, validateIpv6, validateIp, expandIPv6, ipToInt, intToIp,
    getIpClass, isPrivateIp, isLoopback, isLinkLocal, parseCidrRange,
    formatIpData, ipToBinary, ipToHex, reverseDns, parseBatchInput, calcThreatScore
} from '../projects/ip-lookup/ip-lookup-utils.js';

// ═══════ IPv4 VALIDATION ═══════
describe('validateIpv4()', () => {
    it('accepts valid IPs', () => { expect(validateIpv4('192.168.1.1')).toBe(true); expect(validateIpv4('0.0.0.0')).toBe(true); expect(validateIpv4('255.255.255.255')).toBe(true); });
    it('rejects invalid IPs', () => { expect(validateIpv4('256.1.1.1')).toBe(false); expect(validateIpv4('1.2.3')).toBe(false); expect(validateIpv4('abc')).toBe(false); });
    it('rejects leading zeros', () => expect(validateIpv4('01.02.03.04')).toBe(false));
    it('rejects null/undefined', () => { expect(validateIpv4(null)).toBe(false); expect(validateIpv4(undefined)).toBe(false); });
    it('rejects empty string', () => expect(validateIpv4('')).toBe(false));
    it('rejects negative octets', () => expect(validateIpv4('-1.0.0.0')).toBe(false));
    it('rejects non-string', () => expect(validateIpv4(123)).toBe(false));
});

// ═══════ IPv6 ═══════
describe('expandIPv6()', () => {
    it('expands :: to full', () => expect(expandIPv6('::1')).toBe('0000:0000:0000:0000:0000:0000:0000:0001'));
    it('expands full address', () => expect(expandIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe('2001:0db8:0000:0000:0000:0000:0000:0001'));
    it('expands partial shorthand', () => { const r=expandIPv6('fe80::1'); expect(r.split(':')).toHaveLength(8); });
});

describe('validateIpv6()', () => {
    it('accepts valid IPv6', () => expect(validateIpv6('::1')).toBe(true));
    it('accepts full IPv6', () => expect(validateIpv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(true));
    it('rejects invalid', () => { expect(validateIpv6('not-ipv6')).toBe(false); expect(validateIpv6(null)).toBe(false); });
});

describe('validateIp()', () => {
    it('accepts IPv4', () => expect(validateIp('8.8.8.8')).toBe(true));
    it('accepts IPv6', () => expect(validateIp('::1')).toBe(true));
    it('rejects garbage', () => expect(validateIp('hello')).toBe(false));
});

// ═══════ IP CONVERSION ═══════
describe('ipToInt/intToIp', () => {
    it('converts 0.0.0.0', () => expect(ipToInt('0.0.0.0')).toBe(0));
    it('converts 255.255.255.255', () => expect(ipToInt('255.255.255.255')).toBe(4294967295));
    it('round-trips correctly', () => expect(intToIp(ipToInt('192.168.1.1'))).toBe('192.168.1.1'));
    it('converts 10.0.0.1', () => expect(intToIp(ipToInt('10.0.0.1'))).toBe('10.0.0.1'));
});

// ═══════ IP CLASS ═══════
describe('getIpClass()', () => {
    it('Class A for <128', () => expect(getIpClass('10.0.0.1').cls).toBe('A'));
    it('Class B for 128-191', () => expect(getIpClass('172.16.0.1').cls).toBe('B'));
    it('Class C for 192-223', () => expect(getIpClass('192.168.1.1').cls).toBe('C'));
    it('Class D for 224-239', () => expect(getIpClass('224.0.0.1').cls).toBe('D'));
    it('Class E for 240+', () => expect(getIpClass('240.0.0.1').cls).toBe('E'));
    it('includes range info', () => expect(getIpClass('10.0.0.1').range).toBeDefined());
});

// ═══════ PRIVATE/SPECIAL ═══════
describe('isPrivateIp()', () => {
    it('10.x.x.x is private', () => expect(isPrivateIp('10.0.0.1')).toBe(true));
    it('172.16.x.x is private', () => expect(isPrivateIp('172.16.0.1')).toBe(true));
    it('192.168.x.x is private', () => expect(isPrivateIp('192.168.1.1')).toBe(true));
    it('8.8.8.8 is public', () => expect(isPrivateIp('8.8.8.8')).toBe(false));
    it('172.32 is public', () => expect(isPrivateIp('172.32.0.1')).toBe(false));
});

describe('isLoopback()', () => {
    it('127.0.0.1 is loopback', () => expect(isLoopback('127.0.0.1')).toBe(true));
    it('127.255.0.1 is loopback', () => expect(isLoopback('127.255.0.1')).toBe(true));
    it('128.0.0.1 is not loopback', () => expect(isLoopback('128.0.0.1')).toBe(false));
});

describe('isLinkLocal()', () => {
    it('169.254.x.x is link-local', () => expect(isLinkLocal('169.254.1.1')).toBe(true));
    it('169.255.0.0 is not link-local', () => expect(isLinkLocal('169.255.0.0')).toBe(false));
});

// ═══════ CIDR ═══════
describe('parseCidrRange()', () => {
    it('parses /24', () => { const r=parseCidrRange('192.168.1.0/24'); expect(r.network).toBe('192.168.1.0'); expect(r.broadcast).toBe('192.168.1.255'); expect(r.usableHosts).toBe(254); });
    it('parses /32', () => { const r=parseCidrRange('10.0.0.1/32'); expect(r.totalHosts).toBe(1); });
    it('parses /16', () => { const r=parseCidrRange('172.16.0.0/16'); expect(r.usableHosts).toBe(65534); });
    it('returns null for invalid', () => { expect(parseCidrRange('invalid')).toBeNull(); expect(parseCidrRange(null)).toBeNull(); });
    it('returns null for bad prefix', () => expect(parseCidrRange('10.0.0.0/33')).toBeNull());
    it('includes mask', () => expect(parseCidrRange('10.0.0.0/8').mask).toBe('255.0.0.0'));
});

// ═══════ FORMAT ═══════
describe('formatIpData()', () => {
    it('formats complete data', () => { const r=formatIpData({ip:'8.8.8.8',city:'Mountain View',country_name:'US',country_code:'US',org:'Google'}); expect(r.ip).toBe('8.8.8.8'); expect(r.city).toBe('Mountain View'); });
    it('handles missing fields', () => { const r=formatIpData({}); expect(r.ip).toBe('--'); expect(r.city).toBe('Unknown City'); });
    it('returns null for null input', () => expect(formatIpData(null)).toBeNull());
});

describe('ipToBinary()', () => {
    it('converts correctly', () => expect(ipToBinary('192.168.1.1')).toBe('11000000.10101000.00000001.00000001'));
    it('converts 0.0.0.0', () => expect(ipToBinary('0.0.0.0')).toBe('00000000.00000000.00000000.00000000'));
});

describe('ipToHex()', () => {
    it('converts correctly', () => expect(ipToHex('192.168.1.1')).toBe('c0:a8:01:01'));
});

describe('reverseDns()', () => {
    it('reverses correctly', () => expect(reverseDns('8.8.4.4')).toBe('4.4.8.8.in-addr.arpa'));
});

// ═══════ BATCH ═══════
describe('parseBatchInput()', () => {
    it('parses comma-separated IPs', () => expect(parseBatchInput('8.8.8.8,1.1.1.1')).toHaveLength(2));
    it('parses newline-separated', () => expect(parseBatchInput('8.8.8.8\n1.1.1.1')).toHaveLength(2));
    it('filters invalid entries', () => expect(parseBatchInput('8.8.8.8,invalid,1.1.1.1')).toHaveLength(2));
    it('accepts domains', () => expect(parseBatchInput('google.com')).toHaveLength(1));
    it('returns empty for null', () => expect(parseBatchInput(null)).toHaveLength(0));
});

// ═══════ THREAT SCORE ═══════
describe('calcThreatScore()', () => {
    it('clean for normal IP', () => expect(calcThreatScore({org:'Comcast',asn:'AS7922'}).label).toBe('Clean'));
    it('scores hosting ASNs', () => { const r=calcThreatScore({asn:'AS13335'}); expect(r.score).toBe(15); });
    it('flags VPN providers', () => expect(calcThreatScore({org:'Mullvad VPN',asn:'AS12345'}).label).toBe('Low Risk'));
    it('flags combined risk', () => expect(calcThreatScore({org:'NordVPN',asn:'AS16509'}).label).toBe('Suspicious'));
    it('handles null data', () => expect(calcThreatScore(null).label).toBe('Unknown'));
});
