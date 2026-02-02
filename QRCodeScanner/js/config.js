// 應用程式配置
const APP_CONFIG = {
    // API 端點
    API: {
        CHECK_IN: "https://n8n.frog-jump.com/webhook/716308eb-2cba-480e-8a72-f96de4461e42",
        CONFIRM_CHECK_IN: "https://n8n.frog-jump.com/webhook/fee6b282-61b0-4a43-9105-f2b58a18082f",
        DIRECT_INPUT: "https://frogjump-n8n.ddns.net/webhook/716308eb-2cba-480e-8a72-f96de4461e42",
        SEND_NO_SHOW_LIST: "https://frogjump-n8n.ddns.net/webhook/b3fa8fa7-send-no-show-list",
        SEND_SUMMARY: "https://frogjump-n8n.ddns.net/webhook/b3fa8fa7-send-summary"
    },

    // 應用程式常數
    CONSTANTS: {
        EVENT_ID: "20260314",
        DEFAULT_TOKEN: "8Kx9mN4pQ7vR2aYu",
        REDIRECT_DELAY: 200
    },

    // QR 掃描器設定
    QR_SCANNER: {
        SCAN_INTERVAL: 150,      // 掃描間隔(毫秒)
        SCAN_SCALE: 0.5,         // 掃描解析度縮放比例
        VIDEO_CONSTRAINTS: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
        }
    },

    // 效能預設組
    PERFORMANCE_PRESETS: {
        LOW_END: {
            name: "省電模式 (低階設備)",
            videoConstraints: {
                facingMode: "environment",
                width: { ideal: 480 },
                height: { ideal: 360 },
                frameRate: { ideal: 15 }
            },
            scanSpeed: 3, // 省電
            scanScale: 0.3,
            scanRegionSize: 0.4
        },
        BALANCED: {
            name: "平衡模式",
            videoConstraints: {
                facingMode: "environment",
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 20 }
            },
            scanSpeed: 2, // 一般
            scanScale: 0.4,
            scanRegionSize: 0.5
        },
        HIGH_PERFORMANCE: {
            name: "高效模式 (高階設備)",
            videoConstraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            },
            scanSpeed: 1, // 快速
            scanScale: 0.6,
            scanRegionSize: 0.6
        },
        CUSTOM: {
            name: "自定義設定",
            videoConstraints: {
                facingMode: "environment",
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 20 }
            },
            scanSpeed: 2, // 一般
            scanScale: 0.4,
            scanRegionSize: 0.5
        }
    },

    // 掃描速度對應表 (等級 -> 毫秒)
    SCAN_SPEED_MAP: {
        1: 100, // 快速
        2: 300, // 一般
        3: 500  // 省電
    },

    // 設備檢測
    DEVICE_DETECTION: {
        detectPerformanceLevel() {
            try {
                const memory = navigator.deviceMemory || 2;
                const cores = navigator.hardwareConcurrency || 2;
                const userAgent = navigator.userAgent.toLowerCase();
                
                // 檢測低階設備
                if (memory <= 2 || cores <= 4) return 'LOW_END';
                if (memory <= 4 || cores <= 6) return 'BALANCED';
                return 'HIGH_PERFORMANCE';
            } catch (error) {
                return 'BALANCED'; // 預設值
            }
        }
    },

    // 儲存鍵值
    STORAGE_KEYS: {
        DE_AUTH: "deAuth",
        USER_DATA: "userData",
        SCANNER_SETTINGS: "scannerSettings"
    },

    // 頁面路徑
    PAGES: {
        SCANNER: "QRCodeScanner.html",
        AUTH: "Auth.html",
        ADMIN_ACTIONS: "AdminActions.html",
        DIRECT_INPUT: "DirectInput.html"
    }
};

export default APP_CONFIG;
export const { API, CONSTANTS, QR_SCANNER, PERFORMANCE_PRESETS, SCAN_SPEED_MAP, DEVICE_DETECTION, STORAGE_KEYS, PAGES } = APP_CONFIG;