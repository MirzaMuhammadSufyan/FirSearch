console.log("FIR Bulk Search content script loaded");

let firBulkActive = false;
let firBulkSessionId = null;
let cnicBulkActive = false;
let cnicBulkSessionId = null;
let editFirAutoClick = false;
let autoClickMulzimanTab = false;

// --- Edit FIR auto-click logic ---
function tryAutoClickEditFIR() {
  if (!editFirAutoClick) return;
  let attempts = 0;
  const maxAttempts = 10;
  const interval = setInterval(() => {
    const editLink = document.querySelector('a.text-navy[title="Edit FIR"]');
    if (editLink) {
      // Robust click simulation
      editLink.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      editLink.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      editLink.click();
      clearInterval(interval);
    } else if (++attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 300);
}

function showMulzimanBanner(message, success = true) {
  let banner = document.createElement('div');
  banner.textContent = message;
  banner.style.position = 'fixed';
  banner.style.top = '0';
  banner.style.left = '0';
  banner.style.width = '100%';
  banner.style.zIndex = '9999';
  banner.style.background = success ? '#4caf50' : '#d9534f';
  banner.style.color = 'white';
  banner.style.textAlign = 'center';
  banner.style.fontSize = '18px';
  banner.style.padding = '10px 0';
  banner.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  document.body.appendChild(banner);
  setTimeout(() => { banner.remove(); }, 3000);
}

function isElementVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
}

function tryAutoClickMulzimanTab() {
  if (!autoClickMulzimanTab) {
    showMulzimanBanner('Auto-click ملزمان tab is disabled.', false);
    return;
  }
  let attempts = 0;
  const maxAttempts = 30;
  const interval = setInterval(() => {
    const mulzimanTab = document.getElementById('tab-11');
    if (mulzimanTab && isElementVisible(mulzimanTab)) {
      mulzimanTab.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        // Fire all events as a real user would
        ['mousedown', 'mouseup', 'click'].forEach(evtType => {
          const evt = new MouseEvent(evtType, { bubbles: true, cancelable: true, view: window });
          mulzimanTab.dispatchEvent(evt);
        });
        showMulzimanBanner('ملزمان tab auto-clicked!', true);
      }, 100); // slight delay after scroll
      clearInterval(interval);
    } else if (mulzimanTab && !isElementVisible(mulzimanTab)) {
      showMulzimanBanner('ملزمان tab found but not visible/clickable.', false);
      clearInterval(interval);
    } else if (++attempts >= maxAttempts) {
      showMulzimanBanner('ملزمان tab not found after waiting.', false);
      clearInterval(interval);
    }
  }, 300);
}

// --- Tab auto-click toggles ---
let tabToggles = {
  tab2: false,  // انسدادی کاروائی
  tab4: false,  // تاریخ سماعت
  tab6: false,  // پوزیشن
  tab9: false,  // انڈکس ضمنیات
  tab8: false,  // جرم ایزاد حذف
  tab7: false,  // منشیات اسلحہ و دیگر شواہد برآمدگی
  tab15: false, // مال مسروقہ برآمدگی
  tab3: false,  // تفتیش
  tab10: false, // تفتیشی آفیسران
  tab17: false, // نامعلوم ملزمان
  tab12: false, // متاثرہ اشخاس
  tab13: false  // گواہان
};

function tryAutoClickTab(tabId, urduLabel, enabled) {
  if (!enabled) {
    showMulzimanBanner(`Auto-click ${urduLabel} tab is disabled.`, false);
    return;
  }
  let attempts = 0;
  const maxAttempts = 30;
  const interval = setInterval(() => {
    const tab = document.getElementById(tabId);
    if (tab && isElementVisible(tab)) {
      tab.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        ['mousedown', 'mouseup', 'click'].forEach(evtType => {
          const evt = new MouseEvent(evtType, { bubbles: true, cancelable: true, view: window });
          tab.dispatchEvent(evt);
        });
        showMulzimanBanner(`${urduLabel} tab auto-clicked!`, true);
      }, 100);
      clearInterval(interval);
    } else if (tab && !isElementVisible(tab)) {
      showMulzimanBanner(`${urduLabel} tab found but not visible/clickable.`, false);
      clearInterval(interval);
    } else if (++attempts >= maxAttempts) {
      showMulzimanBanner(`${urduLabel} tab not found after waiting.`, false);
      clearInterval(interval);
    }
  }, 300);
}

function processNextFIR() {
  if (!firBulkActive) return;
  let firBulkData = JSON.parse(localStorage.getItem('fir_bulk_data') || '{}');
  if (!firBulkData.sessionId || firBulkData.sessionId !== firBulkSessionId) return;
  let firNumbers = firBulkData.numbers || [];
  if (!Array.isArray(firNumbers) || firNumbers.length === 0) {
    localStorage.removeItem('fir_bulk_data');
    firBulkActive = false;
    return;
  }
  const num = firNumbers.shift();
  firBulkData.numbers = firNumbers;
  localStorage.setItem('fir_bulk_data', JSON.stringify(firBulkData));
  // Fill the FIR input
  const input = document.getElementById('fir_id');
  if (input) {
    input.value = num;
    // Find the 'تلاش کریں' button
    const buttons = document.querySelectorAll('input[type="submit"]');
    let searchBtn = null;
    buttons.forEach(btn => {
      if (btn.value.includes('تلاش')) searchBtn = btn;
    });
    if (searchBtn) {
      // Create a MouseEvent with ctrlKey true
      const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window, ctrlKey: true });
      searchBtn.dispatchEvent(evt);
    }
  }
  // If there are more FIRs, process next after 200ms (no reload)
  if (firNumbers.length > 0 && firBulkActive) {
    setTimeout(processNextFIR, 200);
  } else {
    localStorage.removeItem('fir_bulk_data');
    firBulkActive = false;
  }
}

function processNextCNIC() {
  if (!cnicBulkActive) return;
  let cnicBulkData = JSON.parse(localStorage.getItem('cnic_bulk_data') || '{}');
  if (!cnicBulkData.sessionId || cnicBulkData.sessionId !== cnicBulkSessionId) return;
  let cnicNumbers = cnicBulkData.numbers || [];
  if (!Array.isArray(cnicNumbers) || cnicNumbers.length === 0) {
    localStorage.removeItem('cnic_bulk_data');
    cnicBulkActive = false;
    return;
  }
  const cnic = cnicNumbers.shift();
  cnicBulkData.numbers = cnicNumbers;
  localStorage.setItem('cnic_bulk_data', JSON.stringify(cnicBulkData));
  // Fill the keyword input (CNIC field)
  const input = document.getElementById('keyword');
  if (input) {
    input.value = cnic;
    // Find the submit button with name="AdvanceSearch" and value="تلاش کریں"
    const searchBtn = document.querySelector('input[type="submit"][name="AdvanceSearch"]');
    if (searchBtn && searchBtn.value.includes('تلاش')) {
      // Create a MouseEvent with ctrlKey true to open in new tab
      const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window, ctrlKey: true });
      searchBtn.dispatchEvent(evt);
    }
  }
  // If there are more CNICs, process next after 200ms (no reload)
  if (cnicNumbers.length > 0 && cnicBulkActive) {
    setTimeout(processNextCNIC, 200);
  } else {
    localStorage.removeItem('cnic_bulk_data');
    cnicBulkActive = false;
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (typeof request.editFirAutoClick === 'boolean') {
    editFirAutoClick = request.editFirAutoClick;
    if (editFirAutoClick && window.location.href.includes('/search/searchRecord/simple')) {
      setTimeout(tryAutoClickEditFIR, 300); // Wait for DOM
    }
  }
  if (typeof request.autoClickMulzimanTab === 'boolean') {
    autoClickMulzimanTab = request.autoClickMulzimanTab;
    if (autoClickMulzimanTab && /\/firSystem\/editFIR\//.test(window.location.href)) {
      setTimeout(tryAutoClickMulzimanTab, 300);
    }
  }
  // Handle all tab toggles
  [
    { key: 'autoClickTab2', id: 'tab-2', label: 'انسدادی کاروائی', state: 'tab2' },
    { key: 'autoClickTab4', id: 'tab-4', label: 'تاریخ سماعت', state: 'tab4' },
    { key: 'autoClickTab6', id: 'tab-6', label: 'پوزیشن', state: 'tab6' },
    { key: 'autoClickTab9', id: 'tab-9', label: 'انڈکس ضمنیات', state: 'tab9' },
    { key: 'autoClickTab8', id: 'tab-8', label: 'جرم ایزاد حذف', state: 'tab8' },
    { key: 'autoClickTab7', id: 'tab-7', label: 'منشیات اسلحہ و دیگر شواہد برآمدگی', state: 'tab7' },
    { key: 'autoClickTab15', id: 'tab-15', label: 'مال مسروقہ برآمدگی', state: 'tab15' },
    { key: 'autoClickTab3', id: 'tab-3', label: 'تفتیش', state: 'tab3' },
    { key: 'autoClickTab10', id: 'tab-10', label: 'تفتیشی آفیسران', state: 'tab10' },
    { key: 'autoClickTab17', id: 'tab-17', label: 'نامعلوم ملزمان', state: 'tab17' },
    { key: 'autoClickTab12', id: 'tab-12', label: 'متاثرہ اشخاس', state: 'tab12' },
    { key: 'autoClickTab13', id: 'tab-13', label: 'گواہان', state: 'tab13' }
  ].forEach(({ key, id, label, state }) => {
    if (typeof request[key] === 'boolean') {
      tabToggles[state] = request[key];
      if (request[key] && /\/firSystem\/editFIR\//.test(window.location.href)) {
        setTimeout(() => tryAutoClickTab(id, label, request[key]), 300);
      }
    }
  });
  if (request.firBulkStop) {
    firBulkActive = false;
    localStorage.removeItem('fir_bulk_data');
    return;
  }
  if (request.firBulkStart && request.firNumbers && Array.isArray(request.firNumbers)) {
    firBulkSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    firBulkActive = true;
    localStorage.setItem('fir_bulk_data', JSON.stringify({ sessionId: firBulkSessionId, numbers: request.firNumbers }));
    processNextFIR();
  }
  if (request.cnicBulkStop) {
    cnicBulkActive = false;
    localStorage.removeItem('cnic_bulk_data');
    return;
  }
  if (request.cnicBulkStart && request.cnicBulkNumbers && Array.isArray(request.cnicBulkNumbers)) {
    cnicBulkSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    cnicBulkActive = true;
    localStorage.setItem('cnic_bulk_data', JSON.stringify({ sessionId: cnicBulkSessionId, numbers: request.cnicBulkNumbers }));
    processNextCNIC();
  }
});

// On load, get the toggle state for all tabs
chrome.storage && chrome.storage.sync.get([
  'editFirAutoClick', 'autoClickMulzimanTab',
  'autoClickTab2', 'autoClickTab4', 'autoClickTab6', 'autoClickTab9', 'autoClickTab8', 'autoClickTab7',
  'autoClickTab15', 'autoClickTab3', 'autoClickTab10', 'autoClickTab17', 'autoClickTab12', 'autoClickTab13'
], function(result) {
  editFirAutoClick = !!result.editFirAutoClick;
  autoClickMulzimanTab = !!result.autoClickMulzimanTab;
  tabToggles.tab2 = !!result.autoClickTab2;
  tabToggles.tab4 = !!result.autoClickTab4;
  tabToggles.tab6 = !!result.autoClickTab6;
  tabToggles.tab9 = !!result.autoClickTab9;
  tabToggles.tab8 = !!result.autoClickTab8;
  tabToggles.tab7 = !!result.autoClickTab7;
  tabToggles.tab15 = !!result.autoClickTab15;
  tabToggles.tab3 = !!result.autoClickTab3;
  tabToggles.tab10 = !!result.autoClickTab10;
  tabToggles.tab17 = !!result.autoClickTab17;
  tabToggles.tab12 = !!result.autoClickTab12;
  tabToggles.tab13 = !!result.autoClickTab13;
  if (editFirAutoClick && window.location.href.includes('/search/searchRecord/simple')) {
    setTimeout(tryAutoClickEditFIR, 300);
  }
  if (/\/firSystem\/editFIR\//.test(window.location.href)) {
    if (autoClickMulzimanTab) setTimeout(tryAutoClickMulzimanTab, 300);
    [
      { id: 'tab-2', label: 'انسدادی کاروائی', state: 'tab2' },
      { id: 'tab-4', label: 'تاریخ سماعت', state: 'tab4' },
      { id: 'tab-6', label: 'پوزیشن', state: 'tab6' },
      { id: 'tab-9', label: 'انڈکس ضمنیات', state: 'tab9' },
      { id: 'tab-8', label: 'جرم ایزاد حذف', state: 'tab8' },
      { id: 'tab-7', label: 'منشیات اسلحہ و دیگر شواہد برآمدگی', state: 'tab7' },
      { id: 'tab-15', label: 'مال مسروقہ برآمدگی', state: 'tab15' },
      { id: 'tab-3', label: 'تفتیش', state: 'tab3' },
      { id: 'tab-10', label: 'تفتیشی آفیسران', state: 'tab10' },
      { id: 'tab-17', label: 'نامعلوم ملزمان', state: 'tab17' },
      { id: 'tab-12', label: 'متاثرہ اشخاس', state: 'tab12' },
      { id: 'tab-13', label: 'گواہان', state: 'tab13' }
    ].forEach(({ id, label, state }) => {
      if (tabToggles[state]) setTimeout(() => tryAutoClickTab(id, label, true), 300);
    });
  }
});

// On every page load, check if this tab is the active session
if (window.location.href.includes('firSystem/FIRlist')) {
  setTimeout(() => {
    let firBulkData = JSON.parse(localStorage.getItem('fir_bulk_data') || '{}');
    if (firBulkData.sessionId && firBulkData.numbers && firBulkData.numbers.length > 0) {
      if (!firBulkSessionId) firBulkSessionId = firBulkData.sessionId;
      firBulkActive = true;
      processNextFIR();
    }
  }, 500);
}

// On searchPerson page load, check if this tab is the active CNIC bulk session
if (window.location.href.includes('/search/searchPerson')) {
  setTimeout(() => {
    let cnicBulkData = JSON.parse(localStorage.getItem('cnic_bulk_data') || '{}');
    if (cnicBulkData.sessionId && cnicBulkData.numbers && cnicBulkData.numbers.length > 0) {
      if (!cnicBulkSessionId) cnicBulkSessionId = cnicBulkData.sessionId;
      cnicBulkActive = true;
      processNextCNIC();
    }
  }, 500);
}

window.addEventListener('beforeunload', function() {
  // If the tab is closed, clear the session if this was the active tab
  let firBulkData = JSON.parse(localStorage.getItem('fir_bulk_data') || '{}');
  if (firBulkData.sessionId && firBulkData.sessionId === firBulkSessionId) {
    localStorage.removeItem('fir_bulk_data');
  }
  let cnicBulkData = JSON.parse(localStorage.getItem('cnic_bulk_data') || '{}');
  if (cnicBulkData.sessionId && cnicBulkData.sessionId === cnicBulkSessionId) {
    localStorage.removeItem('cnic_bulk_data');
  }
});
