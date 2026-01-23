// DirectInput 頁面功能
window.DirectInputPage = {
  // 初始化
  init: function() {
    this.bindEvents();
    // 自動聚焦到輸入框
    $('#employeeId').focus();
  },
  
  // 綁定事件
  bindEvents: function() {
    const self = this;
    
    // 監聽Enter鍵
    $('#employeeId').on('keypress', function(e) {
      if (e.which === 13) {
        self.queryEmployee();
      }
    });
    
    // 提交按鈕事件
    $('#submitBtn').on('click', function() {
      self.queryEmployee();
    });
    
    // 返回按鈕事件
    $('#backBtn').on('click', function() {
      AppUtils.navigation.goToScanner();
    });
  },
  
  // 查詢員工
  queryEmployee: async function() {
    const employeeId = $('#employeeId').val().trim();
    const savedDEAuth = AppUtils.storage.getDEAuth();
    
    if (!employeeId) {
      AppUtils.setStatus('status', '請輸入員工編號', 'error');
      return;
    }
    
    if (!savedDEAuth) {
      AppUtils.setStatus('status', '缺少認證資訊，請回到掃描頁面輸入DEAuth認證碼', 'error');
      return;
    }
    
    try {
      AppUtils.setStatus('status', '⌛ 正在查詢員工資料...', 'info');
      $('#submitBtn').prop('disabled', true).text('查詢中...');
      
      // 產生簽章
      const deAuthSignature = AppUtils.createSignature(savedDEAuth, APP_CONFIG.CONSTANTS.DEFAULT_TOKEN);
      
      const response = await AppUtils.apiCall(
        APP_CONFIG.API.DIRECT_INPUT,
        {
          ID: employeeId
        },
        deAuthSignature
      );
      
      if (response.ok) {
        const result = response.data;
        
        // 檢查是否已經報到
        if (result.CheckIn === true) {
          AppUtils.setStatus('status', '✗ 已經報到，不可重複報到', 'error');
          setTimeout(() => {
            AppUtils.setStatus('status', '');
            $('#submitBtn').prop('disabled', false).text('確認查詢');
          }, 3000);
          return;
        }
        
        AppUtils.setStatus('status', '✓ 查詢成功，準備跳轉...', 'success');
        
        // 2秒後跳轉到Auth頁面
        setTimeout(() => {
          AppUtils.navigation.goToAuth(result, deAuthSignature);
        }, 2000);
      } else {
        const errorMessage = AppUtils.handleApiError(response);
        AppUtils.setStatus('status', `✗ ${errorMessage}`, 'error');
        $('#submitBtn').prop('disabled', false).text('確認查詢');
      }
    } catch (error) {
      console.error('API呼叫錯誤:', error);
      let errorMessage = "網路錯誤";
      
      if (error.name === 'TypeError') {
        errorMessage = "連線失敗，請檢查網路設定";
      } else {
        errorMessage = `網路錯誤: ${error.message}`;
      }
      
      AppUtils.setStatus('status', `✗ ${errorMessage}`, 'error');
      $('#submitBtn').prop('disabled', false).text('確認查詢');
    }
  }
};