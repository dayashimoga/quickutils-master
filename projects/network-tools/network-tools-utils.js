/* Network Tools Utilities — Pure Functions Module */

export function ipToInt(ip) { return ip.split('.').reduce((a,o)=>(a<<8)+parseInt(o),0)>>>0; }
export function intToIp(n) { return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.'); }

export function isValidIp(ip) {
    if (!ip||typeof ip!=='string') return false;
    const p=ip.split('.'); if(p.length!==4) return false;
    return p.every(o=>{const n=parseInt(o,10);return !isNaN(n)&&n>=0&&n<=255&&o===String(n);});
}

export function getIpClass(ip) {
    const f=parseInt(ip.split('.')[0]);
    if(f<128)return {cls:'A', range:'1.0.0.0 - 126.255.255.255', defaultMask:'/8'};
    if(f<192)return {cls:'B', range:'128.0.0.0 - 191.255.255.255', defaultMask:'/16'};
    if(f<224)return {cls:'C', range:'192.0.0.0 - 223.255.255.255', defaultMask:'/24'};
    if(f<240)return {cls:'D', range:'224.0.0.0 - 239.255.255.255', defaultMask:'N/A'};
    return {cls:'E', range:'240.0.0.0 - 255.255.255.255', defaultMask:'N/A'};
}

export function isPrivateIp(ip) {
    const n=ipToInt(ip);
    return (n>=ipToInt('10.0.0.0')&&n<=ipToInt('10.255.255.255'))||
           (n>=ipToInt('172.16.0.0')&&n<=ipToInt('172.31.255.255'))||
           (n>=ipToInt('192.168.0.0')&&n<=ipToInt('192.168.255.255'));
}

export function calcSubnet(ip,prefix) {
    const mask=prefix===0?0:(0xFFFFFFFF<<(32-prefix))>>>0;
    const net=(ipToInt(ip)&mask)>>>0; const bcast=(net|(~mask>>>0))>>>0;
    const total=Math.pow(2,32-prefix);
    return { network:intToIp(net), broadcast:intToIp(bcast), mask:intToIp(mask),
        firstHost:intToIp((net+1)>>>0), lastHost:intToIp((bcast-1)>>>0),
        totalHosts:total, usableHosts:Math.max(0,total-2) };
}

export function expandIPv6(addr) {
    let g=addr.split('::'), l=g[0]?g[0].split(':'):[],
        r=g.length>1&&g[1]?g[1].split(':'):[];
    const m=Array(Math.max(0,8-l.length-r.length)).fill('0000');
    return [...l,...m,...r].map(x=>x.padStart(4,'0')).slice(0,8).join(':');
}

export function compressIPv6(full) {
    const groups=full.split(':').map(g=>g.replace(/^0+/,'0').replace(/^0$/,'0'));
    let best={start:-1,len:0},cur={start:-1,len:0};
    groups.forEach((g,i)=>{
        if(g==='0'){if(cur.start<0)cur.start=i;cur.len++;}
        else{if(cur.len>best.len)best={...cur};cur={start:-1,len:0};}
    });
    if(cur.len>best.len)best={...cur};
    if(best.len<2) return groups.join(':');
    const left=groups.slice(0,best.start), right=groups.slice(best.start+best.len);
    return (left.length?left.join(':'):'') + '::' + (right.length?right.join(':'):'');
}

export function isValidIPv6(addr) {
    if(!addr||typeof addr!=='string') return false;
    return /^([0-9a-f]{4}:){7}[0-9a-f]{4}$/i.test(expandIPv6(addr));
}

export function getIPv6Type(addr) {
    const exp=expandIPv6(addr).toLowerCase();
    if(exp.startsWith('fe80'))return'Link-Local';
    if(exp.startsWith('fc')||exp.startsWith('fd'))return'Unique Local';
    if(exp.startsWith('ff'))return'Multicast';
    if(exp==='0000:0000:0000:0000:0000:0000:0000:0001')return'Loopback';
    if(exp==='0000:0000:0000:0000:0000:0000:0000:0000')return'Unspecified';
    return'Global Unicast';
}

// MAC address OUI lookup (sample database)
const OUI_DB = {
    '00:50:56':'VMware','00:0C:29':'VMware','00:1A:11':'Google','3C:22:FB':'Apple',
    'A4:83:E7':'Apple','F8:FF:C2':'Apple','00:15:5D':'Microsoft Hyper-V',
    '00:1B:21':'Intel','00:1E:67':'Intel','B4:96:91':'Intel',
    'DC:A6:32':'Raspberry Pi','B8:27:EB':'Raspberry Pi',
    '00:1A:2B':'Ayecom','F0:DE:F1':'Samsung','00:26:37':'Samsung',
};

export function lookupMac(mac) {
    if(!mac||typeof mac!=='string') return null;
    const clean=mac.replace(/[-.:]/g,':').toUpperCase();
    const parts=clean.split(':');
    if(parts.length!==6||!parts.every(p=>/^[0-9A-F]{2}$/.test(p))) return { valid:false };
    const prefix=parts.slice(0,3).join(':');
    return { valid:true, prefix, vendor:OUI_DB[prefix]||'Unknown Vendor', formatted:parts.join(':') };
}

export function formatBandwidth(bits) {
    if(bits>=1e12) return (bits/1e12).toFixed(2)+' Tbps';
    if(bits>=1e9) return (bits/1e9).toFixed(2)+' Gbps';
    if(bits>=1e6) return (bits/1e6).toFixed(2)+' Mbps';
    if(bits>=1e3) return (bits/1e3).toFixed(2)+' Kbps';
    return bits+' bps';
}

export function calcBandwidth(fileSize, fileSizeUnit, time, timeUnit) {
    const sizeMultipliers = { B:1, KB:1024, MB:1024**2, GB:1024**3, TB:1024**4 };
    const timeMultipliers = { ms:0.001, s:1, min:60, hr:3600 };
    const bytes = fileSize * (sizeMultipliers[fileSizeUnit]||1);
    const seconds = time * (timeMultipliers[timeUnit]||1);
    if(seconds<=0) return null;
    return { bps:(bytes*8)/seconds, Bps:bytes/seconds };
}

// Common port reference
export const PORT_REFERENCE = {
    21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',80:'HTTP',110:'POP3',
    143:'IMAP',443:'HTTPS',993:'IMAPS',995:'POP3S',3306:'MySQL',
    5432:'PostgreSQL',6379:'Redis',8080:'HTTP-Alt',27017:'MongoDB',
};

export function lookupPort(port) {
    const p = parseInt(port,10);
    if(isNaN(p)||p<0||p>65535) return null;
    return { port:p, service:PORT_REFERENCE[p]||'Unknown', range:p<1024?'Well-known':p<49152?'Registered':'Dynamic' };
}

export function formatTime(seconds) {
    if(seconds<60)return `${seconds.toFixed(1)}s`;
    if(seconds<3600)return `${Math.floor(seconds/60)}m ${Math.round(seconds%60)}s`;
    return `${Math.floor(seconds/3600)}h ${Math.floor((seconds%3600)/60)}m`;
}
