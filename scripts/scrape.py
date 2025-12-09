import json
import requests
from bs4 import BeautifulSoup
import os
import time
import random
from datetime import datetime, timedelta

# 保存先
OUTPUT_PATH = os.path.join(os.getcwd(), 'public', 'events.json')

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Referer": "https://www.google.com/"
}

# ■ 失敗したとき用のダミーデータ生成機能
def generate_mock_data():
    print("🚑 スクレイピングに失敗したため、ダミーデータを生成します...")
    mock_events = []
    companies = ["(株)関西デジタル", "大阪ITソリューションズ", "ネクストイノベーション", "梅田WEBサービス", "神戸テック"]
    
    today = datetime.now()
    for i in range(10):
        # 今日〜明後日の日付で生成
        event_date = today + timedelta(days=random.randint(0, 3))
        company = random.choice(companies)
        
        mock_events.append({
            "title": f"【緊急開催】{company} オンライン説明会",
            "start": event_date.strftime('%Y-%m-%d'),
            "url": "https://www.kokuchpro.com/", 
            "color": "#EF4444", # 赤色（緊急っぽく）
            "description": "これはダミーデータです。スクレイピングがブロックされました。"
        })
    return mock_events

def scrape_kokuchpro():
    print("🕵️‍♀️ こくちーずプロから検索中...")
    url = "https://www.kokuchpro.com/s/q-%E4%BC%9A%E7%A4%BE%E8%AA%AC%E6%98%8E%E4%BC%9A/?online=1"
    
    events = []
    try:
        time.sleep(2) # 待機
        res = requests.get(url, headers=HEADERS, timeout=15)
        res.encoding = res.apparent_encoding
        
        if res.status_code != 200:
            return []

        soup = BeautifulSoup(res.text, 'html.parser')
        event_cards = soup.find_all('div', class_='event-card')
        
        print(f"   👉 {len(event_cards)} 件発見")

        for card in event_cards:
            try:
                title = card.find('h3', class_='event-title').get_text(strip=True)
                link = card.find('h3', class_='event-title').find('a')['href']
                
                # 日付取得 (簡易版)
                date_div = card.find('div', class_='event-date')
                raw_date = date_div.get_text(strip=True) if date_div else ""
                # "2025/12/08" のような文字列を想定して整形
                formatted_date = raw_date[:10].replace('.', '-').replace('/', '-')

                events.append({
                    "title": f"【Zoom】{title}",
                    "start": formatted_date,
                    "url": link,
                    "color": "#F59E0B",
                    "description": "こくちーずプロより"
                })
            except:
                continue

    except Exception as e:
        print(f"❌ エラー: {e}")
    
    return events

def main():
    # 1. まずスクレイピングを試す
    final_list = scrape_kokuchpro()
    
    # 2. もし0件だったら、ダミーデータを使う（これでファイル生成漏れを防ぐ！）
    if len(final_list) == 0:
        print("⚠️ データが取れなかったので救済措置を実行します")
        final_list = generate_mock_data()

    # 3. 必ず保存する
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 保存完了！ 合計 {len(final_list)} 件のデータを {OUTPUT_PATH} に書き込みました。")

if __name__ == "__main__":
    main()
