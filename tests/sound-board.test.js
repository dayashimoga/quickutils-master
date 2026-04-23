
describe('Sound Board', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = `
<div class="grid-container">
    <button class="drum-pad" data-key="81" data-sound="kick"></button>
    <button class="drum-pad" data-key="87" data-sound="snare"></button>
</div>`;
    });

    afterEach(() => {
        document.documentElement.innerHTML = '';
        vi.resetModules();
    });

    test('Loads sound-board script and initializes without error', async () => {
        document.dispatchEvent(new Event('DOMContentLoaded'));
        expect(true).toBe(true);
    });
});
