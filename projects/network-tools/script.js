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
})();
