// THAY BẰNG THÔNG TIN CỦA BẠN TRONG PROJECT SUPABASE
const SUPABASE_URL = "https://YOUR_SUPABASE_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function getDeviceId() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['deviceId'], function(result) {
            if (result.deviceId) {
                resolve(result.deviceId);
            } else {
                const newId = generateUUID();
                chrome.storage.local.set({ deviceId: newId }, () => resolve(newId));
            }
        });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "VERIFY_LICENSE") {
        (async () => {
            try {
                const deviceId = await getDeviceId();
                const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_license`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({ 
                        p_key: request.key, 
                        p_device_id: deviceId 
                    })
                });

                const data = await res.json();
                sendResponse(data);
            } catch (e) {
                sendResponse({ success: false, message: "Lỗi kết nối máy chủ Supabase!" });
            }
        })();
        return true; 
    }
});
