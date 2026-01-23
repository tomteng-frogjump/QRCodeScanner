// AdminActions 頁面功能
window.AdminActionsPage = {
  // 初始化
  init: function() {
    this.bindEvents();
  },
  
  // 綁定事件
  bindEvents: function() {
    const self = this;
    
    $('#btnSendNoShowList').on('click', function() {
      if (confirm('確定要寄送未報到清單嗎？')) {
        self.postWithAuth(APP_CONFIG.API.SEND_NO_SHOW_LIST);
      }
    });
    
    $('#btnSendSummary').on('click', function() {
      if (confirm('確定要寄送參與名單嗎？')) {
        self.postWithAuth(APP_CONFIG.API.SEND_SUMMARY);
      }
    });
    
    $('#btnBack').on('click', function() {
      AppUtils.navigation.goToScanner();
    });
  },
  
  // 設定狀態
  setStatus: function(html, cls = '') {
    const $el = $('#status');
    $el.removeClass().addClass(cls).html(html);
  },
  
  // 使用認證發送請求
  postWithAuth: async function(url) {
    const savedDEAuth = AppUtils.storage.getDEAuth();
    
    if (!savedDEAuth) {
      this.setStatus('<span style="color:#dc3545">✗ 缺少DEAuth認證碼，請回掃描頁輸入</span>');
      return;
    }
    
    try {
      this.setStatus('<span style="color:#17a2b8">⌛ 正在呼叫API...</span>');
      
      const deAuthSignature = AppUtils.createSignature(savedDEAuth, APP_CONFIG.CONSTANTS.DEFAULT_TOKEN);
      
      const response = await AppUtils.apiCall(url, {}, deAuthSignature);
      
      if (response.ok) {
        let text = '';
        try { 
          text = response.data ? JSON.stringify(response.data) : ''; 
        } catch (_) { 
          text = ''; 
        }
        this.setStatus(`<span style="color:#28a745">✓ 成功</span>${text ? '<br><small>' + text + '</small>' : ''}`);
      } else {
        const errorMessage = AppUtils.handleApiError(response);
        this.setStatus(`<span style="color:#dc3545">✗ 失敗</span><br><small>${errorMessage}</small>`);
      }
    } catch (err) {
      const errorMessage = err && err.message ? err.message : err;
      this.setStatus(`<span style="color:#dc3545">✗ 網路錯誤</span><br><small>${errorMessage}</small>`);
    }
  }
};