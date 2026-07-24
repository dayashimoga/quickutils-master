# ChessOS V3 — Active TODO

## V3.0.1 Status: ✅ COMPLETE

All sprints delivered. Deployment verified on https://chessmaster.quickutils.top/

### Resolved in V3.0.1
- [x] Fix Cloudflare edge cache serving stale JS files
- [x] Cache-bust all 6 static assets with `?v=3.0.1`
- [x] Wire SM-2 spaced repetition on opening completion
- [x] Show next review dates in Opening Lab repertoire list
- [x] Add nav click handlers for 7 missing view init calls
- [x] Sync source → dist and deploy

### Future Considerations (V4)
- [ ] Build system (Vite/Rollup) for minification and tree-shaking
- [ ] Service Worker for offline play
- [ ] WebRTC multiplayer via PeerJS
- [ ] Server-side ELO tracking with Cloudflare Workers
- [ ] OAuth integration for persistent accounts
- [ ] Opening Explorer API integration (Lichess)
- [ ] Puzzle rating system (Glicko-2)
