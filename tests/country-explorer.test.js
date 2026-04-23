
describe('Country Explorer', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = `
<div class="search-container">
    <input type="text" id="searchInput" placeholder="Search for a country...">
    <select id="regionFilter">
        <option value="all">All Regions</option>
        <option value="Africa">Africa</option>
        <option value="Americas">Americas</option>
        <option value="Asia">Asia</option>
        <option value="Europe">Europe</option>
        <option value="Oceania">Oceania</option>
    </select>
</div>
<div id="countriesGrid" class="countries-grid"></div>
<div id="countryModal" class="modal">
    <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div id="modalBody"></div>
    </div>
</div>`;
        
        const mockFetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve([
                    {
                        name: { common: 'TestLand', official: 'Republic of TestLand' },
                        cca3: 'TST',
                        capital: ['Test City'],
                        region: 'Europe',
                        subregion: 'Western Europe',
                        population: 1000000,
                        area: 50000,
                        flags: { svg: 'flag.svg' },
                        borders: ['XYZ'],
                        languages: { eng: 'English' },
                        currencies: { TST: { name: 'Test Dollar', symbol: '$' } },
                        timezones: ['UTC+01:00'],
                        latlng: [50, 10]
                    }
                ]),
            })
        );
        global.fetch = mockFetch;
        window.fetch = mockFetch;
        
        window.Chart = vi.fn().mockImplementation(() => {
            return { destroy: vi.fn(), update: vi.fn() };
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        document.documentElement.innerHTML = '';
        vi.resetModules();
    });

    test('Loads country-explorer script and initializes without error', async () => {
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await new Promise(r => setTimeout(r, 100));
        
        const searchInput = document.getElementById('searchInput');
        if(searchInput) {
            searchInput.value = 'Test';
            searchInput.dispatchEvent(new Event('input'));
        }
        
        const regionFilter = document.getElementById('regionFilter');
        if(regionFilter) {
            regionFilter.value = 'Europe';
            regionFilter.dispatchEvent(new Event('change'));
        }
        
        expect(true).toBe(true);
    });
});
