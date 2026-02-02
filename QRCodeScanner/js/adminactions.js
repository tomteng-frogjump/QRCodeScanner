import { API, CONSTANTS } from './config.js';
import { storage, createSignature, apiCall, handleApiError, navigation } from './common.js';

// AdminActions 頁面功能
export default class AdminActionsPage {
  // 初始化
  static init() {
    this.bindEvents();
  }
  
  // 綁定事件
  static bindEvents() {
    $('#btnSendNoShowList').on('click', function() {
      if (confirm('確定要寄送未報到清單嗎？')) {
        AdminActionsPage.postWithAuth(API.SEND_NO_SHOW_LIST);
      }
    });
    
    $('#btnSendSummary').on('click', function() {
      if (confirm('確定要寄送參與名單嗎？')) {
        AdminActionsPage.postWithAuth(API.SEND_SUMMARY);
      }
    });
    
    $('#btnBack').on('click', function() {
      navigation.goToScanner();
    });
  }
  
  // 設定狀態
  static setStatus(html, cls = '') {
    const $el = $('#status');
    $el.removeClass().addClass(cls).html(html);
  }
  
  // 使用認證發送請求
  static async postWithAuth(url) {
    const savedDEAuth = storage.getDEAuth();
    
    if (!savedDEAuth) {
      this.setStatus('<span style="color:#dc3545">✗ 缺少DEAuth認證碼，請回掃描頁輸入</span>');
      return;
    }
    
    try {
      this.setStatus('<span style="color:#17a2b8">⌛ 正在呼叫API...</span>');
      
      const deAuthSignature = createSignature(savedDEAuth, CONSTANTS.DEFAULT_TOKEN);
      
      const response = await apiCall(url, {}, deAuthSignature);
      
      if (response.ok) {
        let text = '';
        try { 
          text = response.data ? JSON.stringify(response.data) : ''; 
        } catch (_) { 
          text = ''; 
        }
        this.setStatus(`<span style="color:#28a745">✓ 成功</span>${text ? '<br><small>' + text + '</small>' : ''}`);
      } else {
        const errorMessage = handleApiError(response);
        this.setStatus(`<span style="color:#dc3545">✗ 失敗</span><br><small>${errorMessage}</small>`);
      }
    } catch (err) {
      const errorMessage = err && err.message ? err.message : err;
      this.setStatus(`<span style="color:#dc3545">✗ 網路錯誤</span><br><small>${errorMessage}</small>`);
    }
  }
}