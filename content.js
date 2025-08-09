console.log("FIR Bulk Search content script loaded");

let firBulkActive = false;
let firBulkSessionId = null;
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
});

// On load, get the toggle state
chrome.storage && chrome.storage.sync.get(['editFirAutoClick', 'autoClickMulzimanTab'], function(result) {
  editFirAutoClick = !!result.editFirAutoClick;
  autoClickMulzimanTab = !!result.autoClickMulzimanTab;
  if (editFirAutoClick && window.location.href.includes('/search/searchRecord/simple')) {
    setTimeout(tryAutoClickEditFIR, 300);
  }
  if (autoClickMulzimanTab && /\/firSystem\/editFIR\//.test(window.location.href)) {
    setTimeout(tryAutoClickMulzimanTab, 300);
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

window.addEventListener('beforeunload', function() {
  // If the tab is closed, clear the session if this was the active tab
  let firBulkData = JSON.parse(localStorage.getItem('fir_bulk_data') || '{}');
  if (firBulkData.sessionId && firBulkData.sessionId === firBulkSessionId) {
    localStorage.removeItem('fir_bulk_data');
  }
});
