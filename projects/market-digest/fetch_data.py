import json
import urllib.request
import urllib.error
import datetime
import xml.etree.ElementTree as ET
import time

DATA_FILE = "data.json"

def fetch_yahoo_finance(symbol):
    # Fetching 1 year of data to ensure we have ~252 trading days for a 1-year lookback
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1y&interval=1d"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        response = urllib.request.urlopen(req, timeout=10)
        data = json.loads(response.read())
        
        if not data.get('chart', {}).get('result'):
            return []
            
        result = data['chart']['result'][0]
        timestamps = result.get('timestamp', [])
        indicators = result.get('indicators', {}).get('quote', [{}])[0]
        close_prices = indicators.get('close', [])
        
        valid_data = [(t, p) for t, p in zip(timestamps, close_prices) if p is not None]
        return [float(round(p, 2)) for _, p in valid_data]
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return []

def get_signal(current, history):
    if len(history) < 30:
        return "Hold"
    
    sma_30 = float(sum(history[-30:]) / 30)
    sma_10 = float(sum(history[-10:]) / 10) if len(history) >= 10 else float(current)
    
    if current > sma_10 and sma_10 > sma_30:
        return "Strong Buy"
    if current > sma_30:
        return "Buy"
    if current < sma_10 and sma_10 < sma_30:
        return "Strong Sell"
    if current < sma_30:
        return "Sell"
    return "Hold"

def calculate_rsi(prices, period=14):
    if len(prices) < period + 1:
        return 50.0
    gains = []
    losses = []
    for i in range(1, len(prices)):
        change = prices[i] - prices[i-1]
        if change > 0:
            gains.append(change)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(change))
    
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    for i in range(period, len(prices)-1):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)

def calculate_macd(prices, slow=26, fast=12, signal=9):
    if len(prices) < slow + signal:
        return {"macd": 0, "signal": 0, "hist": 0}

    def ema_series(data, period):
        emas = [sum(data[:period]) / period]
        k = 2 / (period + 1)
        for p in data[period:]:
            emas.append(p * k + emas[-1] * (1 - k))
        return [0]*(period-1) + emas

    fast_ema = ema_series(prices, fast)
    slow_ema = ema_series(prices, slow)
    
    macd_line = [f - s for f, s in zip(fast_ema[slow-1:], slow_ema[slow-1:])]
    signal_line = ema_series(macd_line, signal)
    
    current_macd = macd_line[-1]
    current_signal = signal_line[-1]
    hist = current_macd - current_signal
    
    return {
        "macd": round(current_macd, 2),
        "signal": round(current_signal, 2),
        "hist": round(hist, 2)
    }

def detect_patterns(prices):
    if len(prices) < 30:
        return {"pattern": "None", "target": 0, "stop_loss": 0, "strength": "Neutral"}
        
    current = prices[-1]
    last_30 = prices[-30:]
    max_30 = max(last_30)
    min_30 = min(last_30)
    
    jump = prices[-15] > prices[-20] * 1.05 if len(prices) >= 20 else False
    consolidation = current < prices[-15] and current > prices[-20] if len(prices) >= 20 else False
    if jump and consolidation:
        return {
            "pattern": "Bull Flag",
            "target": round(current * 1.08, 2), 
            "stop_loss": round(min_30 * 0.98, 2),
            "strength": "Strong Bullish"
        }
        
    if len(prices) >= 30 and prices[-30] > prices[-20] and prices[-20] < prices[-10] and prices[-5] < prices[-10] and current > prices[-5]:
        return {
            "pattern": "Cup & Handle",
            "target": round(current * 1.10, 2),
            "stop_loss": round(prices[-5] * 0.95, 2),
            "strength": "Bullish"
        }
        
    if len(prices) >= 25 and prices[-25] < prices[-20] and prices[-20] > prices[-15] and prices[-15] < prices[-10] and prices[-10] > prices[-20] and prices[-10] > prices[-5] and prices[-5] < current and current < prices[-10]:
        return {
            "pattern": "Head & Shoulders",
            "target": round(current * 0.90, 2),
            "stop_loss": round(prices[-10] * 1.02, 2),
            "strength": "Bearish"
        }
        
    return {"pattern": "Consolidation", "target": round(current*1.02, 2), "stop_loss": round(current*0.95, 2), "strength": "Neutral"}

def calculate_deltas(history):
    if not history or len(history) < 2:
        return {
            "current": 0, "history_30d": [], 
            "delta_1d": 0, "delta_1w": 0, "delta_1m": 0,
            "delta_3m": 0, "delta_6m": 0, "delta_1y": 0,
            "signal": "Neutral"
        }
    
    current = history[-1]
    day_ago = history[-2] if len(history) >= 2 else current
    week_ago = history[-6] if len(history) >= 6 else history[0]
    month_ago = history[-22] if len(history) >= 22 else history[0]
    month_3_ago = history[-63] if len(history) >= 63 else history[0]
    month_6_ago = history[-126] if len(history) >= 126 else history[0]
    year_ago = history[0]
    
    return {
        "current": current,
        "history_30d": history[-30:],
        "delta_1d": round(((current - day_ago) / day_ago) * 100, 2) if day_ago else 0,
        "delta_1w": round(((current - week_ago) / week_ago) * 100, 2) if week_ago else 0,
        "delta_1m": round(((current - month_ago) / month_ago) * 100, 2) if month_ago else 0,
        "delta_3m": round(((current - month_3_ago) / month_3_ago) * 100, 2) if month_3_ago else 0,
        "delta_6m": round(((current - month_6_ago) / month_6_ago) * 100, 2) if month_6_ago else 0,
        "delta_1y": round(((current - year_ago) / year_ago) * 100, 2) if year_ago else 0,
        "signal": get_signal(current, history),
        "rsi": calculate_rsi(history),
        "macd": calculate_macd(history),
        "pattern": detect_patterns(history)
    }

def fetch_rss_news(feed_urls, limit=30):
    news = []
    # Fetch from all feeds and interleave or sequential
    for url, source_name in feed_urls:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            response = urllib.request.urlopen(req, timeout=10)
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            items = list(root.findall('.//item'))
            for item in items[:limit]:
                title_el = item.find('title')
                link_el = item.find('link')
                pub_date_el = item.find('pubDate')
                
                title = title_el.text if title_el is not None else "News Update"
                link = link_el.text if link_el is not None else "#"
                pub_date = pub_date_el.text if pub_date_el is not None else ""
                
                news.append({"title": title, "link": link, "time": pub_date, "source": source_name})
        except Exception as e:
            print(f"Error fetching news from {url}: {e}")
    
    return news[:limit]

def main():
    print("Fetching market data...")
    
    def get_symbol_data(symbol, fallback_val=100.0):
        raw = fetch_yahoo_finance(symbol)
        time.sleep(0.5) # Intelligent rate limit pause
        if raw:
            return calculate_deltas(raw)
        return calculate_deltas([fallback_val]*252) # Fallback mock

    # Regional (India)
    nifty = get_symbol_data('^NSEI', 24200.0)
    sensex = get_symbol_data('^BSESN', 80000.0)
    vix = get_symbol_data('^INDIAVIX', 14.5)
    
    # Global
    dji = get_symbol_data('^DJI', 38000.0)
    nasdaq = get_symbol_data('^IXIC', 16000.0)
    nikkei = get_symbol_data('^N225', 40000.0)
    hangseng = get_symbol_data('^HSI', 16000.0)
    ftse = get_symbol_data('^FTSE', 8000.0)
    
    # Crypto
    btc = get_symbol_data('BTC-USD', 65000.0)
    eth = get_symbol_data('ETH-USD', 3500.0)
    sol = get_symbol_data('SOL-USD', 150.0)
    
    # Macro
    usd_inr = get_symbol_data('INR=X', 83.5)
    crude = get_symbol_data('BZ=F', 80.0)
    
    # News (fetch 30)
    news_feeds = [
        ('https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms', 'ET Markets'),
        ('http://feeds.bbci.co.uk/news/world/rss.xml', 'BBC World'),
        ('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', 'CNBC Finance')
    ]
    news = fetch_rss_news(news_feeds, limit=30)
    
    if not news:
         news = [
            {"source": "Mock News", "title": "Sensex crashes 2,346 points as crude spikes", "time": "2 hours ago", "link": "#"},
            {"source": "Mock News", "title": "Middle East tensions escalate after strikes", "time": "4 hours ago", "link": "#"}
         ]

    data = {
        "updatedAt": datetime.datetime.utcnow().isoformat() + "Z",
        "marketData": {
            "regional": {
                "nifty": nifty,
                "sensex": sensex,
                "vix": vix,
            },
            "global": {
                "dji": dji,
                "nasdaq": nasdaq,
                "nikkei": nikkei,
                "hangseng": hangseng,
                "ftse": ftse
            },
            "crypto": {
                "btc": btc,
                "eth": eth,
                "sol": sol
            },
            "fiiFlows": {
                 "current": -6200, 
                 "history_30d": [1200, -500, 800, 2100, -300, 1500, 2800, -100, 1900, -6200],
                 "delta_status": "heavy outflow"
            },
            "diiFlows": {
                 "current": 4500,
                 "history_30d": [800, 1100, 900, 500, 1200, 800, 600, 1500, 700, 4500]
            },
            "sectors": {
                'IT': { "change": 1.2, "bias": "Strength" },
                'Pharma': { "change": 0.8, "bias": "Defensive support" },
                'FMCG': { "change": 0.5, "bias": "Stable demand" },
                'Auto': { "change": -2.5, "bias": "Weakness (oil shock impact)" },
                'Realty': { "change": -3.1, "bias": "Weakness (rate sensitivity)" },
                'Oil & Gas': { "change": -4.0, "bias": "Pressure from crude spike" }
            }
        },
        "macroData": {
            "usdInr": usd_inr,
            "crudeOil": crude,
            "inflation": {
                 "current": 5.1,
                 "expectation": "Expected to rise if crude stays >$100."
            }
        },
        "newsData": news
    }

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Data successfully written to {DATA_FILE}")

if __name__ == "__main__":
    main()
