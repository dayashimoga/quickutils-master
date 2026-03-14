// Price Comparator Application Logic

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    
    // Exit if not on the price-comparator page
    if (!searchInput) return;

    const searchBtn = document.getElementById('searchBtn');
    const autocompleteDropdown = document.getElementById('autocomplete-results');
    const loadingDiv = document.getElementById('loading');
    const resultsSection = document.getElementById('results');
    const priceTableBody = document.getElementById('priceTableBody');
    const lowestPriceText = document.getElementById('lowest-price-text');
    const fastestDeliveryText = document.getElementById('fastest-delivery-text');
    
    let priceChart = null;

    // Mock autocomplete suggestions
    const suggestions = [
        "iPhone 15 Pro Max 256GB",
        "Sony WH-1000XM5 Headphones",
        "Samsung Galaxy S24 Ultra",
        "Apple AirPods Pro (2nd Gen)",
        "Dyson Airwrap",
        "PS5 Console",
        "Logitech MX Master 3S",
        "Amul Butter 500g"
    ];

    // Autocomplete Logic
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        autocompleteDropdown.innerHTML = '';
        
        if (value.length < 2) {
            autocompleteDropdown.classList.add('hidden');
            return;
        }

        const matches = suggestions.filter(item => item.toLowerCase().includes(value));
        
        if (matches.length > 0) {
            matches.forEach(match => {
                const div = document.createElement('div');
                div.textContent = match;
                div.addEventListener('click', () => {
                    searchInput.value = match;
                    autocompleteDropdown.classList.add('hidden');
                    performSearch(match);
                });
                autocompleteDropdown.appendChild(div);
            });
            autocompleteDropdown.classList.remove('hidden');
        } else {
            autocompleteDropdown.classList.add('hidden');
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== searchInput && e.target !== autocompleteDropdown) {
            autocompleteDropdown.classList.add('hidden');
        }
    });

    searchBtn.addEventListener('click', () => {
        if (searchInput.value.trim() !== "") {
            performSearch(searchInput.value.trim());
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== "") {
            autocompleteDropdown.classList.add('hidden');
            performSearch(searchInput.value.trim());
        }
    });

    // Mock API Fetching function
    async function performSearch(query) {
        // UI State: Loading
        resultsSection.classList.add('hidden');
        loadingDiv.classList.remove('hidden');

        try {
            // In a real application, we would call an API gateway/Cloudflare Worker here.
            // Example: const response = await fetch(`https://api.pricecomparator.com/search?q=${encodeURIComponent(query)}`);
            // const data = await response.json();
            
            // Simulating network delay and returning mock data for now
            const data = await simulateApiFetch(query);
            
            renderResults(data);
        } catch (error) {
            console.error("Error fetching prices:", error);
            alert("Failed to fetch prices. Please try again later.");
        } finally {
            loadingDiv.classList.add('hidden');
        }
    }

    // Render logic
    function renderResults(data) {
        priceTableBody.innerHTML = '';
        
        // Split data into Global and Regional for distinct badging
        const globalData = data.filter(d => d.region === 'Global').sort((a,b) => a.price - b.price);
        const regionalData = data.filter(d => d.region === 'Regional').sort((a,b) => a.price - b.price);
        
        // Find best deals
        const bestGlobalPrice = globalData.length > 0 ? globalData[0].price : null;
        const bestRegionalPrice = regionalData.length > 0 ? regionalData[0].price : null;

        // Overall sort for rendering
        const sortedData = [...data].sort((a, b) => a.price - b.price);
        const minPrice = sortedData[0].price;
        const maxPrice = sortedData[sortedData.length - 1].price;
        const fastest = [...data].sort((a, b) => a.deliveryMins - b.deliveryMins)[0];

        // Update highlight boxes
        lowestPriceText.innerHTML = `₹${minPrice.toLocaleString('en-IN')} on <b>${sortedData[0].store}</b> <br/><small style="color:var(--text-muted);font-size:0.8rem">Global: ₹${bestGlobalPrice ? bestGlobalPrice.toLocaleString('en-IN') : '--'} | Reg: ₹${bestRegionalPrice ? bestRegionalPrice.toLocaleString('en-IN') : '--'}</small>`;
        
        if (fastest.deliveryMins < 60) {
            fastestDeliveryText.textContent = `${fastest.deliveryMins} mins on ${fastest.store}`;
        } else {
            const hours = Math.round(fastest.deliveryMins / 60);
            const days = Math.round(hours / 24);
            fastestDeliveryText.textContent = days > 0 ? `${days} day(s) on ${fastest.store}` : `${hours} hour(s) on ${fastest.store}`;
        }

        // Render table rows
        data.forEach(item => {
            let priceClass = 'mid-price';
            if (item.price === minPrice) priceClass = 'lowest-price';
            else if (item.price === maxPrice && data.length > 2) priceClass = 'highest-price';

            let deliveryText = item.deliveryMins < 60 ? `${item.deliveryMins} mins` : 
                               Math.round(item.deliveryMins/60/24) > 0 ? `${Math.round(item.deliveryMins/60/24)} Days` : 'Tomorrow';

            let badgesHtml = '';
            if (item.price === bestGlobalPrice && item.region === 'Global') {
                 badgesHtml += '<span style="font-size:0.7rem;background:var(--accent-blue);padding:2px 6px;border-radius:4px;margin-left:8px">Top Global</span>';
            }
            if (item.price === bestRegionalPrice && item.region === 'Regional') {
                 badgesHtml += '<span style="font-size:0.7rem;background:var(--accent-green);padding:2px 6px;border-radius:4px;margin-left:8px;color:#000">Top Regional</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="store-logo">
                        <span>${item.store}</span>
                    </div>
                </td>
                <td>${item.productName} ${badgesHtml}</td>
                <td class="price-col ${priceClass}">₹${item.price.toLocaleString('en-IN')} <br/><small style="color:var(--text-muted);font-size:0.75rem">${item.originalCurrencyStr || ''}</small></td>
                <td><span style="color: var(--accent-green)">${item.discount} Off</span></td>
                <td>${deliveryText}</td>
                <td>
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-buy">Buy Now</a>
                </td>
            `;
            priceTableBody.appendChild(tr);
        });

        // Render Chart
        renderChart(data);

        // Show Results
        resultsSection.classList.remove('hidden');
    }

    function renderChart(data) {
        const ctx = document.getElementById('priceBarChart').getContext('2d');
        
        if (priceChart) {
            priceChart.destroy();
        }

        // Chart.js global defaults for dark theme
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        const stores = data.map(d => d.store);
        const prices = data.map(d => d.price);
        
        // Color mapping for chart bars
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        const backgroundColors = prices.map(price => {
            if(price === minPrice) return 'rgba(16, 185, 129, 0.8)'; // Green
            if(price === maxPrice && prices.length > 2) return 'rgba(239, 68, 68, 0.8)'; // Red
            return 'rgba(245, 158, 11, 0.8)'; // Yellow
        });

        priceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stores,
                datasets: [{
                    label: 'Price (₹)',
                    data: prices,
                    backgroundColor: backgroundColors,
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 14, family: "'Outfit', sans-serif" },
                        bodyFont: { size: 14, family: "'Outfit', sans-serif" },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false,
                        }
                    }
                }
            }
        });
    }

    // Real API fetch using Proxy + DummyJSON
    async function simulateApiFetch(query) {
        let results = [];
        const USD_TO_INR = 83.5;
        
        // Base mock price generator based on query length/hash
        const strHash = query.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
        const basePrice = Math.abs(strHash) % 50000 + 1000;
        
        // 1. Fetch from Global Products API (DummyJSON to simulate Amazon/eBay/BestBuy/Banggood/AliExpress)
        try {
            const djRes = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`);
            if (djRes.ok) {
                const djData = await djRes.json();
                if (djData.products && djData.products.length > 0) {
                    const p = djData.products[0]; // Use the best match
                    const usdPrice = p.price;
                    const inrPrice = Math.round(usdPrice * USD_TO_INR);
                    const qEnc = encodeURIComponent(query);
                    
                    // Affiliate Tag
                    const affTag = 'quickutils-21';

                    // Global Stores
                    results.push({
                        store: 'Amazon Global', region: 'Global', productName: p.title,
                        price: inrPrice, originalCurrencyStr: `($${usdPrice})`,
                        discount: `${Math.round(p.discountPercentage)}%`, deliveryMins: 10080, 
                        url: `https://www.amazon.com/s?k=${qEnc}&tag=${affTag}`
                    });
                    
                    results.push({
                        store: 'eBay Global', region: 'Global', productName: p.title,
                        price: Math.round(inrPrice * 0.95), originalCurrencyStr: `($${(usdPrice*0.95).toFixed(2)})`, // Slightly cheaper
                        discount: '15%', deliveryMins: 14400, // 10 days
                        url: `https://www.ebay.com/sch/i.html?_nkw=${qEnc}&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=111`
                    });

                    results.push({
                        store: 'BestBuy US', region: 'Global', productName: p.title,
                        price: Math.round(inrPrice * 1.05), originalCurrencyStr: `($${(usdPrice*1.05).toFixed(2)})`,
                        discount: '5%', deliveryMins: 8640, // 6 days
                        url: `https://www.bestbuy.com/site/searchpage.jsp?st=${qEnc}`
                    });
                    
                    results.push({
                        store: 'AliExpress', region: 'Global', productName: p.title,
                        price: Math.round(inrPrice * 0.60), originalCurrencyStr: `($${(usdPrice*0.60).toFixed(2)})`,
                        discount: '40%', deliveryMins: 28800, // 20 days
                        url: `https://www.aliexpress.com/wholesale?SearchText=${qEnc}`
                    });
                    
                    results.push({
                        store: 'Banggood', region: 'Global', productName: p.title,
                        price: Math.round(inrPrice * 0.75), originalCurrencyStr: `($${(usdPrice*0.75).toFixed(2)})`,
                        discount: '25%', deliveryMins: 21600, // 15 days
                        url: `https://www.banggood.com/search/${qEnc.replace(/%20/g, '-')}.html`
                    });
                }
            }
        } catch(e) { console.error("Global fetch failed", e); }

        // 2. Regional Store logic (Amazon IN, Flipkart, Myntra, Meesho, Blinkit, Swiggy Instamart)
        const regionalBase = basePrice;
        const qEncReg = encodeURIComponent(query);
        const affTagIN = 'quickutils-21';

        results.push({
            store: 'Flipkart', region: 'Regional', productName: query,
            price: regionalBase, originalCurrencyStr: '',
            discount: '12%', deliveryMins: 4320, // 3 days
            url: `https://www.flipkart.com/search?q=${qEncReg}&affid=quickutils`
        });

        results.push({
            store: 'Amazon India', region: 'Regional', productName: query,
            price: Math.round(regionalBase * 1.02), originalCurrencyStr: '',
            discount: '10%', deliveryMins: 2880, // 2 days
            url: `https://www.amazon.in/s?k=${qEncReg}&tag=${affTagIN}`
        });

        results.push({
            store: 'Myntra', region: 'Regional', productName: query,
            price: Math.round(regionalBase * 1.10), originalCurrencyStr: '',
            discount: '5%', deliveryMins: 5760, // 4 days
            url: `https://www.myntra.com/${qEncReg.replace(/%20/g, '-')}`
        });

        results.push({
            store: 'Meesho', region: 'Regional', productName: query,
            price: Math.round(regionalBase * 0.85), originalCurrencyStr: '',
            discount: '20%', deliveryMins: 10080, // 7 days
            url: `https://www.meesho.com/search?q=${qEncReg}`
        });

        // Quick Commerce (High delivery speed, sometimes higher prices)
        results.push({
            store: 'Blinkit', region: 'Regional', productName: query,
            price: Math.round(regionalBase * 1.15), originalCurrencyStr: '',
            discount: '2%', deliveryMins: 15, // 15 mins!
            url: `https://blinkit.com/s/?q=${qEncReg}`
        });

        results.push({
            store: 'Swiggy Instamart', region: 'Regional', productName: query,
            price: Math.round(regionalBase * 1.12), originalCurrencyStr: '',
            discount: '0%', deliveryMins: 20, // 20 mins!
            url: `https://www.swiggy.com/instamart/search?custom_back=true&query=${qEncReg}`
        });

        // Ensure we always return array even if external APIs fail
        if (results.length === 0) {
             results.push(
               { store: 'Flipkart', region: 'Regional', productName: query, price: basePrice, originalCurrencyStr: '', discount: '12%', deliveryMins: 4320, url: '#' },
               { store: 'Amazon Global', region: 'Global', productName: query, price: Math.round(basePrice/USD_TO_INR), originalCurrencyStr: `($${Math.round(basePrice/USD_TO_INR)})`, discount: '0%', deliveryMins: 14400, url: '#' }
             );
        }

        return results;
    }

});
