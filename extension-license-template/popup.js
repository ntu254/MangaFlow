document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    const btnActivate = document.getElementById('btn-activate');
    const inputKey = document.getElementById('license-key');
    const msgError = document.getElementById('msg-error');

    // Mở lên kiểm tra ngay xem đã có Key hợp lệ trong máy chưa
    chrome.storage.local.get(['licenseKey', 'isActivated'], (data) => {
        if (data.isActivated && data.licenseKey) {
            loginScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
        }
    });

    // Xử lý khi khách bấm kích hoạt
    btnActivate.addEventListener('click', () => {
        const key = inputKey.value.trim();
        if (!key) {
            msgError.innerText = "Vui lòng nhập Key!";
            return;
        }

        btnActivate.innerText = "Đang kiểm tra...";
        msgError.innerText = "";
        
        // Nhờ background.js gọi lên mạng để check Supabase
        chrome.runtime.sendMessage({ action: "VERIFY_LICENSE", key: key }, (response) => {
            btnActivate.innerText = "Kích hoạt Extension";
            if (response.success) {
                chrome.storage.local.set({ licenseKey: key, isActivated: true });
                loginScreen.classList.add('hidden');
                mainScreen.classList.remove('hidden');
            } else {
                msgError.innerText = response.message;
            }
        });
    });
});
