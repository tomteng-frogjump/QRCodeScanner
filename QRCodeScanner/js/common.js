import APP_CONFIG, { STORAGE_KEYS, PAGES } from './config.js';

// 儲存管理
export const storage = {
    // 保存 DEAuth
    saveDEAuth: function (value) {
        sessionStorage.setItem(STORAGE_KEYS.DE_AUTH, value);
    },

    // 取得 DEAuth
    getDEAuth: function () {
        return sessionStorage.getItem(STORAGE_KEYS.DE_AUTH);
    },

    // 保存用戶資料
    saveUserData: function (data) {
        sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
    },

    // 取得用戶資料
    getUserData: function () {
        const data = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    },

    // 清除所有儲存資料
    clear: function () {
        sessionStorage.removeItem(STORAGE_KEYS.DE_AUTH);
        sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
};

// 創建簽章並轉換為Base64編碼
export function createSignature(deAuthInput, token) {
    const signatureData = deAuthInput + token;
    return btoa(signatureData);
}

// 解析QRCode格式：最長10碼任意文字可包含符號;固定16碼英數字
export function parseQRCode(data) {
    const regex = /^(.{1,10});([A-Za-z0-9]{16})$/;
    const match = data.match(regex);

    if (match) {
        return {
            valid: true,
            id: match[1],
            token: match[2],
            original: data
        };
    }

    return {
        valid: false,
        original: data
    };
}

// 設定狀態訊息
export function setStatus(elementId, message, type = '') {
    const $element = $('#' + elementId);
    $element.removeClass().addClass('status');
    if (type) {
        $element.addClass(type);
    }
    $element.html(message);
}

// 設定狀態徽章
export function setBadge(elementId, value) {
    const $element = $("#" + elementId);
    if (value) {
        $element.text("是").removeClass().addClass("status-badge badge-true");
    } else {
        $element.text("否").removeClass().addClass("status-badge badge-false");
    }
}

// 頁面導航
export const navigation = {
    goToScanner: function () {
        window.location.href = PAGES.SCANNER;
    },

    goToAuth: function (apiData, deAuthSignature) {
        const encodedData = encodeURIComponent(JSON.stringify(apiData));
        window.location.href = PAGES.AUTH + "?data=" + encodedData + "&deAuthSignature=" + encodeURIComponent(deAuthSignature);
    },

    goToAdminActions: function () {
        window.location.href = PAGES.ADMIN_ACTIONS;
    },

    goToDirectInput: function () {
        window.location.href = PAGES.DIRECT_INPUT;
    }
};

// URL 參數處理
export function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// API 呼叫通用函數
export async function apiCall(url, data, deAuthSignature) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'DEAuth': deAuthSignature
            },
            body: JSON.stringify(data)
        });

        return {
            ok: response.ok,
            status: response.status,
            data: response.ok ? await response.json() : null,
            error: response.ok ? null : await response.text()
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            data: null,
            error: error.message
        };
    }
}

// 錯誤處理
export function handleApiError(response) {
    if (response.status === 404) {
        try {
            const errorData = JSON.parse(response.error);
            if (errorData.Message) {
                return errorData.Message;
            }
        } catch (e) {
            // 無法解析JSON，使用預設訊息
        }
    }

    return `API呼叫失敗 (HTTP ${response.status})`;
}