-- 1. Tạo bảng (Hoặc nếu đã tạo rồi thì chạy lệnh Xóa bảng cũ bằng: DROP TABLE licenses CASCADE;)
CREATE TABLE licenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  status text DEFAULT 'active',
  device_ids text[] DEFAULT '{}', -- Mảng lưu danh sách mã máy tính
  max_devices integer DEFAULT 3,  -- Giới hạn số lượng máy mặc định (có thể đổi)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Bật bảo mật
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- 3. Tạo Hàm xử lý API
CREATE OR REPLACE FUNCTION verify_license(p_key text, p_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_license record;
BEGIN
  SELECT * INTO v_license FROM licenses WHERE key = p_key;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'License Key không tồn tại!');
  END IF;

  IF v_license.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'message', 'License Key này đã bị khóa!');
  END IF;

  -- Kiểm tra xem thiết bị này đã từng kích hoạt chưa
  IF p_device_id = ANY(v_license.device_ids) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Xác thực hợp lệ');
  END IF;

  -- Nếu thiết bị chưa có, kiểm tra xem đã vượt quá số máy cho phép chưa
  IF array_length(v_license.device_ids, 1) >= v_license.max_devices THEN
    RETURN jsonb_build_object('success', false, 'message', 'Key này đã đạt giới hạn tối đa ' || v_license.max_devices || ' thiết bị!');
  END IF;

  -- Thêm thiết bị mới vào danh sách và lưu lại
  UPDATE licenses SET device_ids = array_append(device_ids, p_device_id) WHERE key = p_key;
  RETURN jsonb_build_object('success', true, 'message', 'Kích hoạt thiết bị mới thành công!');
END;
$$;

-- ============================================================
-- LỆNH INSERT KEY ĐỂ BẠN TẠO KEY BÁN CHO KHÁCH:
-- Copy lệnh dưới đây chạy để tạo Key mới có giới hạn 3 máy
-- ============================================================
INSERT INTO licenses (key, max_devices) 
VALUES ('VIP-KEY-3MAY', 3);
