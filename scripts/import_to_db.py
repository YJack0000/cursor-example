import json
import os
import glob
import psycopg2
from psycopg2.extras import execute_values
import dotenv

dotenv.load_dotenv()

def connect_to_db():
    """建立資料庫連線"""
    return psycopg2.connect(
        dbname="landmarks",
        user="postgres",
        password="postgres",
        host="localhost",
        port="5432"
    )

def create_table(conn):
    """建立資料表"""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                longitude DECIMAL(10, 7),
                latitude DECIMAL(10, 7),
                types TEXT[],
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
    conn.commit()

def import_landmarks(conn, json_file):
    """從 JSON 檔案匯入資料到資料庫"""
    with open(json_file, 'r', encoding='utf-8') as f:
        landmarks = json.load(f)

    # 準備資料
    values = [
        (
            landmark['名稱'],
            landmark['地址'],
            float(landmark['經度']),
            float(landmark['緯度']),
            landmark['類型']
        )
        for landmark in landmarks
    ]

    # 批次插入資料
    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO properties (name, address, longitude, latitude, types)
            VALUES %s
            """,
            values,
            template="(%s, %s, %s, %s, %s)"
        )
    
    conn.commit()
    return len(values)

def verify_import(conn):
    """驗證匯入結果，顯示一筆資料"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, name, address, longitude, latitude, 
                   array_to_string(types, ', ') as types, 
                   created_at 
            FROM properties 
            LIMIT 1
        """)
        row = cur.fetchone()
        if row:
            print("\n資料驗證 - 顯示第一筆資料：")
            print(f"ID: {row[0]}")
            print(f"名稱: {row[1]}")
            print(f"地址: {row[2]}")
            print(f"經度: {row[3]}")
            print(f"緯度: {row[4]}")
            print(f"類型: {row[5]}")
            print(f"建立時間: {row[6]}")
        else:
            print("資料表中沒有資料")

def main():
    # 連接資料庫
    conn = connect_to_db()
    
    try:
        # 建立資料表
        create_table(conn)
        
        # 找出最新的 JSON 檔案
        json_files = glob.glob("landmarks_*.json")
        if not json_files:
            print("找不到 landmarks JSON 檔案")
            return
        
        latest_file = max(json_files, key=os.path.getctime)
        
        # 匯入資料
        count = import_landmarks(conn, latest_file)
        print(f"成功匯入 {count} 筆資料到資料庫")
        
        # 驗證匯入結果
        verify_import(conn)
        
    except Exception as e:
        print(f"發生錯誤: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main() 