console.log("FIR Bulk Search content script loaded");

let firBulkActive = false;
let firBulkSessionId = null;
let editFirAutoClick = false;
let autoClickMulzimanTab = false;
let autoClickReportLink = false;
let printRoadCertMsg = false;

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

function tryAutoClickReportLink() {
  if (!autoClickReportLink) return;
  // Look for the رپوٹ link (exact title)
  const reportLink = document.querySelector('a.text-navy[title="رپوٹ"]');
  if (reportLink) {
    reportLink.click();
    console.log('[AutoClickReport] رپوٹ link auto-clicked!');
  } else {
    console.log('[AutoClickReport] رپوٹ link not found.');
  }
}

function tryPrintRoadCertMsg() {
  if (!printRoadCertMsg) return;
  if (window.location.pathname.startsWith('/register/roadcertificatereport/')) {
    // Try to click the print button first
    const printBtn = Array.from(document.querySelectorAll('a.btn.btn-primary')).find(
      btn => btn.textContent.trim() === 'پرنٹ کریں'
    );
    if (printBtn) {
      printBtn.click();
      console.log('[RoadCertReport] پرنٹ کریں button auto-clicked!');
    } else {
      window.print();
      console.log('[RoadCertReport] window.print() called as fallback.');
    }
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
  if (typeof request.autoClickReportLink === 'boolean') {
    autoClickReportLink = request.autoClickReportLink;
    if (autoClickReportLink && window.location.pathname === '/register/register21/0/search') {
      setTimeout(tryAutoClickReportLink, 300);
    }
  }
  if (typeof request.printRoadCertMsg === 'boolean') {
    printRoadCertMsg = request.printRoadCertMsg;
    if (printRoadCertMsg && window.location.pathname.startsWith('/register/roadcertificatereport/')) {
      tryPrintRoadCertMsg();
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
  if (request.rodBulkStart && request.rodBulkNumbers && Array.isArray(request.rodBulkNumbers)) {
    console.log('[RodBulk] Received rodBulkStart message:', request);
    let rodBulkType = request.rodBulkType === 'rod' ? 'rod' : 'fir';
    let rodBulkNumbers = request.rodBulkNumbers.slice();
    let rodBulkActive = true;
    function processNextRodBulkPopup() {
      if (!rodBulkActive || rodBulkNumbers.length === 0) {
        console.log('[RodBulk] Done or stopped.');
        rodBulkActive = false;
        return;
      }
      const num = rodBulkNumbers.shift();
      console.log(`[RodBulk] Processing number: ${num}`);
      // Find the main form
      const form = document.getElementById('searchForm');
      if (!form) {
        console.error('[RodBulk] searchForm not found!');
        rodBulkActive = false;
        return;
      }
      // Clone all form data
      const formData = new FormData(form);
      // Set the correct number
      if (rodBulkType === 'fir') {
        formData.set('fir_id', num);
        formData.set('r21_challan_no', '');
      } else {
        formData.set('fir_id', '');
        formData.set('r21_challan_no', num);
      }
      // Create a temporary form for POSTing to a new tab
      const tempForm = document.createElement('form');
      tempForm.action = form.action;
      tempForm.method = form.method;
      tempForm.target = '_blank';
      // Copy all fields
      for (const [key, value] of formData.entries()) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        tempForm.appendChild(input);
      }
      document.body.appendChild(tempForm);
      console.log('[RodBulk] Submitting form for number:', num);
      tempForm.submit();
      document.body.removeChild(tempForm);
      // Next after 400ms
      if (rodBulkNumbers.length > 0 && rodBulkActive) {
        setTimeout(processNextRodBulkPopup, 400);
      } else {
        console.log('[RodBulk] Finished all numbers.');
        rodBulkActive = false;
      }
    }
    processNextRodBulkPopup();
  }
});

// On load, get the toggle state for all tabs
chrome.storage && chrome.storage.sync.get([
  'editFirAutoClick', 'autoClickMulzimanTab', 'autoClickReportLink',
  'autoClickTab2', 'autoClickTab4', 'autoClickTab6', 'autoClickTab9', 'autoClickTab8', 'autoClickTab7',
  'autoClickTab15', 'autoClickTab3', 'autoClickTab10', 'autoClickTab17', 'autoClickTab12', 'autoClickTab13',
  'printRoadCertMsg'
], function(result) {
  editFirAutoClick = !!result.editFirAutoClick;
  autoClickMulzimanTab = !!result.autoClickMulzimanTab;
  autoClickReportLink = !!result.autoClickReportLink;
  printRoadCertMsg = !!result.printRoadCertMsg;
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
  if (autoClickReportLink && window.location.pathname === '/register/register21/0/search') {
    setTimeout(tryAutoClickReportLink, 300);
  }
  if (printRoadCertMsg && window.location.pathname.startsWith('/register/roadcertificatereport/')) {
    tryPrintRoadCertMsg();
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

// --- Rod Bulk Search UI and Logic ---
(function() {
  const ROD_BULK_URL = 'https://fir.punjabpolice.gov.pk/register/register21';
  if (window.location.href.split('?')[0] !== ROD_BULK_URL) return;

  function injectRodBulkSection() {
    console.log('[Rod Bulk Search] Injecting section...');
    const container = document.createElement('div');
    container.style.background = '#fffbe7';
    container.style.border = '2px solid #f0ad4e';
    container.style.padding = '18px';
    container.style.margin = '18px 0';
    container.style.borderRadius = '10px';
    container.style.maxWidth = '700px';
    container.style.fontSize = '16px';
    container.style.boxShadow = '0 2px 8px rgba(240,173,78,0.08)';

    container.innerHTML = `
      <div style="font-weight:bold;font-size:22px;margin-bottom:10px;color:#d35400;">Rod Bulk Search</div>
      <div style="margin-bottom:10px;color:#555;">Paste FIR or Rod numbers (one per line), select the search type, and click <b>Start Bulk Search</b>. The extension will fill and search each number for you.</div>
      <div style="margin-bottom:10px;">
        <label><input type="radio" name="rod_bulk_type" value="fir" checked> Search by FIR Number</label>
        <label style="margin-left:24px;"><input type="radio" name="rod_bulk_type" value="rod"> Search by Rod Number</label>
      </div>
      <textarea id="rod_bulk_numbers" rows="5" style="width:100%;font-size:16px;border:1px solid #ccc;border-radius:4px;padding:8px;" placeholder="Paste FIR or Rod numbers, one per line..."></textarea>
      <br/>
      <button id="rod_bulk_start" style="margin-top:12px;padding:8px 24px;font-size:17px;background:#f0ad4e;color:#fff;border:none;border-radius:4px;cursor:pointer;">Start Bulk Search</button>
      <span id="rod_bulk_status" style="margin-left:18px;color:#007bff;font-weight:bold;"></span>
    `;

    // Insert directly above the main search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm && searchForm.parentNode) {
      searchForm.parentNode.insertBefore(container, searchForm);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }

    // Bulk search logic
    let rodBulkActive = false;
    let rodBulkNumbers = [];
    let rodBulkType = 'fir';

    function setRodBulkStatus(msg) {
      document.getElementById('rod_bulk_status').textContent = msg;
    }

    function processNextRodBulk() {
      if (!rodBulkActive || rodBulkNumbers.length === 0) {
        setRodBulkStatus('Bulk search finished.');
        rodBulkActive = false;
        return;
      }
      const num = rodBulkNumbers.shift();
      setRodBulkStatus(`Searching: ${num} (${rodBulkNumbers.length} left)`);
      if (rodBulkType === 'fir') {
        const firInput = document.getElementById('fir_id');
        if (firInput) firInput.value = num;
        const rodInput = document.getElementById('r21_challan_no');
        if (rodInput) rodInput.value = '';
      } else {
        const firInput = document.getElementById('fir_id');
        if (firInput) firInput.value = '';
        const rodInput = document.getElementById('r21_challan_no');
        if (rodInput) rodInput.value = num;
      }
      // Find the search button
      const buttons = document.querySelectorAll('input[type="submit"]');
      let searchBtn = null;
      buttons.forEach(btn => {
        if (btn.value && btn.value.includes('تلاش')) searchBtn = btn;
      });
      if (searchBtn) {
        const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window, ctrlKey: true });
        searchBtn.dispatchEvent(evt);
      }
      // Next after 300ms
      if (rodBulkNumbers.length > 0 && rodBulkActive) {
        setTimeout(processNextRodBulk, 300);
      } else {
        setRodBulkStatus('Bulk search finished.');
        rodBulkActive = false;
      }
    }

    // Radio change
    container.querySelectorAll('input[name="rod_bulk_type"]').forEach(radio => {
      radio.addEventListener('change', function() {
        rodBulkType = this.value;
      });
    });

    // Start button
    document.getElementById('rod_bulk_start').addEventListener('click', function() {
      if (rodBulkActive) return;
      const raw = document.getElementById('rod_bulk_numbers').value;
      const nums = raw.split(/\r?\n/).map(x => x.trim()).filter(x => x);
      if (nums.length === 0) {
        setRodBulkStatus('Please enter at least one number.');
        return;
      }
      rodBulkNumbers = nums;
      rodBulkActive = true;
      setRodBulkStatus('Starting bulk search...');
      processNextRodBulk();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectRodBulkSection);
  } else {
    injectRodBulkSection();
  }
})();