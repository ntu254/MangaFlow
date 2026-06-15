import os
import cv2
import numpy as np
from app.model_loader import model
from app.bubble_service import process_bubble_whitening, detect_bubbles_info

def create_dummy_manga_page(path):
    # Tạo một ảnh trắng kích thước 800x1200
    img = np.ones((1200, 800, 3), dtype=np.uint8) * 255
    
    # Vẽ vài khung tranh (panels)
    cv2.rectangle(img, (50, 50), (750, 550), (0, 0, 0), 4)
    cv2.rectangle(img, (50, 580), (750, 1150), (0, 0, 0), 4)
    
    # Vẽ vài bong bóng thoại hình oval/tròn màu trắng viền đen
    # Bubble 1: Panel 1
    cv2.ellipse(img, (400, 300), (120, 80), 0, 0, 360, (0, 0, 0), 3)
    cv2.ellipse(img, (400, 300), (117, 77), 0, 0, 360, (255, 255, 255), -1) # fill trắng
    cv2.putText(img, "TEST BUBBLE", (320, 310), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
    
    # Bubble 2: Panel 2
    cv2.ellipse(img, (250, 800), (100, 70), 0, 0, 360, (0, 0, 0), 3)
    cv2.ellipse(img, (250, 800), (97, 67), 0, 0, 360, (255, 255, 255), -1) # fill trắng
    cv2.putText(img, "HELLO WORLD", (180, 810), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)

    os.makedirs(os.path.dirname(path), exist_ok=True)
    cv2.imwrite(path, img)
    print(f"Created dummy manga page at {path}")

def run_test():
    input_path = "uploads/test_page.png"
    output_path = "outputs/test_page_whitened.png"
    
    create_dummy_manga_page(input_path)
    
    print("Running detect_bubbles_info...")
    bubbles = detect_bubbles_info(input_path, model, conf=0.1) # Dùng conf thấp vì đây là ảnh vẽ tay đơn giản
    print(f"Detected {len(bubbles)} bubbles:")
    for b in bubbles:
        print(f" - ID: {b['id']}, BBox: {b['bbox']}, Confidence: {b['confidence']}")
        
    print("\nRunning process_bubble_whitening...")
    out_path = process_bubble_whitening(input_path, model, output_path, conf=0.1)
    
    if os.path.exists(out_path):
        print(f"SUCCESS: Whitened image saved to {out_path}")
    else:
        print("FAILED: Output image not found!")

if __name__ == "__main__":
    run_test()
