from googlemaps import Client
import os
import json
from datetime import datetime
import time
import dotenv

dotenv.load_dotenv()

def get_nearby_landmarks(api_key, location_name, radius=2000, max_results=1000):
    """
    取得指定地點附近的地標資訊
    
    參數:
    api_key (str): Google Maps API 金鑰
    location_name (str): 搜尋的中心位置名稱
    radius (int): 搜尋半徑（單位：公尺）
    max_results (int): 最大結果數量
    
    回傳:
    list: 包含地標資訊的列表
    """
    try:
        gmaps = Client(key=api_key)
        
        # 取得位置座標
        geocode_result = gmaps.geocode(location_name)
        if not geocode_result:
            return "找不到指定位置"
            
        location = geocode_result[0]['geometry']['location']
        
        # 搜尋附近地標
        landmarks = []
        next_page_token = None
        
        while len(landmarks) < max_results:
            # 如果有 next_page_token，需要稍等一下才能使用
            if next_page_token:
                time.sleep(2)  # Google API 要求在使用 page token 之前要等待
            
            # 執行搜尋
            places_result = gmaps.places_nearby(
                location=(location['lat'], location['lng']),
                radius=radius,
                language='zh-TW',
                page_token=next_page_token
            )
            
            # 處理結果
            for place in places_result.get('results', []):
                landmark_info = {
                    '名稱': place['name'],
                    '地址': place.get('vicinity', '無地址資訊'),
                    '經度': place['geometry']['location']['lng'],
                    '緯度': place['geometry']['location']['lat'],
                    '類型': place.get('types', [])
                }
                landmarks.append(landmark_info)
            
            # 檢查是否有下一頁
            next_page_token = places_result.get('next_page_token')
            if not next_page_token:
                break
        
        return landmarks[:max_results]  # 確保不超過要求的數量
        
    except Exception as e:
        return f"發生錯誤: {str(e)}"

if __name__ == "__main__":
    API_KEY = os.getenv("GOOGLE_API_KEY")
    LOCATION = "國立交通大學"
    
    results = get_nearby_landmarks(API_KEY, LOCATION)
    
    if isinstance(results, list):
        # 建立輸出檔案名稱（包含時間戳記）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"landmarks_{LOCATION}_{timestamp}.json"
        
        # 儲存為 JSON 檔案
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
            
        print(f"成功取得 {len(results)} 個地標")
        print(f"資料已儲存至：{filename}")
    else:
        print(results)
