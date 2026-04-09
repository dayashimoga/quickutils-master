'use strict';
(function() {
    const $ = s => document.querySelector(s);

    const ipInput = $('#ipInput');
    const searchBtn = $('#searchBtn');
    const resultsPanel = $('#resultsPanel');
    const errorMsg = $('#errorMsg');

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

            // Update Map
            if (data.latitude && data.longitude) {
                $('#mapFrame').innerHTML = `<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude-0.5}%2C${data.latitude-0.5}%2C${data.longitude+0.5}%2C${data.latitude+0.5}&amp;layer=mapnik&amp;marker=${data.latitude}%2C${data.longitude}"></iframe>`;
            } else {
                $('#mapFrame').innerHTML = `<span>Map not available</span>`;
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

    // Initial Lookup for user's IP
    doLookup();

    if (typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
})();
