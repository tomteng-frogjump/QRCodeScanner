import { API } from './config.js';
import { getUrlParameter, setBadge, apiCall, handleApiError, navigation } from './common.js';

// Auth 頁面功能
export default class AuthPage {
  // 初始化
  static init() {
    this.loadMemberInfo();
    this.bindEvents();
  }
  
  // 綁定事件
  static bindEvents() {
    // 確認報到按鈕 - 使用事件委託避免重複綁定
    $(document).off('click', '.btn-confirm').on('click', '.btn-confirm', function() {
      AuthPage.confirmCheckIn();
    });
    
    // 取消按鈕 - 使用事件委託
    $(document).off('click', '.btn-cancel').on('click', '.btn-cancel', function() {
      AuthPage.goBack();
    });
  }
  
  // 載入會員資訊
  static loadMemberInfo() {
    const apiDataParam = getUrlParameter('data');
    
    if (!apiDataParam) {
      alert('查無報到資料');
      this.goBack();
      return;
    }
    
    setTimeout(() => {
      try {
        const data = JSON.parse(decodeURIComponent(apiDataParam));
        
        // 填入資料
        $('#memberId').text(data.ID);
        $('#chineseName').text(data.ChineseName);
        $('#englishName').text(data.EnglishName);
        $('#type').text(data.Type);
        $('#department').text(data.Department);
        
        // 設定狀態徽章
        setBadge('isVegetariansBadge', data.IsVegetarians);
        setBadge('hasLotteryBadge', data.HasLottery);
        
        // 顯示內容
        $('#loadingDiv').hide();
        $('#contentDiv').show();
        
      } catch (error) {
        console.error('資料解析失敗:', error);
        this.goBack();
      }
    }, 1000);
  }
  
  // 確認報到
  static async confirmCheckIn() {
    if (!confirm('請確認已收費，並允許報到')) {
      return;
    }
    
    const apiDataParam = getUrlParameter('data');
    
    if (!apiDataParam) {
      alert('資料錯誤，無法完成報到');
      return;
    }
    
    try {
      const data = JSON.parse(decodeURIComponent(apiDataParam));
      
      // 顯示處理中狀態
      const $confirmBtn = $('.btn-confirm');
      const originalText = $confirmBtn.text();
      $confirmBtn.text('處理中...').prop('disabled', true);
      
      // 從URL參數中獲取DEAuth簽章
      const deAuthSignature = getUrlParameter('deAuthSignature');
      
      if (!deAuthSignature) {
        alert('缺少認證資訊，請重新掃描');
        this.goBack();
        return;
      }
      
      // 呼叫報到API
      const response = await apiCall(
        API.CONFIRM_CHECK_IN,
        {
          ID: data.ID,
          EventID: data.EventID
        },
        deAuthSignature
      );
      
      if (response.ok) {
        alert('報到確認完成！');
        this.goBack();
      } else {
        alert(`報到失敗：${handleApiError(response)}`);
        $confirmBtn.text(originalText).prop('disabled', false);
      }
    } catch (error) {
      console.error('報到API錯誤:', error);
      alert('網路錯誤，報到失敗');
      $('.btn-confirm').text('確認').prop('disabled', false);
    }
  }
  
  // 返回掃描頁面
  static goBack() {
    setTimeout(() => {
      navigation.goToScanner();
    }, 1000);
  }
  
  // 顯示錯誤
  static showError() {
    $('#loadingDiv').hide();
    $('#errorDiv').show();
  }
}