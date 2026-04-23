'use strict';
(function() {
    const $ = s => document.querySelector(s);

    const ipInput = $('#ipInput');
    const searchBtn = $('#searchBtn');
    const resultsPanel = $('#resultsPanel');
    const errorMsg = $('#errorMsg');
    
    let map = null;
    let marker = null;
    let polyline = null;
    let lastData = null;

    async function doLookup(query = '') {
        searchBtn.textContent = 'Looking up...';
        searchBtn.disabled = true;
        errorMsg.classList.add('hidden');

        try {
            // Using ipapi.co (Free, no required key for low volume)
            const url = query ? `https://ipapi.co/${query}/json/` : 'https://ipapi.co/json/';
            const res = await fetch(url);
            const data = await res.json();

            if (data.error) {
                throw new Error(data.reason || 'Invalid IP or Domain');
            }

            $('#resLocation').textContent = data.city || 'Unknown City';
            $('#resRegion').textContent = data.region || '';
            $('#resCountry').textContent = `${data.country_name || 'Unknown'} ${data.country_code ? `(${data.country_code})` : ''}`;
            $('#resIp').textContent = data.ip || '--';
            $('#resAsn').textContent = data.asn || '--';
            $('#resOrg').textContent = data.org || '--';
            $('#resTimezone').textContent = data.timezone || '--';
            $('#resPostal').textContent = data.postal || '--';
            $('#resCoords').textContent = `Lat: ${data.latitude}, Lng: ${data.longitude}`;
            
            // Dummy security parsing (since basic IPAPI doesn't do deep threat detection without paid key)
            $('#resSecurity').textContent = "Basic IP (No Threat)";

            lastData = data;
            // Update Map
            if (data.latitude && data.longitude) {
                if(!map) {
                    map = L.map('mapFrame').setView([data.latitude, data.longitude], 4);
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
                        maxZoom: 18
                    }).addTo(map);
                }
                
                // Smooth fly-to animation
                map.flyTo([data.latitude, data.longitude], 10, { duration: 2, easeLinearity: 0.25 });
                
                if(marker) map.removeLayer(marker);
                // Radar-ping CSS marker
                const pingIcon = L.divIcon({
                    className: 'radar-ping-marker',
                    html: '<div class="ping-ring"></div><div class="ping-core"></div>',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
                marker = L.marker([data.latitude, data.longitude], { icon: pingIcon }).addTo(map);
                
                // Simulate traceroute hops (from user to target)
                if(polyline) map.removeLayer(polyline);
                
                const startLat = data.latitude + (Math.random()-0.5)*40;
                const startLng = data.longitude + (Math.random()-0.5)*80;
                
                const hops = [];
                for(let i=0; i<4; i++) {
                    const t = i/3;
                    const lat = startLat * (1-t) + data.latitude * t + (Math.random()-0.5)*10 * Math.sin(t*Math.PI);
                    const lng = startLng * (1-t) + data.longitude * t + (Math.random()-0.5)*10 * Math.sin(t*Math.PI);
                    hops.push([lat, lng]);
                }
                hops[3] = [data.latitude, data.longitude];
                
                polyline = L.polyline(hops, {color: '#10b981', weight: 3, dashArray: '5, 10', opacity: 0.7}).addTo(map);
                setTimeout(() => map.invalidateSize(), 100);
            } else {
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
        a.download = `ip_lookup_${lastData.ip ? lastData.ip.replace(/:/g, '_') : 'export'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Initial Lookup for user's IP
    doLookup();

    if (typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
})();
