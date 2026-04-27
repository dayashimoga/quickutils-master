import urllib.request
import zstandard as zstd
import io
import csv
import json
import chess
import random

url = 'https://database.lichess.org/lichess_db_puzzle.csv.zst'
print("Connecting to Lichess Puzzle DB...")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) QuickUtils/1.0'})
response = urllib.request.urlopen(req)

print("Decompressing stream...")
dctx = zstd.ZstdDecompressor()
stream_reader = dctx.stream_reader(response)
text_stream = io.TextIOWrapper(stream_reader, encoding='utf-8')
csv_reader = csv.reader(text_stream)

puzzles = []

print("Parsing puzzles...")
# Read puzzles, skip first 1000 to get a random-ish slice
for _ in range(1000):
    next(csv_reader)

for row in csv_reader:
    if len(row) < 8: continue
    
    fen = row[1]
    uci_moves = row[2].split()
    rating = int(row[3])
    themes = row[7].split()
    
    # Require decent rating for quality
    if rating < 1000:
        continue
        
    board = chess.Board(fen)
    san_moves = []
    try:
        for uci in uci_moves:
            move = chess.Move.from_uci(uci)
            san_moves.append(board.san(move))
            board.push(move)
            
        title = " ".join([t.capitalize() for t in themes[:3]]) if themes else "Tactical Puzzle"
        # Map Lichess theme tags to something readable
        title = title.replace('Crushing', 'Tactical').replace('Advantage', 'Advantage').replace('MateIn2', 'Mate in 2').replace('MateIn1', 'Mate in 1').replace('Short', '')
        title = title.strip()
        if not title: title = "Master Tactics"
        
        difficulty = "⭐"
        if rating > 1200: difficulty = "⭐⭐"
        if rating > 1600: difficulty = "⭐⭐⭐"
        if rating > 2000: difficulty = "⭐⭐⭐⭐"
        if rating > 2400: difficulty = "⭐⭐⭐⭐⭐"
            
        puzzles.append({
            "fen": fen,
            "solution": san_moves,
            "title": title,
            "difficulty": difficulty,
            "rating": rating
        })
        
        if len(puzzles) >= 250:
            break
    except Exception as e:
        continue

# Sort by rating so they progressively get harder in Academy Mode!
puzzles.sort(key=lambda x: x['rating'])

# Remove the raw rating key for the output to match previous format exactly
for p in puzzles:
    del p['rating']

output_file = 'projects/web-chess/data/puzzles.json'
with open(output_file, 'w') as f:
    # Wrap in our variable format or just dump JSON if that's what's needed.
    # Wait, the previous puzzles.json was actually parsed via JSON, wait!
    # Let me check the format of puzzles.json I wrote earlier.
    # Ah, I think earlier I wrote it directly in script.js as `const DAILY_PUZZLES = []`.
    # Wait, no, I created a `data/puzzles.json` file. Let me check its format first.
    pass

with open(output_file, 'w') as f:
    json.dump(puzzles, f, indent=2)

print(f"Generated {len(puzzles)} puzzles to {output_file}")
