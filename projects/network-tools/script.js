import { 
  ipToInt, intToIp, isValidIp, getIpClass, isPrivateIp, 
  expandIPv6, compressIPv6, isValidIPv6, getIPv6Type, 
  lookupMac, calcBandwidth, formatTime
} from './network-tools-utils.js';

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

function lookupIp(ip) {
  if(!isValidIp(ip)) { if(typeof QU!=='undefined') QU.showToast('Invalid IP address','error'); return; }
  const info = getIpClass(ip);
  const priv = isPrivateIp(ip);
  const binary = ip.split('.').map(o=>parseInt(o).toString(2).padStart(8,'0')).join('.');
  const hex = ip.split('.').map(o=>parseInt(o).toString(16).padStart(2,'0')).join(':');
  const int = ipToInt(ip);
  const results = [
    {label:'IP Address',value:ip,hl:true},{label:'Class',value:info.cls},{label:'Class Range',value:info.range},
    {label:'Default Mask',value:info.defaultMask || (info.cls === 'A' ? '/8' : info.cls === 'B' ? '/16' : info.cls === 'C' ? '/24' : 'N/A')},{label:'Type',value:priv?'Private':'Public'},
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
  $('#portTable').innerHTML = `<div class="port-row port-header"><span>Port</span><span>Service</span><span>Protocol</span><span>Description</span><span>Status</span></div>`+filtered.map(p=>`<div class="port-row"><span class="port-num">${p.port}</span><span>${p.service}</span><span class="port-proto">${p.proto}</span><span class="port-desc">${p.desc}</span><span class="port-status" id="pstat-${p.port}" style="font-weight:bold; color:var(--text-muted)">-</span></div>`).join('');
}
renderPorts();
$$('.filter-btn').forEach(b=>b.addEventListener('click',()=>{$$('.filter-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderPorts(b.dataset.cat,$('#portSearch').value);}));
$('#portSearch').addEventListener('input',()=>{const active=document.querySelector('.filter-btn.active');renderPorts(active?active.dataset.cat:'all',$('#portSearch').value);});

// Scan Ports
let scanResults = [];
async function scanPort(target, port, timeout = 1500) {
    const start = performance.now();
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        await fetch(`http://${target}:${port}`, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(id);
        return { port, status: 'Open', ms: Math.round(performance.now() - start) };
    } catch(e) {
        const ms = Math.round(performance.now() - start);
        if (e.name === 'AbortError' || ms >= timeout - 50) {
            return { port, status: 'Filtered', ms };
        } else {
            return { port, status: 'Closed', ms };
        }
    }
}

$('#scanPortsBtn')?.addEventListener('click', async () => {
    let target = $('#scanTarget').value.trim();
    if(!target) {
        if(typeof QU !== 'undefined') QU.showToast('Please enter a target IP or domain','error');
        return;
    }
    target = target.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    scanResults = [];
    $('#scanPortsBtn').disabled = true;
    $('#scanPortsBtn').textContent = 'Scanning...';
    
    PORTS.forEach(p => {
        const el = $(`#pstat-${p.port}`);
        if(el) { el.textContent = '...'; el.style.color = 'var(--accent)'; }
    });
    
    // Concurrent scanning
    const promises = PORTS.map(async (p) => {
        const res = await scanPort(target, p.port);
        scanResults.push(res);
        const el = $(`#pstat-${p.port}`);
        if(el) {
            el.textContent = `${res.status} (${res.ms}ms)`;
            if(res.status === 'Open') el.style.color = 'var(--neon-green)';
            else if(res.status === 'Closed') el.style.color = '#ef4444';
            else el.style.color = 'var(--text-muted)';
        }
    });
    
    await Promise.allSettled(promises);
    $('#scanPortsBtn').disabled = false;
    $('#scanPortsBtn').textContent = 'Scan';
    if(typeof QU !== 'undefined') QU.showToast('Port scan complete', 'success');
});

$('#exportScanBtn')?.addEventListener('click', () => {
    if(scanResults.length === 0) {
        if(typeof QU !== 'undefined') QU.showToast('No scan results to export', 'error');
        return;
    }
    const blob = new Blob([JSON.stringify({ target: $('#scanTarget').value.trim(), results: scanResults }, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `port_scan_${$('#scanTarget').value.trim().replace(/[^a-z0-9]/gi, '_') || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

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
function uiLookupMac(mac) {
  const res = lookupMac(mac);
  if (!res) return;
  if (!res.valid) {
    $('#macResults').innerHTML = '<div class="result-card"><div class="rc-value" style="color:#ef4444">Invalid MAC address. Expected 12 hex digits.</div></div>';
    return;
  }
  const clean = res.formatted.replace(/:/g, '');
  const isMulticast = (parseInt(clean.substring(0, 2), 16) & 1) === 1;
  const isLocal = (parseInt(clean.substring(0, 2), 16) & 2) === 2;
  const results = [
    {label:'MAC Address', value: res.formatted, hl:true},
    {label:'OUI Prefix', value: res.prefix},
    {label:'Vendor', value: res.vendor},
    {label:'Device ID', value: res.formatted.substring(9)},
    {label:'Type', value: isMulticast ? 'Multicast' : 'Unicast'},
    {label:'Administration', value: isLocal ? 'Locally Administered' : 'Universally Administered (UAA)'},
    {label:'Binary', value: clean.split('').map(h=>parseInt(h,16).toString(2).padStart(4,'0')).join(' ')}
  ];
  $('#macResults').innerHTML = results.map(r=>`<div class="result-card"><div class="rc-label">${r.label}</div><div class="rc-value${r.hl?' highlight':''}">${r.value}</div></div>`).join('');
}
$('#macBtn')?.addEventListener('click', () => uiLookupMac($('#macInput').value.trim()));
$('#macInput')?.addEventListener('keydown', e => { if(e.key==='Enter') uiLookupMac($('#macInput').value.trim()); });

// ── BANDWIDTH CALCULATOR ──
$('#bwCalcBtn')?.addEventListener('click', () => {
  const size = parseFloat($('#bwSize').value);
  const sizeUnit = $('#bwSizeUnit').value;
  const speed = parseFloat($('#bwSpeed').value);
  const speedUnit = $('#bwSpeedUnit').value;
  if (isNaN(size) || isNaN(speed) || size <= 0 || speed <= 0) return;

  const res = calcBandwidth(size, sizeUnit, speed, speedUnit);
  if (!res) return;

  const seconds = (size * (sizeUnit==='TB'?1024**4:sizeUnit==='GB'?1024**3:sizeUnit==='MB'?1024**2:sizeUnit==='KB'?1024:1)*8) / res.bps;
  const totalBits = res.bps * seconds;

  const results = [
    {label:'File Size', value:`${size} ${sizeUnit}`, hl:true},
    {label:'Transfer Speed', value:`${speed} ${speedUnit}`},
    {label:'Transfer Time', value:formatTime(seconds)},
    {label:'Total Bits', value:totalBits.toLocaleString()},
    {label:'Throughput', value:`${(res.bps/1e6).toFixed(2)} Mbps`},
    {label:'At 10 Mbps', value:formatTime(totalBits/10e6)},
    {label:'At 100 Mbps', value:formatTime(totalBits/100e6)},
    {label:'At 1 Gbps', value:formatTime(totalBits/1e9)}
  ];
  $('#bwResults').innerHTML = results.map(r=>`<div class="result-card"><div class="rc-label">${r.label}</div><div class="rc-value${r.hl?' highlight':''}">${r.value}</div></div>`).join('');
});

// ── LATENCY MONITOR ──
let latencyChartInst = null;
let latencyInterval = null;
const latencyData = { labels: [], values: [] };

function measureLatency() {
    const t0 = performance.now();
    // Ping by fetching a tiny resource with cache-busting
    fetch('https://httpbin.org/status/200', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
        .then(() => {
            const latency = Math.round(performance.now() - t0);
            addLatencyPoint(latency);
        })
        .catch(() => {
            // Simulate on failure (CORS may block, use timing)
            const latency = Math.round(performance.now() - t0);
            addLatencyPoint(latency);
        });
}

function addLatencyPoint(ms) {
    const now = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    latencyData.labels.push(now);
    latencyData.values.push(ms);
    
    // Keep rolling window of 30
    if (latencyData.labels.length > 30) {
        latencyData.labels.shift();
        latencyData.values.shift();
    }
    
    updateLatencyChart();
    updateLatencyStats();
}

function updateLatencyChart() {
    const canvas = document.getElementById('latencyChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    
    if (latencyChartInst) {
        latencyChartInst.data.labels = latencyData.labels;
        latencyChartInst.data.datasets[0].data = latencyData.values;
        latencyChartInst.update('none');
        return;
    }
    
    latencyChartInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: latencyData.labels,
            datasets: [{
                label: 'Latency (ms)',
                data: latencyData.values,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: '#10b981',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#10b981',
                    bodyFont: { family: 'monospace', size: 13 },
                    cornerRadius: 6,
                    callbacks: { label: c => c.parsed.y + ' ms' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + 'ms' },
                    grid: { color: 'rgba(255,255,255,0.04)' }
                },
                x: {
                    ticks: { color: '#64748b', font: { size: 9 }, maxTicksLimit: 8 },
                    grid: { display: false }
                }
            }
        }
    });
}

function updateLatencyStats() {
    const vals = latencyData.values;
    if (vals.length === 0) return;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = Math.round(vals.reduce((a,b) => a+b, 0) / vals.length);
    const statsEl = document.getElementById('latencyStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div style="background:rgba(16,185,129,0.1); padding:10px; border-radius:8px; text-align:center;">
                <div style="font-size:0.7rem; color:var(--text-muted)">Min</div>
                <div style="font-size:1.1rem; font-weight:700; color:#10b981;">${min}ms</div>
            </div>
            <div style="background:rgba(99,102,241,0.1); padding:10px; border-radius:8px; text-align:center;">
                <div style="font-size:0.7rem; color:var(--text-muted)">Avg</div>
                <div style="font-size:1.1rem; font-weight:700; color:#6366f1;">${avg}ms</div>
            </div>
            <div style="background:rgba(239,68,68,0.1); padding:10px; border-radius:8px; text-align:center;">
                <div style="font-size:0.7rem; color:var(--text-muted)">Max</div>
                <div style="font-size:1.1rem; font-weight:700; color:#ef4444;">${max}ms</div>
            </div>
        `;
    }
}

$('#startLatencyBtn').addEventListener('click', () => {
    if (latencyInterval) return;
    $('#startLatencyBtn').disabled = true;
    $('#stopLatencyBtn').disabled = false;
    measureLatency();
    latencyInterval = setInterval(measureLatency, 2000);
});

$('#stopLatencyBtn').addEventListener('click', () => {
    clearInterval(latencyInterval);
    latencyInterval = null;
    $('#startLatencyBtn').disabled = false;
    $('#stopLatencyBtn').disabled = true;
});

// ── TERMINAL SIMULATOR ──
const termInput = $('#termInput');
const termOutput = $('#termOutput');

function printTerm(text, color = '#a5d6ff') {
    const span = document.createElement('span');
    span.style.color = color;
    span.textContent = text;
    termOutput.appendChild(span);
    termOutput.appendChild(document.createElement('br'));
    termOutput.scrollTop = termOutput.scrollHeight;
}

const commands = {
    help: () => {
        printTerm("Available commands:");
        printTerm("  help         - Show this message");
        printTerm("  clear        - Clear terminal output");
        printTerm("  ping <host>  - Simulate pinging a host");
        printTerm("  traceroute <host> - Simulate tracing route to a host");
        printTerm("  whois <host> - Simulate WHOIS lookup");
    },
    clear: () => {
        termOutput.innerHTML = '';
        printTerm("QuickUtils Network Terminal v1.0.0", "#3fb950");
        printTerm("Type 'help' for a list of available commands.");
        printTerm("");
    },
    ping: async (args) => {
        if(!args[0]) return printTerm("Usage: ping <host>", "#ff5f56");
        const host = args[0];
        printTerm(`PING ${host} (${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}) 56(84) bytes of data.`);
        for(let i=1; i<=4; i++) {
            await new Promise(r => setTimeout(r, 800));
            printTerm(`64 bytes from ${host}: icmp_seq=${i} ttl=${Math.floor(Math.random()*20)+40} time=${(Math.random()*50 + 10).toFixed(1)} ms`);
        }
        printTerm(`--- ${host} ping statistics ---`);
        printTerm(`4 packets transmitted, 4 received, 0% packet loss, time 3004ms`);
    },
    traceroute: async (args) => {
        if(!args[0]) return printTerm("Usage: traceroute <host>", "#ff5f56");
        const host = args[0];
        printTerm(`traceroute to ${host}, 30 hops max, 60 byte packets`);
        const hops = Math.floor(Math.random() * 8) + 5;
        let msBase = 2;
        for(let i=1; i<=hops; i++) {
            await new Promise(r => setTimeout(r, 600));
            const ip = i === hops ? host : `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
            const times = Array.from({length:3}, () => (msBase + Math.random()*15).toFixed(3) + ' ms').join('  ');
            printTerm(`${String(i).padStart(2, ' ')}  ${ip}  ${times}`);
            msBase += Math.random() * 10;
        }
        printTerm(`Trace complete.`);
    },
    whois: async (args) => {
        if(!args[0]) return printTerm("Usage: whois <host>", "#ff5f56");
        printTerm(`Simulating WHOIS query for ${args[0]}...`);
        await new Promise(r => setTimeout(r, 1000));
        printTerm(`Domain Name: ${args[0].toUpperCase()}`);
        printTerm(`Registry Domain ID: ${Math.floor(Math.random()*1000000000)}_DOMAIN_COM-VRSN`);
        printTerm(`Registrar WHOIS Server: whois.markmonitor.com`);
        printTerm(`Registrar URL: http://www.markmonitor.com`);
        printTerm(`Updated Date: 2024-01-01T00:00:00Z`);
        printTerm(`Creation Date: 1997-09-15T04:00:00Z`);
        printTerm(`Registry Expiry Date: 2028-09-14T04:00:00Z`);
    }
};

termInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const val = termInput.value.trim();
        termInput.value = '';
        if(!val) return;
        printTerm(`guest@net~$ ${val}`, '#fff');
        const [cmd, ...args] = val.split(' ');
        
        termInput.disabled = true;
        if(commands[cmd]) {
            await commands[cmd](args);
        } else {
            printTerm(`Command not found: ${cmd}`, '#ff5f56');
        }
        termInput.disabled = false;
        termInput.focus();
    }
});

})();
