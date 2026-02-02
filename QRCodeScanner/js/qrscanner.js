import APP_CONFIG, { API, CONSTANTS, QR_SCANNER, PERFORMANCE_PRESETS, SCAN_SPEED_MAP, DEVICE_DETECTION, STORAGE_KEYS } from './config.js';
import { storage, createSignature, parseQRCode, navigation, apiCall, handleApiError } from './common.js';

// QR 掃描器功能
export default class QRScanner {
  constructor() {
    // 狀態變數
    this.isScanning = false;
    this.lastScanTime = 0;
    this.animationFrameId = null;
    this.video = null;
    this.canvas = null;
    this.context = null;
    
    // 掃描器設定
    this.settings = this.loadSettings();
  }
  
  // 初始化
  init() {
    this.video = $("#video")[0];
    this.canvas = $("#canvas")[0];
    this.context = this.canvas.getContext("2d");
    
    // 載入保存的 DEAuth
    const savedDEAuth = storage.getDEAuth();
    if (savedDEAuth) {
      $("#deAuthInput").val(savedDEAuth);
    }
    
    // 初始化設定
    this.initializeSettings();
    
    // 初始化按鈕狀態
    this.updateButtonStates();
    
    // 綁定事件
    this.bindEvents();
  }
  
  // 載入設定
  loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCANNER_SETTINGS);
      if (saved) {
        return { ...this.getDefaultSettings(), ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('無法載入設定:', error);
    }
    return this.getDefaultSettings();
  }
  
  // 取得預設設定
  getDefaultSettings() {
    const detectedLevel = DEVICE_DETECTION.detectPerformanceLevel();
    const preset = PERFORMANCE_PRESETS[detectedLevel];
    
    return {
      performancePreset: detectedLevel,
      videoConstraints: preset.videoConstraints,
      scanSpeed: preset.scanSpeed, // 使用等級值
      scanScale: preset.scanScale,
      scanRegionSize: preset.scanRegionSize
    };
  }
  
  // 保存設定
  saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SCANNER_SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('無法保存設定:', error);
    }
  }
  
  // 初始化設定界面
  initializeSettings() {
    // 設定預設值
    $("#performancePreset").val(this.settings.performancePreset);
    $("#scanSpeed").val(this.settings.scanSpeed);
    $("#frameRate").val(this.settings.videoConstraints.frameRate.ideal);
    
    // 更新顯示值
    this.updateScanSpeedDisplay(this.settings.scanSpeed);
    $("#frameRateValue").text(this.settings.videoConstraints.frameRate.ideal + 'fps');
    
    // 檢查是否為自定義設定
    this.checkForCustomSettings();
    
    // 顯示設備資訊
    this.updateDeviceInfo();
  }
  
  // 更新掃描速度顯示
  updateScanSpeedDisplay(speed) {
    const speedNames = {
      1: '快速',
      2: '一般', 
      3: '省電'
    };
    $("#scanSpeedValue").text(speedNames[speed] || '一般');
  }
  
  // 更新設備資訊
  updateDeviceInfo() {
    const memory = navigator.deviceMemory || '未知';
    const cores = navigator.hardwareConcurrency || '未知';
    const level = DEVICE_DETECTION.detectPerformanceLevel();
    const levelName = PERFORMANCE_PRESETS[level].name;
    
    $("#deviceInfo").html(`
      記憶體: ${memory}GB<br>
      CPU核心: ${cores}個<br>
      建議模式: ${levelName}
    `);
  }
  
  // 綁定事件
  bindEvents() {
    const self = this;
    
    // 監聽 DEAuth 輸入變化並保存
    $("#deAuthInput").on('input', function() {
      storage.saveDEAuth($(this).val());
      self.updateButtonStates();
    });
    
    // 開始掃描按鈕
    $("#startBtn").on("click", function() {
      self.startCamera();
    });
    
    // 停止掃描按鈕
    $("#stopBtn").on("click", function() {
      self.stopCamera();
      self.resetToInitialState();
    });
    
    // 進階操作按鈕
    $("#adminActionsBtn").on('click', function() {
      const current = $("#deAuthInput").val();
      if (current) {
        storage.saveDEAuth(current);
      }
      navigation.goToAdminActions();
    });
    
    // 直接輸入按鈕
    $("#directInputBtn").on('click', function() {
      const current = $("#deAuthInput").val();
      if (current) {
        storage.saveDEAuth(current);
      }
      navigation.goToDirectInput();
    });
    
    // 設定模組事件
    this.bindSettingsEvents();
  }
  
  // 綁定設定模組事件
  bindSettingsEvents() {
    const self = this;
    
    // 效能預設組變更
    $("#performancePreset").on('change', function() {
      const preset = PERFORMANCE_PRESETS[$(this).val()];
      if ($(this).val() !== 'CUSTOM') {
        self.applyPreset(preset);
      }
    });
    
    // 掃描速度變更
    $("#scanSpeed").on('input', function() {
      const speedLevel = parseInt($(this).val());
      self.updateScanSpeedDisplay(speedLevel);
      self.checkForCustomSettings();
    });
    
    // 影格率變更
    $("#frameRate").on('input', function() {
      $("#frameRateValue").text($(this).val() + 'fps');
      self.checkForCustomSettings();
    });
    
    // 儲存設定按鈕
    $("#saveSettings").on('click', function() {
      self.saveSettingsFromModal();
    });
  }
  
  // 檢查是否為自定義設定
  checkForCustomSettings() {
    const currentSettings = {
      frameRate: parseInt($("#frameRate").val()),
      scanSpeed: parseInt($("#scanSpeed").val())
    };
    
    // 檢查是否符合任何預設組
    const presets = ['LOW_END', 'BALANCED', 'HIGH_PERFORMANCE'];
    let matchesPreset = false;
    
    for (let presetKey of presets) {
      const preset = PERFORMANCE_PRESETS[presetKey];
      if (preset.videoConstraints.frameRate.ideal === currentSettings.frameRate &&
          preset.scanSpeed === currentSettings.scanSpeed) {
        matchesPreset = true;
        $("#performancePreset").val(presetKey);
        break;
      }
    }
    
    // 如果不符合任何預設組，設為自定義
    if (!matchesPreset) {
      $("#performancePreset").val('CUSTOM');
    }
  }
  
  // 套用預設組
  applyPreset(preset) {
    $("#scanSpeed").val(preset.scanSpeed);
    $("#frameRate").val(preset.videoConstraints.frameRate.ideal);
    this.updateScanSpeedDisplay(preset.scanSpeed);
    $("#frameRateValue").text(preset.videoConstraints.frameRate.ideal + 'fps');
  }
  
  // 從模組保存設定
  saveSettingsFromModal() {
    const preset = $("#performancePreset").val();
    const presetConfig = PERFORMANCE_PRESETS[preset];
    
    // 如果是自定義設定，使用當前表單值
    if (preset === 'CUSTOM') {
      this.settings = {
        performancePreset: 'CUSTOM',
        videoConstraints: {
          ...presetConfig.videoConstraints,
          frameRate: { ideal: parseInt($("#frameRate").val()) }
        },
        scanSpeed: parseInt($("#scanSpeed").val()),
        scanScale: presetConfig.scanScale,
        scanRegionSize: presetConfig.scanRegionSize
      };
    } else {
      // 使用預設組設定
      this.settings = {
        performancePreset: preset,
        videoConstraints: presetConfig.videoConstraints,
        scanSpeed: presetConfig.scanSpeed,
        scanScale: presetConfig.scanScale,
        scanRegionSize: presetConfig.scanRegionSize
      };
    }
    
    this.saveSettings();
    
    // 關閉模組
    $('#settingsModal').modal('hide');
    
    // 顯示成功訊息
    $("#result").html('<span class="success">✓ 設定已保存</span>').removeClass().addClass("success");
    setTimeout(() => {
      $("#result").html('尚未掃描到資料').removeClass();
    }, 2000);
  }
  
  // 鎖定設定控制
  lockSettings() {
    $("#settingsBtn").prop('disabled', true);
    $("#performancePreset").prop('disabled', true);
    $("#videoQuality").prop('disabled', true);
    $("#scanSpeed").prop('disabled', true);
    $("#frameRate").prop('disabled', true);
    $("#saveSettings").prop('disabled', true);
  }
  
  // 解鎖設定控制
  unlockSettings() {
    $("#settingsBtn").prop('disabled', false);
    $("#performancePreset").prop('disabled', false);
    $("#videoQuality").prop('disabled', false);
    $("#scanSpeed").prop('disabled', false);
    $("#frameRate").prop('disabled', false);
    $("#saveSettings").prop('disabled', false);
  }
  
  // 開始相機
  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: this.settings.videoConstraints
      });
      
      this.video.srcObject = stream;
      this.video.style.display = "block";
      $("#scanOverlay").show();
      
      // 更新UI狀態
      $("#startBtn").hide();
      $("#stopBtn").show();
      $("#deAuthInput").prop('disabled', true);
      $("#adminActionsBtn").prop('disabled', true);
      this.lockSettings(); // 鎖定設定
      $("#result").html("正在掃描QRCode...").removeClass().addClass("info");
      $("#apiResult").html("");
      
      this.isScanning = false;
      
      const self = this;
      this.video.addEventListener('loadedmetadata', () => {
        self.isScanning = true;
        requestAnimationFrame(self.scanQRCode.bind(self));
      });
      
      if (this.video.readyState >= 2) {
        this.isScanning = true;
        requestAnimationFrame(this.scanQRCode.bind(this));
      }
    } catch (err) {
      $("#result").text("無法存取相機: " + err).removeClass().addClass("error");
      this.isScanning = false;
      this.resetToInitialState();
    }
  }
  
  // 停止相機
  stopCamera() {
    if (this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
      this.video.style.display = "none";
      $("#scanOverlay").hide();
      $("#result").html("尚未掃描到資料").removeClass().addClass("info");
    }
    this.isScanning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  // 掃描 QR Code
  scanQRCode(currentTime) {
    // 將等級轉換為毫秒
    const scanInterval = SCAN_SPEED_MAP[this.settings.scanSpeed] || 200;
    
    // 頻率控制
    if (currentTime - this.lastScanTime < scanInterval) {
      if (this.isScanning) {
        this.animationFrameId = requestAnimationFrame(this.scanQRCode.bind(this));
      }
      return;
    }
    
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA && this.isScanning) {
      this.lastScanTime = currentTime;
      
      // 計算掃描區域 (使用 scanRegionSize)
      const videoWidth = this.video.videoWidth;
      const videoHeight = this.video.videoHeight;
      const scanWidth = Math.floor(videoWidth * this.settings.scanRegionSize);
      const scanHeight = Math.floor(videoHeight * this.settings.scanRegionSize);
      const scanX = Math.floor((videoWidth - scanWidth) / 2);
      const scanY = Math.floor((videoHeight - scanHeight) / 2);
      
      // 縮放處理 (使用 scanScale)
      const scaledWidth = Math.floor(scanWidth * this.settings.scanScale);
      const scaledHeight = Math.floor(scanHeight * this.settings.scanScale);
      
      this.canvas.width = scaledWidth;
      this.canvas.height = scaledHeight;
      
      this.context.drawImage(
        this.video,
        scanX, scanY, scanWidth, scanHeight,
        0, 0, scaledWidth, scaledHeight
      );
      
      const imgData = this.context.getImageData(0, 0, scaledWidth, scaledHeight);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: "dontInvert"
      });
      
      if (code) {
        this.handleQRCodeDetected(code.data);
      }
    }
    
    if (this.isScanning) {
      this.animationFrameId = requestAnimationFrame(this.scanQRCode.bind(this));
    }
  }
  
  // 處理 QR Code 檢測
  handleQRCodeDetected(data) {
    this.isScanning = false;
    
    const parsedData = parseQRCode(data);
    
    if (parsedData.valid) {
      $("#result").html(`<span class="success">✓ 掃描成功</span><br>ID: ${parsedData.id}`)
        .removeClass().addClass("success");
      this.callAPIAndRedirect(parsedData);
    } else {
      $("#result").html(`<span class="error">✗ 格式錯誤</span><br>應為：最長10碼任意文字可包含符號;固定16碼英數字<br>掃描到: ${parsedData.original}`)
        .removeClass().addClass("error");
      $("#apiResult").html('<span class="error">格式不符，請重新開始掃描</span>');
      
      const self = this;
      setTimeout(() => {
        self.handleScanFailure("格式錯誤，請重新開始");
      }, 3000);
    }
  }
  
  // 呼叫 API 並跳轉
  async callAPIAndRedirect(parsedData) {
    try {
      const deAuthInput = $("#deAuthInput").val().trim();
      
      storage.saveDEAuth(deAuthInput);
      
      if (!deAuthInput) {
        $("#apiResult").html('<span class="error">請先輸入DEAuth認證碼</span>');
        setTimeout(() => {
          this.handleScanFailure("請輸入認證碼後重新掃描");
        }, 2000);
        return;
      }
      
      $("#apiResult").html('<span class="info">正在呼叫API...</span>');
      
      const deAuthSignature = createSignature(deAuthInput, parsedData.token);
      
      console.log("start calling api");
      const response = await apiCall(
        API.CHECK_IN,
        {
          ID: parsedData.id,
          EventID: CONSTANTS.EVENT_ID
        },
        deAuthSignature
      );
      
      console.log("api called, status:", response.status);
      
      if (response.ok) {
        const result = response.data;
        
        // 檢查是否已經報到
        if (result.CheckIn === true) {
          alert("已經報到，不可重複報到！");
          this.handleScanFailure("已經報到，請重新掃描其他QRCode");
          return;
        }
        
        $("#apiResult").html(`<span class="success">✓ API呼叫成功，準備跳轉...</span>`);
        
        setTimeout(() => {
          navigation.goToAuth(result, deAuthSignature);
        }, CONSTANTS.REDIRECT_DELAY);
      } else {
        const errorMessage = handleApiError(response);
        $("#apiResult").html(`<span class="error">✗ ${errorMessage}</span>`);
        
        setTimeout(() => {
          this.handleScanFailure(errorMessage);
        }, response.status === 404 ? 3000 : 2000);
      }
    } catch (error) {
      $("#apiResult").html(`<span class="error">✗ 網路錯誤: ${error.message}</span>`);
      setTimeout(() => {
        this.handleScanFailure("網路錯誤，請重新開始");
      }, 2000);
    }
  }
  
  // 處理掃描失敗
  handleScanFailure(message) {
    this.stopCamera();
    $("#result").html(message).removeClass().addClass("error");
    $("#apiResult").html("");
    this.resetToInitialState();
  }
  
  // 重置到初始狀態
  resetToInitialState() {
    $("#startBtn").show();
    $("#stopBtn").hide();
    $("#deAuthInput").prop('disabled', false);
    this.unlockSettings(); // 解鎖設定
    this.updateButtonStates();
  }
  
  // 更新按鈕狀態
  updateButtonStates() {
    const deAuthValue = $("#deAuthInput").val().trim();
    const hasValue = deAuthValue.length > 0;
    
    $("#startBtn").prop('disabled', !hasValue);
    $("#adminActionsBtn").prop('disabled', !hasValue);
  }
}