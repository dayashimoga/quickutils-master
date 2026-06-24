import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: [
            'tests/speed-test.test.js',
            'tests/ip-lookup.test.js',
            'tests/network-tools.test.js',
            'tests/market-digest.test.js',
            'tests/solar-system.test.js',
            'tests/music-maker.test.js',
            'tests/web-chess.test.js',
            'tests/chessmaster-ai.test.js',
        ],
        coverage: {
            provider: 'v8',
            clean: false,
            reporter: ['text', 'text-summary', 'json', 'html'],
            include: [
                'projects/speed-test/speed-test-utils.js',
                'projects/ip-lookup/ip-lookup-utils.js',
                'projects/network-tools/network-tools-utils.js',
                'projects/market-digest/market-digest-utils.js',
                'projects/solar-system/solar-system-utils.js',
                'projects/music-maker/music-maker-utils.js',
                'projects/chessmaster-ai/chessmaster-ai-utils.js',
            ],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 90,
                statements: 90,
            },
        },
        testTimeout: 15000,
    },
    resolve: {
        alias: {
            '@speed-test': path.resolve(__dirname, 'projects/speed-test'),
            '@ip-lookup': path.resolve(__dirname, 'projects/ip-lookup'),
            '@network-tools': path.resolve(__dirname, 'projects/network-tools'),
            '@market-digest': path.resolve(__dirname, 'projects/market-digest'),
            '@solar-system': path.resolve(__dirname, 'projects/solar-system'),
            '@music-maker': path.resolve(__dirname, 'projects/music-maker'),
            '@chessmaster-ai': path.resolve(__dirname, 'projects/chessmaster-ai'),
        },
    },
});
