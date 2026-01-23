// QR 掃描器功能
window.QRScanner = {
  // 狀態變數
  isScanning: false,
  lastScanTime: 0,
  animationFrameId: null,
  video: null,
  canvas: null,
  context: null,
  
  // 初始化
  init: function() {
    this.video = $("#video")[0];
    this.canvas = $("#canvas")[0];
    this.context = this.canvas.getContext("2d");
    
    // 載入保存的 DEAuth
    const savedDEAuth = AppUtils.storage.getDEAuth();
    if (savedDEAuth) {
      $("#deAuthInput").val(savedDEAuth);
    }
    
    // 綁定事件
    this.bindEvents();
  },
  
  // 綁定事件
  bindEvents: function() {
    const self = this;
    
    // 監聽 DEAuth 輸入變化並保存
    $("#deAuthInput").on('input', function() {
      AppUtils.storage.saveDEAuth($(this).val());
    });
    
    // 開始掃描按鈕
    $("#startBtn").on("click", function() {
      self.startCamera();
    });
    
    // 進階操作按鈕
    $("#adminActionsBtn").on('click', function() {
      const current = $("#deAuthInput").val();
      if (current) {
        AppUtils.storage.saveDEAuth(current);
      }
      AppUtils.navigation.goToAdminActions();
    });
    
    // 直接輸入按鈕
    $("#directInputBtn").on('click', function() {
      const current = $("#deAuthInput").val();
      if (current) {
        AppUtils.storage.saveDEAuth(current);
      }
      AppUtils.navigation.goToDirectInput();
    });
  },
  
  // 開始相機
  startCamera: async function() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: APP_CONFIG.QR_SCANNER.VIDEO_CONSTRAINTS
      });
      
      this.video.srcObject = stream;
      this.video.style.display = "block";
      $("#scanOverlay").show();
      
      $("#startBtn").hide();
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
    }
  },
  
  // 停止相機
  stopCamera: function() {
    if (this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
      this.video.style.display = "none";
      $("#scanOverlay").hide();
    }
    this.isScanning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  },
  
  // 掃描 QR Code
  scanQRCode: function(currentTime) {
    // 頻率控制
    if (currentTime - this.lastScanTime < APP_CONFIG.QR_SCANNER.SCAN_INTERVAL) {
      if (this.isScanning) {
        this.animationFrameId = requestAnimationFrame(this.scanQRCode.bind(this));
      }
      return;
    }
    
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA && this.isScanning) {
      this.lastScanTime = currentTime;
      
      // 計算掃描區域
      const videoWidth = this.video.videoWidth;
      const videoHeight = this.video.videoHeight;
      const scanWidth = Math.floor(videoWidth * 0.5);
      const scanHeight = Math.floor(videoHeight * 0.5);
      const scanX = Math.floor((videoWidth - scanWidth) / 2);
      const scanY = Math.floor((videoHeight - scanHeight) / 2);
      
      const scaledWidth = Math.floor(scanWidth * APP_CONFIG.QR_SCANNER.SCAN_SCALE);
      const scaledHeight = Math.floor(scanHeight * APP_CONFIG.QR_SCANNER.SCAN_SCALE);
      
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
  },
  
  // 處理 QR Code 檢測
  handleQRCodeDetected: function(data) {
    this.isScanning = false;
    
    const parsedData = AppUtils.parseQRCode(data);
    
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
        self.stopCamera();
        $("#result").html("格式錯誤，請重新開始").removeClass().addClass("error");
        $("#apiResult").html("");
        $("#startBtn").show();
      }, 3000);
    }
  },
  
  // 呼叫 API 並跳轉
  callAPIAndRedirect: async function(parsedData) {
    try {
      const deAuthInput = $("#deAuthInput").val().trim();
      
      AppUtils.storage.saveDEAuth(deAuthInput);
      
      if (!deAuthInput) {
        $("#apiResult").html('<span class="error">請先輸入DEAuth認證碼</span>');
        setTimeout(() => {
          this.handleScanFailure("請輸入認證碼後重新掃描");
        }, 2000);
        return;
      }
      
      $("#apiResult").html('<span class="info">正在呼叫API...</span>');
      
      const deAuthSignature = AppUtils.createSignature(deAuthInput, parsedData.token);
      
      console.log("start calling api");
      const response = await AppUtils.apiCall(
        APP_CONFIG.API.CHECK_IN,
        {
          ID: parsedData.id,
          EventID: APP_CONFIG.CONSTANTS.EVENT_ID
        },
        deAuthSignature
      );
      
      console.log("api called, status:", response.status);
      
      if (response.ok) {
        const result = response.data;
        
        // 檢查是否已經報到
        if (result.CheckIn === true) {
          $("#apiResult").html(`<span class="error">✗ 已經報到，不可重複報到</span>`);
          setTimeout(() => {
            this.handleScanFailure("已經報到，請重新掃描其他QRCode");
          }, 3000);
          return;
        }
        
        $("#apiResult").html(`<span class="success">✓ API呼叫成功，準備跳轉...</span>`);
        
        setTimeout(() => {
          AppUtils.navigation.goToAuth(result, deAuthSignature);
        }, APP_CONFIG.CONSTANTS.REDIRECT_DELAY);
      } else {
        const errorMessage = AppUtils.handleApiError(response);
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
  },
  
  // 處理掃描失敗
  handleScanFailure: function(message) {
    this.stopCamera();
    $("#result").html(message).removeClass().addClass("error");
    $("#apiResult").html("");
    $("#startBtn").show();
  }
};