/* Network Tools - Full Implementation */
'use strict';
(function(){
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Tab switching
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.tool-panel').forEach(p => p.classList.add('hidden'));
    $(`#panel-${btn.dataset.tool}`).classList.remove('hidden');
  });
});

// ── IP INFO ──
function ipToInt(ip) { return ip.split('.').reduce((a,o)=>(a<<8)+parseInt(o),0)>>>0; }
function intToIp(n) { return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.'); }
function isValidIp(ip) { const p=ip.split('.'); return p.length===4&&p.every(o=>{const n=parseInt(o);return !isNaN(n)&&n>=0&&n<=255&&o===String(n);}); }

function getIpClass(ip) {
  const f = parseInt(ip.split('.')[0]);
  if(f<128) return {cls:'A',range:'0.0.0.0 - 127.255.255.255',defaultMask:'/8'};
  if(f<192) return {cls:'B',range:'128.0.0.0 - 191.255.255.255',defaultMask:'/16'};
  if(f<224) return {cls:'C',range:'192.0.0.0 - 223.255.255.255',defaultMask:'/24'};
  if(f<240) return {cls:'D',range:'224.0.0.0 - 239.255.255.255',defaultMask:'N/A (Multicast)'};
  return {cls:'E',range:'240.0.0.0 - 255.255.255.255',defaultMask:'N/A (Reserved)'};
}

function isPrivateIp(ip) {
  const n = ipToInt(ip);
  return (n>=ipToInt('10.0.0.0')&&n<=ipToInt('10.255.255.255'))||
         (n>=ipToInt('172.16.0.0')&&n<=ipToInt('172.31.255.255'))||
         (n>=ipToInt('192.168.0.0')&&n<=ipToInt('192.168.255.255'));
}

function lookupIp(ip) {
  if(!isValidIp(ip)) { if(typeof QU!=='undefined') QU.showToast('Invalid IP address','error'); return; }
  const info = getIpClass(ip);
  const priv = isPrivateIp(ip);
  const binary = ip.split('.').map(o=>parseInt(o).toString(2).padStart(8,'0')).join('.');
  const hex = ip.split('.').map(o=>parseInt(o).toString(16).padStart(2,'0')).join(':');
  const int = ipToInt(ip);
  const results = [
    {label:'IP Address',value:ip,hl:true},{label:'Class',value:info.cls},{label:'Class Range',value:info.range},
    {label:'Default Mask',value:info.defaultMask},{label:'Type',value:priv?'Private':'Public'},
    {label:'Binary',value:binary},{label:'Hexadecimal',value:'0x'+hex},{label:'Integer',value:int.toString()},
    {label:'Reverse DNS',value:ip.split('.').reverse().join('.')+'.in-addr.arpa'}
  ];
  $('#ipResults').innerHTML = results.map(r=>`<div class="result-card"><div class="rc-label">${r.label}</div><div class="rc-value${r.hl?' highlight':''}">${r.value}</div></div>`).join('');
}

$('#ipLookupBtn').addEventListener('click', ()=>lookupIp($('#ipInput').value.trim()));
$('#ipInput').addEventListener('keydown', e=>{if(e.key==='Enter')lookupIp($('#ipInput').value.trim());});
$('#myIpInfo').innerHTML = [
  {label:'User Agent',value:navigator.userAgent.substring(0,60)+'...'},
  {label:'Language',value:navigator.language},{label:'Platform',value:navigator.platform||'N/A'},
  {label:'Online',value:navigator.onLine?'Yes':'No'},{label:'Cookies',value:navigator.cookieEnabled?'Enabled':'Disabled'}
].map(r=>`<div class="result-card"><div class="rc-label">${r.label}</div><div class="rc-value">${r.value}</div></div>`).join('');

// ── SUBNET CALCULATOR ──
const maskSel = $('#subnetMask');
for(let i=0;i<=32;i++){
  const bits = i===0?0:(0xFFFFFFFF<<(32-i))>>>0;
  const hosts = i>=31?((i===32?1:2)):(Math.pow(2,32-i)-2);
  maskSel.innerHTML += `<option value="${i}">/${i} — ${intToIp(bits)} (${i<31?hosts+' hosts':i===31?'2 addresses':'1 address'})</option>`;
}
maskSel.value = '24';

$('#subnetCalcBtn').addEventListener('click', ()=>{
  const ip = $('#subnetIp').value.trim();
  const cidr = parseInt(maskSel.value);
  if(!isValidIp(ip)) { if(typeof QU!=='undefined') QU.showToast('Invalid IP','error'); return; }
  const mask = cidr===0?0:(0xFFFFFFFF<<(32-cidr))>>>0;
  const net = (ipToInt(ip)&mask)>>>0;
  const bcast = (net|(~mask>>>0))>>>0;
  const first = cidr>=31?net:(net+1)>>>0;
  const last = cidr>=31?bcast:(bcast-1)>>>0;
  const hosts = cidr>=31?(cidr===32?1:2):((bcast-net-1));
  const wildcard = (~mask)>>>0;
  const results = [
    {label:'Network',value:intToIp(net)+'/'+cidr,hl:true},{label:'Subnet Mask',value:intToIp(mask)},
    {label:'Wildcard',value:intToIp(wildcard)},{label:'Broadcast',value:intToIp(bcast)},
    {label:'First Host',value:intToIp(first)},{label:'Last Host',value:intToIp(last)},
    {label:'Total Hosts',value:hosts.toLocaleString()},{label:'IP Class',value:getIpClass(ip).cls},
    {label:'Type',value:isPrivateIp(ip)?'Private':'Public'}
  ];
  $('#subnetResults').innerHTML = results.map(r=>`<div class="result-card"><div class="rc-label">${r.label}</div><div class="rc-value${r.hl?' highlight':''}">${r.value}</div></div>`).join('');
  const ipBin = ipToInt(ip).toString(2).padStart(32,'0');
  $('#subnetVisual').innerHTML = `<div><strong>Network bits:</strong> <span style="color:var(--accent)">${ipBin.substring(0,cidr)}</span><span style="color:var(--text-muted)">${ipBin.substring(cidr)}</span></div><div style="margin-top:0.5rem"><strong>Network:</strong> ${intToIp(net)} → <strong>Broadcast:</strong> ${intToIp(bcast)}</div>`;
});

// ── DNS LOOKUP ──
const DNS_RECORDS = {
  'example.com':[{type:'A',value:'93.184.216.34',ttl:3600},{type:'AAAA',value:'2606:2800:220:1:248:1893:25c8:1946',ttl:3600},{type:'MX',value:'10 mail.example.com',ttl:3600},{type:'NS',value:'a.iana-servers.net',ttl:86400},{type:'TXT',value:'"v=spf1 -all"',ttl:3600}],
  'google.com':[{type:'A',value:'142.250.80.46',ttl:300},{type:'AAAA',value:'2607:f8b0:4004:800::200e',ttl:300},{type:'MX',value:'10 smtp.google.com',ttl:600},{type:'NS',value:'ns1.google.com',ttl:86400},{type:'TXT',value:'"v=spf1 include:_spf.google.com ~all"',ttl:3600}],
  'github.com':[{type:'A',value:'140.82.121.3',ttl:60},{type:'MX',value:'10 alt1.aspmx.l.google.com',ttl:3600},{type:'NS',value:'dns1.p08.nsone.net',ttl:900},{type:'TXT',value:'"v=spf1 include:_netblocks.google.com ~all"',ttl:3600}],
};

function simulateDns(domain) {
  domain = domain.toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*/,'');
  const records = DNS_RECORDS[domain];
  if(records) {
    $('#dnsResults').innerHTML = `<h3 style="margin:1rem 0 0.5rem">Records for ${domain}</h3>`+records.map(r=>`<div class="dns-record"><span class="type">${r.type}</span> <span style="color:var(--text-muted);font-size:0.75rem">TTL: ${r.ttl}s</span><div class="value">${r.value}</div></div>`).join('');
  } else {
    const fakeIp = [Math.floor(Math.random()*223)+1,Math.floor(Math.random()*255),Math.floor(Math.random()*255),Math.floor(Math.random()*255)].join('.');
    $('#dnsResults').innerHTML = `<h3 style="margin:1rem 0 0.5rem">Simulated Records for ${domain}</h3><div class="dns-record"><span class="type">A</span> <span style="color:var(--text-muted);font-size:0.75rem">TTL: 3600s</span><div class="value">${fakeIp}</div></div><div class="dns-record"><span class="type">NS</span><div class="value">ns1.${domain}</div></div><p style="margin-top:0.75rem;font-size:0.8rem;color:var(--text-muted)">⚠️ These are simulated results. Real DNS lookups require a server-side API.</p>`;
  }
}
$('#dnsLookupBtn').addEventListener('click',()=>simulateDns($('#dnsInput').value.trim()));
$('#dnsInput').addEventListener('keydown',e=>{if(e.key==='Enter')simulateDns($('#dnsInput').value.trim());});

// ── PORT REFERENCE ──
const PORTS = [
  {port:20,service:'FTP Data',proto:'TCP',cat:'file',desc:'File Transfer Protocol data transfer'},
  {port:21,service:'FTP Control',proto:'TCP',cat:'file',desc:'File Transfer Protocol command control'},
  {port:22,service:'SSH',proto:'TCP',cat:'remote',desc:'Secure Shell remote login'},
  {port:23,service:'Telnet',proto:'TCP',cat:'remote',desc:'Unencrypted text communications'},
  {port:25,service:'SMTP',proto:'TCP',cat:'email',desc:'Simple Mail Transfer Protocol'},
  {port:53,service:'DNS',proto:'TCP/UDP',cat:'web',desc:'Domain Name System'},
  {port:67,service:'DHCP Server',proto:'UDP',cat:'web',desc:'Dynamic Host Configuration'},
  {port:68,service:'DHCP Client',proto:'UDP',cat:'web',desc:'Dynamic Host Configuration'},
  {port:80,service:'HTTP',proto:'TCP',cat:'web',desc:'Hypertext Transfer Protocol'},
  {port:110,service:'POP3',proto:'TCP',cat:'email',desc:'Post Office Protocol v3'},
  {port:119,service:'NNTP',proto:'TCP',cat:'web',desc:'Network News Transfer Protocol'},
  {port:123,service:'NTP',proto:'UDP',cat:'web',desc:'Network Time Protocol'},
  {port:143,service:'IMAP',proto:'TCP',cat:'email',desc:'Internet Message Access Protocol'},
  {port:161,service:'SNMP',proto:'UDP',cat:'remote',desc:'Simple Network Management Protocol'},
  {port:194,service:'IRC',proto:'TCP',cat:'web',desc:'Internet Relay Chat'},
  {port:443,service:'HTTPS',proto:'TCP',cat:'web',desc:'HTTP over TLS/SSL'},
  {port:465,service:'SMTPS',proto:'TCP',cat:'email',desc:'SMTP over SSL'},
  {port:514,service:'Syslog',proto:'UDP',cat:'remote',desc:'System Logging Protocol'},
  {port:587,service:'SMTP Submission',proto:'TCP',cat:'email',desc:'Email message submission'},
  {port:993,service:'IMAPS',proto:'TCP',cat:'email',desc:'IMAP over SSL'},
  {port:995,service:'POP3S',proto:'TCP',cat:'email',desc:'POP3 over SSL'},
  {port:1433,service:'MSSQL',proto:'TCP',cat:'db',desc:'Microsoft SQL Server'},
  {port:1521,service:'Oracle DB',proto:'TCP',cat:'db',desc:'Oracle Database'},
  {port:2049,service:'NFS',proto:'TCP',cat:'file',desc:'Network File System'},
  {port:3306,service:'MySQL',proto:'TCP',cat:'db',desc:'MySQL Database'},
  {port:3389,service:'RDP',proto:'TCP',cat:'remote',desc:'Remote Desktop Protocol'},
  {port:5432,service:'PostgreSQL',proto:'TCP',cat:'db',desc:'PostgreSQL Database'},
  {port:5900,service:'VNC',proto:'TCP',cat:'remote',desc:'Virtual Network Computing'},
  {port:6379,service:'Redis',proto:'TCP',cat:'db',desc:'Redis key-value store'},
  {port:8080,service:'HTTP Alt',proto:'TCP',cat:'web',desc:'Alternative HTTP port'},
  {port:8443,service:'HTTPS Alt',proto:'TCP',cat:'web',desc:'Alternative HTTPS port'},
  {port:9200,service:'Elasticsearch',proto:'TCP',cat:'db',desc:'Elasticsearch REST API'},
  {port:27017,service:'MongoDB',proto:'TCP',cat:'db',desc:'MongoDB Database'},
];

function renderPorts(filter='all',search='') {
  const s = search.toLowerCase();
  const filtered = PORTS.filter(p=>(filter==='all'||p.cat===filter)&&(s===''||p.port.toString().includes(s)||p.service.toLowerCase().includes(s)||p.desc.toLowerCase().includes(s)));
  $('#portTable').innerHTML = `<div class="port-row port-header"><span>Port</span><span>Service</span><span>Protocol</span><span>Description</span></div>`+filtered.map(p=>`<div class="port-row"><span class="port-num">${p.port}</span><span>${p.service}</span><span class="port-proto">${p.proto}</span><span class="port-desc">${p.desc}</span></div>`).join('');
}
renderPorts();
$$('.filter-btn').forEach(b=>b.addEventListener('click',()=>{$$('.filter-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderPorts(b.dataset.cat,$('#portSearch').value);}));
$('#portSearch').addEventListener('input',()=>{const active=document.querySelector('.filter-btn.active');renderPorts(active?active.dataset.cat:'all',$('#portSearch').value);});

// ── CIDR ──
$('#cidrCalcBtn').addEventListener('click',()=>{
  const val=$('#cidrInput').value.trim();
  const m=val.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if(!m||!isValidIp(m[1])){if(typeof QU!=='undefined')QU.showToast('Invalid CIDR notation','error');return;}
  const ip=m[1],cidr=parseInt(m[2]);
  if(cidr<0||cidr>32){if(typeof QU!=='undefined')QU.showToast('CIDR must be 0-32','error');return;}
  const mask=cidr===0?0:(0xFFFFFFFF<<(32-cidr))>>>0;
  const net=(ipToInt(ip)&mask)>>>0;
  const bcast=(net|(~mask>>>0))>>>0;
  const total=Math.pow(2,32-cidr);
  const results=[
    {label:'CIDR',value:val,hl:true},{label:'Network',value:intToIp(net)},{label:'Broadcast',value:intToIp(bcast)},
    {label:'Subnet Mask',value:intToIp(mask)},{label:'Total Addresses',value:total.toLocaleString()},
    {label:'Usable Hosts',value:Math.max(0,total-2).toLocaleString()},{label:'First IP',value:intToIp(net+1)},{label:'Last IP',value:intToIp(bcast-1)}
  ];
  $('#cidrResults').innerHTML=results.map(r=>`<div class="result-card"><div class="rc-label">${r.label}</div><div class="rc-value${r.hl?' highlight':''}">${r.value}</div></div>`).join('');
});

// ── HTTP HEADERS ──
const HEADERS = [
  {name:'Accept',desc:'Media types the client can handle',example:'Accept: text/html, application/json'},
  {name:'Authorization',desc:'Credentials for authenticating with the server',example:'Authorization: Bearer eyJhbGci...'},
  {name:'Cache-Control',desc:'Directives for caching mechanisms',example:'Cache-Control: no-cache, no-store'},
  {name:'Content-Type',desc:'Media type of the request/response body',example:'Content-Type: application/json; charset=utf-8'},
  {name:'Cookie',desc:'Previously set cookies sent back to server',example:'Cookie: session=abc123; theme=dark'},
  {name:'CORS Headers',desc:'Cross-Origin Resource Sharing headers',example:'Access-Control-Allow-Origin: *'},
  {name:'ETag',desc:'Identifier for a specific version of a resource',example:'ETag: "33a64df5"'},
  {name:'Host',desc:'Domain name of the server',example:'Host: www.example.com'},
  {name:'If-Modified-Since',desc:'Conditional request based on modification date',example:'If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT'},
  {name:'Location',desc:'URL to redirect to',example:'Location: https://example.com/new-page'},
  {name:'Origin',desc:'Origin of the request (scheme + host + port)',example:'Origin: https://example.com'},
  {name:'Referer',desc:'URL of the page that linked to the resource',example:'Referer: https://example.com/page'},
  {name:'Set-Cookie',desc:'Send cookies from server to client',example:'Set-Cookie: id=a3fWa; Expires=Thu, 31 Oct 2026; Secure; HttpOnly'},
  {name:'User-Agent',desc:'Client application identifier string',example:'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64)'},
  {name:'X-Content-Type-Options',desc:'Prevent MIME type sniffing',example:'X-Content-Type-Options: nosniff'},
  {name:'X-Frame-Options',desc:'Control whether page can be in iframe',example:'X-Frame-Options: DENY'},
  {name:'Strict-Transport-Security',desc:'Force HTTPS connections',example:'Strict-Transport-Security: max-age=31536000; includeSubDomains'},
  {name:'Content-Security-Policy',desc:'Control resources the page can load',example:"Content-Security-Policy: default-src 'self'"},
];

function renderHeaders(search='') {
  const s=search.toLowerCase();
  const filtered=HEADERS.filter(h=>h.name.toLowerCase().includes(s)||h.desc.toLowerCase().includes(s));
  $('#headerList').innerHTML=filtered.map(h=>`<div class="header-item"><div class="h-name">${h.name}</div><div class="h-desc">${h.desc}</div><div class="h-example">${h.example}</div></div>`).join('');
}
renderHeaders();
$('#headerSearch').addEventListener('input',()=>renderHeaders($('#headerSearch').value));

// Init
if(typeof QU!=='undefined') QU.init({kofi:true,discover:true});
lookupIp('192.168.1.1');

// ── IPv6 TOOLS ──
function expandIPv6(addr) {
  let groups = addr.split('::');
  let left = groups[0] ? groups[0].split(':') : [];
  let right = groups.length > 1 && groups[1] ? groups[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  const middle = Array(Math.max(0, missing)).fill('0000');
  const full = [...left, ...middle, ...right].map(g => g.padStart(4, '0'));
  return full.slice(0, 8).join(':');
}

function isValidIPv6(addr) {
  const expanded = expandIPv6(addr);
  return /^([0-9a-f]{4}:){7}[0-9a-f]{4}$/i.test(expanded);
}

function compressIPv6(full) {
  let groups = full.split(':').map(g => g.replace(/^0+/, '') || '0');
  let best = { start: -1, len: 0 }, cur = { start: -1, len: 0 };
  for (let i = 0; i < 8; i++) {
    if (groups[i] === '0') {
      if (cur.start === -1) cur.start = i;
      cur.len++;
      if (cur.len > best.len) { best.start = cur.start; best.len = cur.len; }
    } else { cur = { start: -1, len: 0 }; }
  }
  if (best.len > 1) {
    groups.splice(best.start, best.len, '');
    if (best.start === 0) groups.unshift('');
    if (best.start + best.len === 8) groups.push('');
  }
  return groups.join(':');
}

function getIPv6Type(addr) {
  const expanded = expandIPv6(addr).toLowerCase();
  if (expanded.startsWith('fe80')) return 'Link-Local';
  if (expanded.startsWith('fc') || expanded.startsWith('fd')) return 'Unique Local (Private)';
  if (expanded.startsWith('ff')) return 'Multicast';
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0001') return 'Loopback';
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0000') return 'Unspecified';
  if (expanded.startsWith('2001:0db8')) return 'Documentation';
  if (expanded.startsWith('2001:') || expanded.startsWith('2002:') || expanded.startsWith('2003:')) return 'Global Unicast';
  return 'Global Unicast';
}

$('#ipv6Btn')?.addEventListener('click', () => {
  const addr = $('#ipv6Input').value.trim();
  if (!addr) return;
  const expanded = expandIPv6(addr);
  const valid = isValidIPv6(addr);
  const compressed = compressIPv6(expanded);
  const type = getIPv6Type(addr);
  const binary = expanded.split(':').map(g => parseInt(g, 16).toString(2).padStart(16, '0')).join(' ');
  const results = [
    {label:'Input', value: addr, hl:true},
    {label:'Valid', value: valid ? '✅ Yes' : '❌ No'},
    {label:'Full Form', value: expanded},
    {label:'Compressed', value: compressed},
    {label:'Type', value: type},
    {label:'Prefix (first 64 bits)', value: expanded.split(':').slice(0,4).join(':')+'::'},
    {label:'Interface ID', value: expanded.split(':').slice(4).join(':')},
    {label:'Binary', value: `<span style="font-size:0.65rem;word-break:break-all;">${binary}</span>`}
  ];
  $('#ipv6Results').innerHTML = results.map(r=>`<div class="result-card"><div class="rc-label">${r.label}</div><div class="rc-value${r.hl?' highlight':''}">${r.value}</div></div>`).join('');
});

// ── MAC ADDRESS LOOKUP ──
const OUI_DB = {
  '00:00:0C':'Cisco','00:1A:2B':'Ayecom','00:50:56':'VMware','00:0C:29':'VMware',
  '00:1B:21':'Intel','00:1C:C0':'Intel','00:1E:37':'Universal Global','3C:D9:2B':'HP',
  '00:14:22':'Dell','00:1A:A0':'Dell','F8:BC:12':'Dell','00:25:B5':'Dell',
  'AC:DE:48':'Private','00:26:B9':'Dell','00:0D:56':'Dell','B8:CA:3A':'Dell',
  '00:17:A4':'Global','00:1B:63':'Apple','00:1E:C2':'Apple','3C:15:C2':'Apple',
  'A4:83:E7':'Apple','F0:18:98':'Apple','DC:A4:CA':'Apple','00:03:93':'Apple',
  '00:24:36':'Apple','F4:5C:89':'Apple','00:25:00':'Apple','7C:D1:C3':'Apple',
  '00:1F:F3':'Apple','88:E9:FE':'Apple','A8:86:DD':'Apple','54:26:96':'Apple',
  '00:16:CB':'Apple','D8:9E:3F':'Apple',
  '00:50:B6':'Good Technology','28:CF:E9':'Apple',
  '00:0A:95':'Apple','00:11:24':'Apple','00:14:51':'Apple',
  'B8:27:EB':'Raspberry Pi','DC:A6:32':'Raspberry Pi',
  '00:1A:79':'Brocade','00:05:9A':'Cisco','00:0E:38':'Cisco',
  '00:15:5D':'Microsoft','00:50:F2':'Microsoft','7C:1E:52':'Microsoft',
  'FC:EC:DA':'Ubiquiti','00:27:22':'Ubiquiti','24:A4:3C':'Ubiquiti',
  '00:0E:C6':'ASIX','00:E0:4C':'Realtek','52:54:00':'QEMU/KVM',
  '08:00:27':'Oracle VirtualBox','00:1C:42':'Parallels',
  '00:23:AE':'Dell','00:24:E8':'Dell',
  '00:25:B3':'Hewlett-Packard','00:21:5A':'Hewlett-Packard',
  '00:0F:20':'Hewlett-Packard','3C:D9:2B':'Hewlett-Packard',
  '00:26:55':'Hewlett-Packard',
  'E4:11:5B':'Hewlett-Packard Enterprise',
  '00:E0:81':'Tyan','00:11:25':'IBM','00:1A:64':'IBM',
  '44:38:39':'Cumulus Networks',
  '00:60:2F':'Cisco','00:09:7C':'Cisco','00:18:BA':'Cisco',
  '30:37:A6':'Cisco','58:97:1E':'Cisco','B0:AA:77':'Cisco',
  '00:22:55':'Cisco','00:40:96':'Cisco',
  '00:04:4B':'Nvidia','00:14:38':'Hewlett-Packard'
};

function lookupMac(mac) {
  mac = mac.toUpperCase().replace(/[^0-9A-F]/g, ':');
  // Normalize to colon separated
  const clean = mac.replace(/[^0-9A-F]/g, '');
  if (clean.length !== 12) {
    $('#macResults').innerHTML = '<div class="result-card"><div class="rc-value" style="color:#ef4444">Invalid MAC address. Expected 12 hex digits.</div></div>';
    return;
  }
  const formatted = clean.match(/.{2}/g).join(':');
  const oui = formatted.substring(0, 8);
  const vendor = OUI_DB[oui] || 'Unknown Vendor';
  const isMulticast = (parseInt(clean.substring(0, 2), 16) & 1) === 1;
  const isLocal = (parseInt(clean.substring(0, 2), 16) & 2) === 2;
  const results = [
    {label:'MAC Address', value: formatted, hl:true},
    {label:'OUI Prefix', value: oui},
    {label:'Vendor', value: vendor},
    {label:'Device ID', value: formatted.substring(9)},
    {label:'Type', value: isMulticast ? 'Multicast' : 'Unicast'},
    {label:'Administration', value: isLocal ? 'Locally Administered' : 'Universally Administered (UAA)'},
    {label:'Binary', value: clean.split('').map(h=>parseInt(h,16).toString(2).padStart(4,'0')).join(' ')}
  ];
  $('#macResults').innerHTML = results.map(r=>`<div class="result-card"><div class="rc-label">${r.label}</div><div class="rc-value${r.hl?' highlight':''}">${r.value}</div></div>`).join('');
}
$('#macBtn')?.addEventListener('click', () => lookupMac($('#macInput').value.trim()));
$('#macInput')?.addEventListener('keydown', e => { if(e.key==='Enter') lookupMac($('#macInput').value.trim()); });

// ── BANDWIDTH CALCULATOR ──
$('#bwCalcBtn')?.addEventListener('click', () => {
  const size = parseFloat($('#bwSize').value);
  const sizeUnit = $('#bwSizeUnit').value;
  const speed = parseFloat($('#bwSpeed').value);
  const speedUnit = $('#bwSpeedUnit').value;
  if (isNaN(size) || isNaN(speed) || size <= 0 || speed <= 0) return;

  const sizeBytes = { B:1, KB:1024, MB:1048576, GB:1073741824, TB:1099511627776 };
  const speedBits = { Kbps:1000, Mbps:1e6, Gbps:1e9 };
  
  const totalBits = size * sizeBytes[sizeUnit] * 8;
  const bitsPerSec = speed * speedBits[speedUnit];
  const seconds = totalBits / bitsPerSec;

  function formatTime(s) {
    if (s < 0.001) return `${(s*1000000).toFixed(1)} µs`;
    if (s < 1) return `${(s*1000).toFixed(1)} ms`;
    if (s < 60) return `${s.toFixed(2)} seconds`;
    if (s < 3600) return `${Math.floor(s/60)}m ${Math.floor(s%60)}s`;
    if (s < 86400) return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${Math.floor(s%60)}s`;
    return `${Math.floor(s/86400)}d ${Math.floor((s%86400)/3600)}h ${Math.floor((s%3600)/60)}m`;
  }

  const results = [
    {label:'File Size', value:`${size} ${sizeUnit} (${(size*sizeBytes[sizeUnit]).toLocaleString()} bytes)`, hl:true},
    {label:'Transfer Speed', value:`${speed} ${speedUnit}`},
    {label:'Transfer Time', value:formatTime(seconds)},
    {label:'Total Bits', value:totalBits.toLocaleString()},
    {label:'Throughput', value:`${(totalBits/seconds/1e6).toFixed(2)} Mbps`},
    {label:'At 10 Mbps', value:formatTime(totalBits/10e6)},
    {label:'At 100 Mbps', value:formatTime(totalBits/100e6)},
    {label:'At 1 Gbps', value:formatTime(totalBits/1e9)}
  ];
  $('#bwResults').innerHTML = results.map(r=>`<div class="result-card"><div class="rc-label">${r.label}</div><div class="rc-value${r.hl?' highlight':''}">${r.value}</div></div>`).join('');
});

})();
