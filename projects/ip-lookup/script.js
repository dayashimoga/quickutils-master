import { parseBatchInput, calcThreatScore, formatIpData } from './ip-lookup-utils.js';

(function() {
    const $ = s => document.querySelector(s);

    const ipInput = $('#ipInput');
    const searchBtn = $('#searchBtn');
    const resultsPanel = $('#resultsPanel');
    const errorMsg = $('#errorMsg');
    
    let map = null;
    let marker = null;
    let polyline = null;
    let lastData = null; // Can be array for batch


    async function doLookup(query = '') {
        searchBtn.textContent = 'Looking up...';
        searchBtn.disabled = true;
        errorMsg.classList.add('hidden');

        try {
            // Determine batch vs single
            const inputs = parseBatchInput(query);
            const queries = inputs.length > 0 ? inputs : [query];

            const fetchPromises = queries.map(async (q) => {
                const url = q ? `https://ipapi.co/${q}/json/` : 'https://ipapi.co/json/';
                const res = await fetch(url);
                const d = await res.json();
                if (d.error) throw new Error(d.reason || `Invalid IP or Domain: ${q}`);
                return d;
            });

            const allData = await Promise.all(fetchPromises);
            const data = allData[0]; // Display the first one in UI

            const formatted = formatIpData(data);

            $('#resLocation').textContent = formatted.city;
            $('#resRegion').textContent = formatted.region;
            $('#resCountry').textContent = formatted.country;
            $('#resIp').textContent = formatted.ip;
            $('#resAsn').textContent = formatted.asn;
            $('#resOrg').textContent = formatted.org;
            $('#resTimezone').textContent = formatted.timezone;
            $('#resPostal').textContent = formatted.postal;
            $('#resCoords').textContent = formatted.coords;
            
            // Render actual threat score
            const threat = calcThreatScore(data);
            const secEl = $('#resSecurity');
            secEl.textContent = threat.label + (threat.score > 0 ? ` (Score: ${threat.score})` : '');
            secEl.style.color = threat.color;
            secEl.style.textShadow = `0 0 10px ${threat.color}66`;

            if (allData.length > 1) {
                showToast(`Batch lookup complete: ${allData.length} IPs. Use Export to download results.`);
            }

            lastData = allData.length > 1 ? allData : data;
            // Update Map
            const lat = parseFloat(data.latitude);
            const lng = parseFloat(data.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                if(!map) {
                    $('#mapFrame').innerHTML = ''; // Clear any error message
                    map = L.map('mapFrame').setView([lat, lng], 4);
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
                        maxZoom: 18
                    }).addTo(map);
                }
                
                // Smooth fly-to animation
                map.flyTo([lat, lng], 10, { duration: 2, easeLinearity: 0.25 });
                
                if(marker) map.removeLayer(marker);
                // Radar-ping CSS marker
                const pingIcon = L.divIcon({
                    className: 'radar-ping-marker',
                    html: '<div class="ping-ring"></div><div class="ping-core"></div>',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
                marker = L.marker([lat, lng], { icon: pingIcon }).addTo(map);
                
                // Simulate traceroute hops (from user to target)
                if(polyline) map.removeLayer(polyline);
                
                const startLat = lat + (Math.random()-0.5)*40;
                const startLng = lng + (Math.random()-0.5)*80;
                
                const hops = [];
                for(let i=0; i<4; i++) {
                    const t = i/3;
                    const hopLat = startLat * (1-t) + lat * t + (Math.random()-0.5)*10 * Math.sin(t*Math.PI);
                    const hopLng = startLng * (1-t) + lng * t + (Math.random()-0.5)*10 * Math.sin(t*Math.PI);
                    hops.push([hopLat, hopLng]);
                }
                hops[3] = [lat, lng];
                
                polyline = L.polyline(hops, {color: '#10b981', weight: 3, dashArray: '5, 10', opacity: 0.7}).addTo(map);
                setTimeout(() => map.invalidateSize(), 100);
            } else {
                if (map) {
                    map.remove();
                    map = null;
                }
                $('#mapFrame').innerHTML = `<div style="color:var(--text-muted); text-align:center; padding-top:20px;">Map not available for this IP</div>`;
            }

            resultsPanel.classList.remove('hidden');

        } catch (e) {
            errorMsg.textContent = "Error: " + e.message;
            errorMsg.classList.remove('hidden');
        } finally {
            searchBtn.textContent = 'Lookup';
            searchBtn.disabled = false;
        }
    }

    searchBtn.addEventListener('click', () => {
        doLookup(ipInput.value.trim());
    });

    ipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doLookup(ipInput.value.trim());
    });

    $('#exportBtn').addEventListener('click', () => {
        if(!lastData) return;
        const blob = new Blob([JSON.stringify(lastData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filenameLabel = Array.isArray(lastData) ? `batch_${lastData.length}` : (lastData.ip ? lastData.ip.replace(/:/g, '_') : 'export');
        a.download = `ip_lookup_${filenameLabel}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Toast helper for batch info
    function showToast(msg) {
        let t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#3b82f6; color:#fff; padding:10px 20px; border-radius:8px; z-index:9999;';
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }

    // Initial Lookup for user's IP
    doLookup();

    if (typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
})();
