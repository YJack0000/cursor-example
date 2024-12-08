import psycopg2
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

def modify_table(conn):
    """修改資料表，添加 PostGIS 相關欄位"""
    with conn.cursor() as cur:
        # 安裝 PostGIS 擴充功能
        cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        
        # 修改資料表結構
        cur.execute("""
            ALTER TABLE properties 
            ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);
        """)
        
        # 更新現有資料的地理位置欄位
        cur.execute("""
            UPDATE properties 
            SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
            WHERE geom IS NULL;
        """)
        
        # 創建地理位置索引
        cur.execute("""
            CREATE INDEX IF NOT EXISTS properties_geom_idx 
            ON properties USING GIST (geom);
        """)
        
        # 創建觸發器函數
        cur.execute("""
            CREATE OR REPLACE FUNCTION update_geom()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        
        # 創建觸發器
        cur.execute("""
            DROP TRIGGER IF EXISTS update_geom_trigger ON properties;
            CREATE TRIGGER update_geom_trigger
                BEFORE INSERT OR UPDATE ON properties
                FOR EACH ROW
                EXECUTE FUNCTION update_geom();
        """)
    
    conn.commit()

def verify_postgis(conn):
    """驗證 PostGIS 設置"""
    with conn.cursor() as cur:
        # 檢查 PostGIS 版本
        cur.execute("SELECT PostGIS_version();")
        postgis_version = cur.fetchone()[0]
        print(f"\nPostGIS 版本: {postgis_version}")
        
        # 檢查地理位置欄位
        cur.execute("""
            SELECT 
                name,
                ST_AsText(geom) as geom_text,
                ST_X(geom) as longitude,
                ST_Y(geom) as latitude
            FROM properties 
            LIMIT 1;
        """)
        row = cur.fetchone()
        if row:
            print("\n資料驗證 - 顯示第一筆資料：")
            print(f"名稱: {row[0]}")
            print(f"地理位置 (WKT): {row[1]}")
            print(f"經度: {row[2]}")
            print(f"緯度: {row[3]}")
        else:
            print("資料表中沒有資料")

def main():
    conn = connect_to_db()
    
    try:
        print("開始修改資料表...")
        modify_table(conn)
        print("資料表修改完成")
        
        print("\n驗證 PostGIS 設置...")
        verify_postgis(conn)
        
    except Exception as e:
        print(f"發生錯誤: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()