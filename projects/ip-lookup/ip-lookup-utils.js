/* IP Lookup Utilities — Pure Functions Module */

export function validateIpv4(ip) {
    if (!ip || typeof ip !== 'string') return false;
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => { const n = parseInt(p,10); return !isNaN(n) && n >= 0 && n <= 255 && p === String(n); });
}

export function expandIPv6(addr) {
    let groups = addr.split('::');
    let left = groups[0] ? groups[0].split(':') : [];
    let right = groups.length > 1 && groups[1] ? groups[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const middle = Array(Math.max(0, missing)).fill('0000');
    return [...left, ...middle, ...right].map(g => g.padStart(4, '0')).slice(0, 8).join(':');
}

export function validateIpv6(addr) {
    if (!addr || typeof addr !== 'string') return false;
    return /^([0-9a-f]{4}:){7}[0-9a-f]{4}$/i.test(expandIPv6(addr));
}

export function validateIp(ip) { return validateIpv4(ip) || validateIpv6(ip); }

export function ipToInt(ip) { return ip.split('.').reduce((a,o) => (a<<8)+parseInt(o),0)>>>0; }
export function intToIp(n) { return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.'); }

export function getIpClass(ip) {
    const f = parseInt(ip.split('.')[0]);
    if (f < 128) return { cls:'A', range:'0.0.0.0 - 127.255.255.255', defaultMask:'/8' };
    if (f < 192) return { cls:'B', range:'128.0.0.0 - 191.255.255.255', defaultMask:'/16' };
    if (f < 224) return { cls:'C', range:'192.0.0.0 - 223.255.255.255', defaultMask:'/24' };
    if (f < 240) return { cls:'D', range:'224.0.0.0 - 239.255.255.255', defaultMask:'N/A (Multicast)' };
    return { cls:'E', range:'240.0.0.0 - 255.255.255.255', defaultMask:'N/A (Reserved)' };
}

export function isPrivateIp(ip) {
    const n = ipToInt(ip);
    return (n>=ipToInt('10.0.0.0')&&n<=ipToInt('10.255.255.255'))||
           (n>=ipToInt('172.16.0.0')&&n<=ipToInt('172.31.255.255'))||
           (n>=ipToInt('192.168.0.0')&&n<=ipToInt('192.168.255.255'));
}

export function isLoopback(ip) { return ip.startsWith('127.'); }
export function isLinkLocal(ip) { const n=ipToInt(ip); return n>=ipToInt('169.254.0.0')&&n<=ipToInt('169.254.255.255'); }

export function parseCidrRange(cidr) {
    if (!cidr || typeof cidr !== 'string') return null;
    const m = cidr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
    if (!m || !validateIpv4(m[1])) return null;
    const prefix = parseInt(m[2],10);
    if (prefix < 0 || prefix > 32) return null;
    const mask = prefix===0?0:(0xFFFFFFFF<<(32-prefix))>>>0;
    const net = (ipToInt(m[1])&mask)>>>0;
    const bcast = (net|(~mask>>>0))>>>0;
    const total = Math.pow(2,32-prefix);
    return { ip:m[1], prefix, network:intToIp(net), broadcast:intToIp(bcast),
        firstHost:intToIp((net+1)>>>0), lastHost:intToIp((bcast-1)>>>0),
        totalHosts:total, usableHosts:Math.max(0,total-2), mask:intToIp(mask) };
}

export function formatIpData(data) {
    if (!data) return null;
    return { ip:data.ip||'--', city:data.city||'Unknown City', region:data.region||'',
        country:`${data.country_name||'Unknown'} ${data.country_code?`(${data.country_code})`:''}`.trim(),
        asn:data.asn||'--', org:data.org||'--', timezone:data.timezone||'--', postal:data.postal||'--',
        coords: data.latitude&&data.longitude ? `Lat: ${data.latitude}, Lng: ${data.longitude}` : 'N/A',
        latitude:data.latitude||null, longitude:data.longitude||null };
}

export function ipToBinary(ip) { return ip.split('.').map(o=>parseInt(o).toString(2).padStart(8,'0')).join('.'); }
export function ipToHex(ip) { return ip.split('.').map(o=>parseInt(o).toString(16).padStart(2,'0')).join(':'); }
export function reverseDns(ip) { return ip.split('.').reverse().join('.')+'.in-addr.arpa'; }

export function parseBatchInput(input) {
    if (!input || typeof input !== 'string') return [];
    return input.split(/[,;\n]+/).map(s=>s.trim())
        .filter(s => s.length>0 && (validateIpv4(s)||validateIpv6(s)||/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s)));
}

export function calcThreatScore(data) {
    let score = 0;
    if (!data) return { score:0, label:'Unknown', color:'#94a3b8' };
    const hostingAsns = ['AS13335','AS16509','AS14061','AS20473','AS63949'];
    if (data.asn && hostingAsns.some(a=>data.asn.includes(a))) score += 15;
    const vpnOrgs = ['mullvad','nordvpn','expressvpn','proton','tor'];
    if (data.org && vpnOrgs.some(v=>data.org.toLowerCase().includes(v))) score += 30;
    if (score >= 40) return { score, label:'Suspicious', color:'#f97316' };
    if (score >= 20) return { score, label:'Low Risk', color:'#fbbf24' };
    return { score, label:'Clean', color:'#4ade80' };
}
