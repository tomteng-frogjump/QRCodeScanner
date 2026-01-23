// 應用程式配置
window.APP_CONFIG = {
  // API 端點
  API: {
    CHECK_IN: "https://n8n.frog-jump.com/webhook/b5b93953-713e-43fd-9b2d-e7cfe2cc40aa",
    CONFIRM_CHECK_IN: "https://n8n.frog-jump.com/webhook/84b89270-ef3e-4ef4-aec3-a63ebadc6de7",
    DIRECT_INPUT: "https://frogjump-n8n.ddns.net/webhook/716308eb-2cba-480e-8a72-f96de4461e42",
    SEND_NO_SHOW_LIST: "https://frogjump-n8n.ddns.net/webhook/b3fa8fa7-send-no-show-list",
    SEND_SUMMARY: "https://frogjump-n8n.ddns.net/webhook/b3fa8fa7-send-summary"
  },
  
  // 應用程式常數
  CONSTANTS: {
    EVENT_ID: "20260117",
    DEFAULT_TOKEN: "VAWE3839JJ2ujdnH",
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
  
  // 儲存鍵值
  STORAGE_KEYS: {
    DE_AUTH: "deAuth",
    USER_DATA: "userData"
  },
  
  // 頁面路徑
  PAGES: {
    SCANNER: "QRCodeScanner.html",
    AUTH: "Auth.html",
    ADMIN_ACTIONS: "AdminActions.html",
    DIRECT_INPUT: "DirectInput.html"
  }
};