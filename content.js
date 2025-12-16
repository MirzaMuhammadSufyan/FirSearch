console.log("FIR Bulk Search content script loaded");

let firBulkActive = false;
let firBulkSessionId = null;
let cnicBulkActive = false;
let cnicBulkSessionId = null;
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

// --- Auto-click رپورٹ link logic ---
function tryAutoClickReportLink() {
  if (!autoClickReportLink) return;
  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    // Find all رپورٹ links - specifically looking for road certificate report links
    // Pattern: <a class="text-navy" title="رپوٹ" href="...roadcertificatereport...">
    const allLinks = Array.from(document.querySelectorAll('a'));
    const reportLinks = allLinks.filter(link => {
      // Check for the specific pattern: class="text-navy" and title="رپوٹ" and href contains "roadcertificatereport"
      const hasCorrectClass = link.classList.contains('text-navy');
      const title = link.getAttribute('title');
      const hasCorrectTitle = title === 'رپوٹ' || title === 'رپورٹ';
      const hasCorrectHref = link.href && link.href.includes('roadcertificatereport');
      
      return hasCorrectClass && hasCorrectTitle && hasCorrectHref && isElementVisible(link);
    });

    if (reportLinks.length > 0) {
      // Scroll first into view for visual context
      reportLinks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        if (reportLinks.length === 1) {
          // Single link: open in same tab (no ctrl/meta)
          ['mousedown', 'mouseup', 'click'].forEach(evtType => {
            const evt = new MouseEvent(evtType, { bubbles: true, cancelable: true, view: window });
            reportLinks[0].dispatchEvent(evt);
          });
        } else {
          // Multiple links: open all in new tabs (ctrlKey=true)
          reportLinks.forEach((link, index) => {
            setTimeout(() => {
              ['mousedown', 'mouseup', 'click'].forEach(evtType => {
                const evt = new MouseEvent(evtType, { bubbles: true, cancelable: true, view: window, ctrlKey: true });
                link.dispatchEvent(evt);
              });
            }, index * 200); // Stagger the clicks slightly
          });
        }
      }, 200);
      clearInterval(interval);
    } else if (++attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 300);
}

// --- Trigger print on road certificate report page ---
function triggerPrint() {
  window.print();
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
    // Update status to show completion (for both register21 and FIRlist pages)
    const status = document.getElementById('fir-bulk-status-inline') || document.getElementById('firlist-bulk-status-inline');
    if (status) {
      status.textContent = 'All FIRs processed!';
      status.style.color = '#5cb85c';
      status.style.background = '#e8f5e9';
    }
    // Update button back to Bulk Search (for both pages)
    const toggleBtn = document.getElementById('fir-bulk-toggle-btn') || document.getElementById('firlist-bulk-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = '🚀 Bulk Search';
      toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
      toggleBtn.style.transform = 'translateY(0)';
    }
    localStorage.removeItem('fir_bulk_data');
    firBulkActive = false;
    return;
  }
  const num = firNumbers.shift();
  const totalCount = firBulkData.totalCount || firNumbers.length + 1;
  firBulkData.numbers = firNumbers;
  firBulkData.totalCount = totalCount;
  localStorage.setItem('fir_bulk_data', JSON.stringify(firBulkData));
  
  // Update status (for both register21 and FIRlist pages)
  const status = document.getElementById('fir-bulk-status-inline') || document.getElementById('firlist-bulk-status-inline');
  if (status) {
    const remaining = firNumbers.length;
    status.textContent = `Processing... ${totalCount - remaining}/${totalCount} completed`;
    status.style.color = '#5cb85c';
    status.style.background = '#e8f5e9';
  }
  
  // Fill the appropriate input based on search type
  const searchType = firBulkData.searchType || 'fir';
  const firInput = document.getElementById('fir_id');
  const rodInput = document.getElementById('r21_challan_no');
  
  if (searchType === 'rod') {
    // Use Rod input field and clear FIR input
    if (rodInput) {
      rodInput.value = num;
      if (firInput) {
        firInput.value = '';
      }
    }
  } else {
    // Use FIR input field and clear Rod input
    if (firInput) {
      firInput.value = num;
      if (rodInput) {
        rodInput.value = '';
      }
    }
  }
  
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
  // If there are more FIRs, process next after 200ms (no reload)
  if (firNumbers.length > 0 && firBulkActive) {
    setTimeout(processNextFIR, 200);
  } else {
    // Update status to show completion (for both register21 and FIRlist pages)
    const status = document.getElementById('fir-bulk-status-inline') || document.getElementById('firlist-bulk-status-inline');
    if (status) {
      status.textContent = 'All FIRs processed!';
      status.style.color = '#5cb85c';
      status.style.background = '#e8f5e9';
    }
    // Update button back to Bulk Search (for both pages)
    const toggleBtn = document.getElementById('fir-bulk-toggle-btn') || document.getElementById('firlist-bulk-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = '🚀 Bulk Search';
      toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
      toggleBtn.style.transform = 'translateY(0)';
    }
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
    // Update status to show completion
    const status = document.getElementById('cnic-bulk-status-inline');
    if (status) {
      status.textContent = 'All CNICs processed!';
      status.style.color = '#5cb85c';
    }
    localStorage.removeItem('cnic_bulk_data');
    cnicBulkActive = false;
    return;
  }
  const cnic = cnicNumbers.shift();
  const totalCount = cnicBulkData.totalCount || cnicNumbers.length + 1;
  cnicBulkData.numbers = cnicNumbers;
  cnicBulkData.totalCount = totalCount;
  localStorage.setItem('cnic_bulk_data', JSON.stringify(cnicBulkData));
  
  // Update status
  const status = document.getElementById('cnic-bulk-status-inline');
  if (status) {
    const remaining = cnicNumbers.length;
    status.textContent = `Processing... ${totalCount - remaining}/${totalCount} completed`;
    status.style.color = '#5cb85c';
    status.style.background = '#e8f5e9';
  }
  
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
    // Update status to show completion
    if (status) {
      status.textContent = 'All CNICs processed!';
      status.style.color = '#5cb85c';
      status.style.background = '#e8f5e9';
    }
    // Update button back to Bulk Search
    const toggleBtn = document.getElementById('cnic-bulk-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = '🚀 Bulk Search';
      toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
      toggleBtn.style.transform = 'translateY(0)';
    }
    localStorage.removeItem('cnic_bulk_data');
    cnicBulkActive = false;
  }
}

function startCnicBulkSession(numbers) {
  if (!numbers || !Array.isArray(numbers) || numbers.length === 0) return;
  cnicBulkSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  cnicBulkActive = true;
  localStorage.setItem('cnic_bulk_data', JSON.stringify({ 
    sessionId: cnicBulkSessionId, 
    numbers,
    totalCount: numbers.length 
  }));
  processNextCNIC();
}

function startFirBulkSession(numbers, searchType = 'fir') {
  if (!numbers || !Array.isArray(numbers) || numbers.length === 0) return;
  firBulkSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  firBulkActive = true;
  localStorage.setItem('fir_bulk_data', JSON.stringify({ 
    sessionId: firBulkSessionId, 
    numbers,
    totalCount: numbers.length,
    searchType: searchType || 'fir'
  }));
  processNextFIR();
}

function stopFirBulkSession() {
  firBulkActive = false;
  localStorage.removeItem('fir_bulk_data');
  // Update button state if widget exists (for both register21 and FIRlist pages)
  const toggleBtn = document.getElementById('fir-bulk-toggle-btn') || document.getElementById('firlist-bulk-toggle-btn');
  if (toggleBtn && toggleBtn.textContent.includes('Stop')) {
    toggleBtn.textContent = '🚀 Bulk Search';
    toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
    toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
    toggleBtn.style.transform = 'translateY(0)';
  }
}

function stopCnicBulkSession() {
  cnicBulkActive = false;
  localStorage.removeItem('cnic_bulk_data');
  // Update button state if widget exists
  const toggleBtn = document.getElementById('cnic-bulk-toggle-btn');
  if (toggleBtn && toggleBtn.textContent.includes('Stop')) {
    toggleBtn.textContent = '🚀 Bulk Search';
    toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
    toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
    toggleBtn.style.transform = 'translateY(0)';
  }
}

function injectCnicBulkWidget() {
  if (!window.location.href.includes('/search/searchPerson')) return;
  if (document.getElementById('cnic-bulk-widget')) return;

  // Find the form and its row
  const form = document.getElementById('searchForm');
  if (!form) return;
  
  const formRow = form.querySelector('.row[align="center"]');
  if (!formRow) return;

  // Create column container matching form structure
  const colDiv = document.createElement('div');
  colDiv.className = 'col-lg-3';
  colDiv.id = 'cnic-bulk-widget';

  // Create form group wrapper with horizontal layout
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  formGroup.style.display = 'flex';
  formGroup.style.alignItems = 'flex-end';
  formGroup.style.gap = '10px';

  // Beautiful textarea with fixed dimensions
  const textarea = document.createElement('textarea');
  textarea.id = 'cnic-bulk-input';
  textarea.className = 'form-control';
  textarea.placeholder = 'Paste CNICs here\nOne per line...';
  textarea.style.width = '200px';
  textarea.style.height = '100px';
  textarea.style.resize = 'none';
  textarea.style.fontSize = '13px';
  textarea.style.padding = '10px';
  textarea.style.border = '2px solid #e0e0e0';
  textarea.style.borderRadius = '8px';
  textarea.style.transition = 'all 0.3s ease';
  textarea.style.fontFamily = 'inherit';
  textarea.style.lineHeight = '1.5';
  
  // Interactive focus effects
  textarea.addEventListener('focus', () => {
    textarea.style.borderColor = '#5cb85c';
    textarea.style.boxShadow = '0 0 0 3px rgba(92, 184, 92, 0.1)';
    textarea.style.outline = 'none';
  });
  
  textarea.addEventListener('blur', () => {
    textarea.style.borderColor = '#e0e0e0';
    textarea.style.boxShadow = 'none';
  });
  
  formGroup.appendChild(textarea);

  // Button container (vertical stack) - aligned to bottom
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '8px';
  buttonContainer.style.alignItems = 'stretch';
  buttonContainer.style.justifyContent = 'flex-end';

  // Interactive toggle button - starts as "Bulk Search"
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.id = 'cnic-bulk-toggle-btn';
  toggleBtn.textContent = '🚀 Bulk Search';
  toggleBtn.style.padding = '12px 20px';
  toggleBtn.style.fontSize = '14px';
  toggleBtn.style.fontWeight = '600';
  toggleBtn.style.border = 'none';
  toggleBtn.style.borderRadius = '8px';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  toggleBtn.style.position = 'relative';
  toggleBtn.style.overflow = 'hidden';
  toggleBtn.style.minWidth = '140px';
  toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
  toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
  toggleBtn.style.color = '#fff';
  toggleBtn.style.textTransform = 'uppercase';
  toggleBtn.style.letterSpacing = '0.5px';
  
  // Add hover effect
  toggleBtn.addEventListener('mouseenter', () => {
    toggleBtn.style.transform = 'translateY(-2px)';
    toggleBtn.style.boxShadow = '0 6px 16px rgba(92, 184, 92, 0.4)';
  });
  
  toggleBtn.addEventListener('mouseleave', () => {
    if (!cnicBulkActive) {
      toggleBtn.style.transform = 'translateY(0)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
    }
  });
  
  // Add active/pressed effect
  toggleBtn.addEventListener('mousedown', () => {
    toggleBtn.style.transform = 'translateY(0) scale(0.98)';
  });
  
  toggleBtn.addEventListener('mouseup', () => {
    if (!cnicBulkActive) {
      toggleBtn.style.transform = 'translateY(-2px)';
    }
  });
  
  buttonContainer.appendChild(toggleBtn);

  // Status indicator - compact and beautiful
  const status = document.createElement('div');
  status.id = 'cnic-bulk-status-inline';
  status.style.fontSize = '11px';
  status.style.color = '#666';
  status.style.minHeight = '16px';
  status.style.textAlign = 'center';
  status.style.padding = '4px 8px';
  status.style.borderRadius = '4px';
  status.style.background = '#f8f9fa';
  status.style.transition = 'all 0.3s ease';
  buttonContainer.appendChild(status);

  formGroup.appendChild(buttonContainer);
  colDiv.appendChild(formGroup);

  // Insert into form row (before the submit button column)
  const submitCol = formRow.querySelector('.col-lg-1');
  if (submitCol) {
    formRow.insertBefore(colDiv, submitCol);
  } else {
    formRow.appendChild(colDiv);
  }

  // Function to update button state
  const updateButtonState = (isActive) => {
    if (isActive) {
      toggleBtn.textContent = '⏹ Stop';
      toggleBtn.style.background = 'linear-gradient(135deg, #d9534f 0%, #c9302c 100%)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(217, 83, 79, 0.3)';
      toggleBtn.addEventListener('mouseenter', function hoverActive() {
        toggleBtn.style.transform = 'translateY(-2px)';
        toggleBtn.style.boxShadow = '0 6px 16px rgba(217, 83, 79, 0.4)';
      });
    } else {
      toggleBtn.textContent = '🚀 Bulk Search';
      toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
      toggleBtn.style.transform = 'translateY(0)';
    }
  };

  // Event listener for toggle button
  toggleBtn.addEventListener('click', () => {
    if (cnicBulkActive) {
      // Stop the bulk search
      stopCnicBulkSession();
      status.textContent = 'Stopped.';
      status.style.color = '#d9534f';
      status.style.background = '#ffe6e6';
      updateButtonState(false);
    } else {
      // Start the bulk search
      const input = textarea.value;
      const numbers = input.split(/\r?\n/).map(n => n.trim()).filter(n => n.length > 0);
      if (numbers.length === 0) {
        status.textContent = 'Please enter at least one CNIC.';
        status.style.color = '#d9534f';
        status.style.background = '#ffe6e6';
        // Shake animation
        toggleBtn.style.animation = 'shake 0.5s';
        setTimeout(() => {
          toggleBtn.style.animation = '';
        }, 500);
        return;
      }
      status.textContent = `Processing ${numbers.length} CNIC(s)...`;
      status.style.color = '#5cb85c';
      status.style.background = '#e8f5e9';
      updateButtonState(true);
      startCnicBulkSession(numbers);
    }
  });

  // Add shake animation CSS
  if (!document.getElementById('cnic-bulk-animations')) {
    const style = document.createElement('style');
    style.id = 'cnic-bulk-animations';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Monitor bulk state changes to update button
  const checkBulkState = setInterval(() => {
    if (!cnicBulkActive && toggleBtn.textContent.includes('Stop')) {
      updateButtonState(false);
      clearInterval(checkBulkState);
    }
  }, 100);
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
    if (autoClickReportLink && window.location.href.includes('/register/register21/0/search')) {
      setTimeout(tryAutoClickReportLink, 300);
    }
  }
  if (typeof request.printRoadCertMsg === 'boolean') {
    printRoadCertMsg = request.printRoadCertMsg;
    if (printRoadCertMsg && window.location.href.includes('/register/roadcertificatereport/')) {
      triggerPrint();
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
    stopCnicBulkSession();
    return;
  }
  if (request.cnicBulkStart && request.cnicBulkNumbers && Array.isArray(request.cnicBulkNumbers)) {
    startCnicBulkSession(request.cnicBulkNumbers);
  }
});

// On load, get the toggle state for all tabs
chrome.storage && chrome.storage.sync.get([
  'editFirAutoClick', 'autoClickMulzimanTab', 'autoClickReportLink', 'printRoadCertMsg',
  'autoClickTab2', 'autoClickTab4', 'autoClickTab6', 'autoClickTab9', 'autoClickTab8', 'autoClickTab7',
  'autoClickTab15', 'autoClickTab3', 'autoClickTab10', 'autoClickTab17', 'autoClickTab12', 'autoClickTab13'
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
  if (autoClickReportLink && window.location.href.includes('/register/register21/0/search')) {
    setTimeout(tryAutoClickReportLink, 300);
  }
  if (printRoadCertMsg && window.location.href.includes('/register/roadcertificatereport/')) {
    triggerPrint();
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

// Function to inject FIR bulk widget on FIRlist page
function injectFirListBulkWidget() {
  if (!window.location.href.includes('firSystem/FIRlist')) return;
  if (document.getElementById('firlist-bulk-widget')) return;

  // Find the ibox-title div
  const iboxTitle = document.querySelector('.ibox-title');
  if (!iboxTitle) return;

  // Find the h5 element inside ibox-title
  const h5Element = iboxTitle.querySelector('h5');
  if (!h5Element) return;

  // Create widget container - inline with buttons
  const widgetDiv = document.createElement('div');
  widgetDiv.id = 'firlist-bulk-widget';
  widgetDiv.style.display = 'inline-block';
  widgetDiv.style.marginLeft = '15px';
  widgetDiv.style.verticalAlign = 'middle';

  // Create form group wrapper with horizontal layout
  const formGroup = document.createElement('div');
  formGroup.style.display = 'flex';
  formGroup.style.alignItems = 'flex-end';
  formGroup.style.gap = '10px';

  // Beautiful textarea with fixed dimensions
  const textarea = document.createElement('textarea');
  textarea.id = 'firlist-bulk-input';
  textarea.className = 'form-control';
  textarea.placeholder = 'Paste FIR numbers here\nOne per line...';
  textarea.style.width = '200px';
  textarea.style.height = '100px';
  textarea.style.resize = 'none';
  textarea.style.fontSize = '13px';
  textarea.style.padding = '10px';
  textarea.style.border = '2px solid #e0e0e0';
  textarea.style.borderRadius = '8px';
  textarea.style.transition = 'all 0.3s ease';
  textarea.style.fontFamily = 'inherit';
  textarea.style.lineHeight = '1.5';
  
  // Interactive focus effects
  textarea.addEventListener('focus', () => {
    textarea.style.borderColor = '#5cb85c';
    textarea.style.boxShadow = '0 0 0 3px rgba(92, 184, 92, 0.1)';
    textarea.style.outline = 'none';
  });
  
  textarea.addEventListener('blur', () => {
    textarea.style.borderColor = '#e0e0e0';
    textarea.style.boxShadow = 'none';
  });
  
  formGroup.appendChild(textarea);

  // Button container (vertical stack) - aligned to bottom
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '8px';
  buttonContainer.style.alignItems = 'stretch';
  buttonContainer.style.justifyContent = 'flex-end';

  // Interactive toggle button - starts as "Bulk Search"
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.id = 'firlist-bulk-toggle-btn';
  toggleBtn.textContent = '🚀 Bulk Search';
  toggleBtn.style.padding = '12px 20px';
  toggleBtn.style.fontSize = '14px';
  toggleBtn.style.fontWeight = '600';
  toggleBtn.style.border = 'none';
  toggleBtn.style.borderRadius = '8px';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  toggleBtn.style.position = 'relative';
  toggleBtn.style.overflow = 'hidden';
  toggleBtn.style.minWidth = '140px';
  toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
  toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
  toggleBtn.style.color = '#fff';
  toggleBtn.style.textTransform = 'uppercase';
  toggleBtn.style.letterSpacing = '0.5px';
  
  // Add hover effect
  toggleBtn.addEventListener('mouseenter', () => {
    toggleBtn.style.transform = 'translateY(-2px)';
    toggleBtn.style.boxShadow = '0 6px 16px rgba(92, 184, 92, 0.4)';
  });
  
  toggleBtn.addEventListener('mouseleave', () => {
    if (!firBulkActive) {
      toggleBtn.style.transform = 'translateY(0)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
    }
  });
  
  // Add active/pressed effect
  toggleBtn.addEventListener('mousedown', () => {
    toggleBtn.style.transform = 'translateY(0) scale(0.98)';
  });
  
  toggleBtn.addEventListener('mouseup', () => {
    if (!firBulkActive) {
      toggleBtn.style.transform = 'translateY(-2px)';
    }
  });
  
  buttonContainer.appendChild(toggleBtn);

  // Status indicator - compact and beautiful
  const status = document.createElement('div');
  status.id = 'firlist-bulk-status-inline';
  status.style.fontSize = '11px';
  status.style.color = '#666';
  status.style.minHeight = '16px';
  status.style.textAlign = 'center';
  status.style.padding = '4px 8px';
  status.style.borderRadius = '4px';
  status.style.background = '#fff';
  status.style.transition = 'all 0.3s ease';
  buttonContainer.appendChild(status);

  formGroup.appendChild(buttonContainer);
  widgetDiv.appendChild(formGroup);

  // Insert into h5 element after the existing buttons
  h5Element.appendChild(widgetDiv);

  // Function to update button state
  const updateButtonState = (isActive) => {
    if (isActive) {
      toggleBtn.textContent = '⏹ Stop';
      toggleBtn.style.background = 'linear-gradient(135deg, #d9534f 0%, #c9302c 100%)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(217, 83, 79, 0.3)';
    } else {
      toggleBtn.textContent = '🚀 Bulk Search';
      toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
      toggleBtn.style.transform = 'translateY(0)';
    }
  };

  // Event listener for toggle button
  toggleBtn.addEventListener('click', () => {
    if (firBulkActive) {
      // Stop the bulk search
      stopFirBulkSession();
      status.textContent = 'Stopped.';
      status.style.color = '#d9534f';
      status.style.background = '#ffe6e6';
      updateButtonState(false);
    } else {
      // Start the bulk search
      const input = textarea.value;
      const numbers = input.split(/\r?\n/).map(n => n.trim()).filter(n => n.length > 0);
      if (numbers.length === 0) {
        status.textContent = 'Please enter at least one FIR number.';
        status.style.color = '#d9534f';
        status.style.background = '#ffe6e6';
        // Shake animation
        toggleBtn.style.animation = 'shake 0.5s';
        setTimeout(() => {
          toggleBtn.style.animation = '';
        }, 500);
        return;
      }
      status.textContent = `Processing ${numbers.length} FIR(s)...`;
      status.style.color = '#5cb85c';
      status.style.background = '#e8f5e9';
      updateButtonState(true);
      startFirBulkSession(numbers, 'fir');
    }
  });

  // Add shake animation CSS if not exists
  if (!document.getElementById('cnic-bulk-animations')) {
    const style = document.createElement('style');
    style.id = 'cnic-bulk-animations';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Update processNextFIR to handle FIRlist status
function updateFirListStatus() {
  const status = document.getElementById('firlist-bulk-status-inline');
  const toggleBtn = document.getElementById('firlist-bulk-toggle-btn');
  if (status) {
    const firBulkData = JSON.parse(localStorage.getItem('fir_bulk_data') || '{}');
    const remaining = (firBulkData.numbers || []).length;
    const totalCount = firBulkData.totalCount || remaining;
    if (remaining > 0) {
      status.textContent = `Processing... ${totalCount - remaining}/${totalCount} completed`;
      status.style.color = '#5cb85c';
      status.style.background = '#e8f5e9';
    } else {
      status.textContent = 'All FIRs processed!';
      status.style.color = '#5cb85c';
      status.style.background = '#e8f5e9';
    }
  }
  if (toggleBtn && !firBulkActive) {
    toggleBtn.textContent = '🚀 Bulk Search';
    toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
    toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
    toggleBtn.style.transform = 'translateY(0)';
  }
}

// On every page load, inject widget and check if this tab is the active session
if (window.location.href.includes('firSystem/FIRlist')) {
  // Try injecting immediately and retry if form not found
  const tryInject = () => {
    injectFirListBulkWidget();
    // If widget wasn't injected (form not found), retry after a short delay
    if (!document.getElementById('firlist-bulk-widget')) {
      setTimeout(tryInject, 300);
    }
  };
  
  setTimeout(() => {
    tryInject();
    let firBulkData = JSON.parse(localStorage.getItem('fir_bulk_data') || '{}');
    if (firBulkData.sessionId && firBulkData.numbers && firBulkData.numbers.length > 0) {
      if (!firBulkSessionId) firBulkSessionId = firBulkData.sessionId;
      firBulkActive = true;
      processNextFIR();
    }
  }, 500);
}

// Function to inject FIR bulk widget on register21 page
function injectFirBulkWidget() {
  if (!window.location.href.includes('/register/register21')) return;
  if (document.getElementById('fir-bulk-widget')) return;

  // Find the form - look for form containing fir_id input
  const firInput = document.getElementById('fir_id');
  if (!firInput) return;
  
  const form = firInput.closest('form');
  if (!form) return;
  
  // Find the row containing the FIR input
  const firInputRow = firInput.closest('.row') || firInput.closest('div[class*="row"]');
  if (!firInputRow) return;

  // Create column container matching form structure
  const colDiv = document.createElement('div');
  colDiv.className = 'col-lg-3';
  colDiv.id = 'fir-bulk-widget';

  // Create form group wrapper with horizontal layout
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  formGroup.style.display = 'flex';
  formGroup.style.alignItems = 'flex-end';
  formGroup.style.gap = '10px';

  // Beautiful textarea with fixed dimensions
  const textarea = document.createElement('textarea');
  textarea.id = 'fir-bulk-input';
  textarea.className = 'form-control';
  textarea.placeholder = 'Paste FIR numbers here\nOne per line...';
  textarea.style.width = '200px';
  textarea.style.height = '100px';
  textarea.style.resize = 'none';
  textarea.style.fontSize = '13px';
  textarea.style.padding = '10px';
  textarea.style.border = '2px solid #e0e0e0';
  textarea.style.borderRadius = '8px';
  textarea.style.transition = 'all 0.3s ease';
  textarea.style.fontFamily = 'inherit';
  textarea.style.lineHeight = '1.5';
  
  // Interactive focus effects
  textarea.addEventListener('focus', () => {
    textarea.style.borderColor = '#5cb85c';
    textarea.style.boxShadow = '0 0 0 3px rgba(92, 184, 92, 0.1)';
    textarea.style.outline = 'none';
  });
  
  textarea.addEventListener('blur', () => {
    textarea.style.borderColor = '#e0e0e0';
    textarea.style.boxShadow = 'none';
  });
  
  formGroup.appendChild(textarea);

  // Button container (vertical stack) - aligned to bottom
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '8px';
  buttonContainer.style.alignItems = 'stretch';
  buttonContainer.style.justifyContent = 'flex-end';

  // Toggle switch for FIR/Rod selection
  const toggleContainer = document.createElement('div');
  toggleContainer.style.display = 'flex';
  toggleContainer.style.gap = '12px';
  toggleContainer.style.marginBottom = '6px';
  toggleContainer.style.fontSize = '12px';
  toggleContainer.style.alignItems = 'center';

  const firRadio = document.createElement('input');
  firRadio.type = 'radio';
  firRadio.name = 'fir-rod-bulk-type';
  firRadio.id = 'fir-rod-bulk-fir';
  firRadio.value = 'fir';
  firRadio.checked = true;
  firRadio.style.cursor = 'pointer';
  firRadio.style.marginRight = '4px';

  const firLabel = document.createElement('label');
  firLabel.htmlFor = 'fir-rod-bulk-fir';
  firLabel.textContent = 'FIR Number';
  firLabel.style.cursor = 'pointer';
  firLabel.style.marginRight = '8px';
  firLabel.style.fontWeight = '500';
  firLabel.style.color = '#333';

  const rodRadio = document.createElement('input');
  rodRadio.type = 'radio';
  rodRadio.name = 'fir-rod-bulk-type';
  rodRadio.id = 'fir-rod-bulk-rod';
  rodRadio.value = 'rod';
  rodRadio.style.cursor = 'pointer';
  rodRadio.style.marginRight = '4px';

  const rodLabel = document.createElement('label');
  rodLabel.htmlFor = 'fir-rod-bulk-rod';
  rodLabel.textContent = 'Rod Number';
  rodLabel.style.cursor = 'pointer';
  rodLabel.style.fontWeight = '500';
  rodLabel.style.color = '#333';

  toggleContainer.appendChild(firRadio);
  toggleContainer.appendChild(firLabel);
  toggleContainer.appendChild(rodRadio);
  toggleContainer.appendChild(rodLabel);

  // Update placeholder based on selection
  const updatePlaceholder = () => {
    const selectedType = document.querySelector('input[name="fir-rod-bulk-type"]:checked').value;
    textarea.placeholder = selectedType === 'fir' 
      ? 'Paste FIR numbers here\nOne per line...'
      : 'Paste Rod numbers here\nOne per line...';
  };

  firRadio.addEventListener('change', updatePlaceholder);
  rodRadio.addEventListener('change', updatePlaceholder);

  buttonContainer.appendChild(toggleContainer);

  // Interactive toggle button - starts as "Bulk Search"
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.id = 'fir-bulk-toggle-btn';
  toggleBtn.textContent = '🚀 Bulk Search';
  toggleBtn.style.padding = '12px 20px';
  toggleBtn.style.fontSize = '14px';
  toggleBtn.style.fontWeight = '600';
  toggleBtn.style.border = 'none';
  toggleBtn.style.borderRadius = '8px';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  toggleBtn.style.position = 'relative';
  toggleBtn.style.overflow = 'hidden';
  toggleBtn.style.minWidth = '140px';
  toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
  toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
  toggleBtn.style.color = '#fff';
  toggleBtn.style.textTransform = 'uppercase';
  toggleBtn.style.letterSpacing = '0.5px';
  
  // Add hover effect
  toggleBtn.addEventListener('mouseenter', () => {
    toggleBtn.style.transform = 'translateY(-2px)';
    toggleBtn.style.boxShadow = '0 6px 16px rgba(92, 184, 92, 0.4)';
  });
  
  toggleBtn.addEventListener('mouseleave', () => {
    if (!firBulkActive) {
      toggleBtn.style.transform = 'translateY(0)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
    }
  });
  
  // Add active/pressed effect
  toggleBtn.addEventListener('mousedown', () => {
    toggleBtn.style.transform = 'translateY(0) scale(0.98)';
  });
  
  toggleBtn.addEventListener('mouseup', () => {
    if (!firBulkActive) {
      toggleBtn.style.transform = 'translateY(-2px)';
    }
  });
  
  buttonContainer.appendChild(toggleBtn);

  // Status indicator - compact and beautiful
  const status = document.createElement('div');
  status.id = 'fir-bulk-status-inline';
  status.style.fontSize = '11px';
  status.style.color = '#666';
  status.style.minHeight = '16px';
  status.style.textAlign = 'center';
  status.style.padding = '4px 8px';
  status.style.borderRadius = '4px';
  status.style.background = '#f8f9fa';
  status.style.transition = 'all 0.3s ease';
  buttonContainer.appendChild(status);

  formGroup.appendChild(buttonContainer);
  colDiv.appendChild(formGroup);

  // Insert into form row (before the FIR input column)
  const firInputCol = firInput.closest('.col-lg-2') || firInput.closest('[class*="col-"]');
  if (firInputCol && firInputCol.parentNode) {
    firInputCol.parentNode.insertBefore(colDiv, firInputCol);
  } else {
    firInputRow.appendChild(colDiv);
  }

  // Function to update button state
  const updateButtonState = (isActive) => {
    if (isActive) {
      toggleBtn.textContent = '⏹ Stop';
      toggleBtn.style.background = 'linear-gradient(135deg, #d9534f 0%, #c9302c 100%)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(217, 83, 79, 0.3)';
    } else {
      toggleBtn.textContent = '🚀 Bulk Search';
      toggleBtn.style.background = 'linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%)';
      toggleBtn.style.boxShadow = '0 4px 12px rgba(92, 184, 92, 0.3)';
      toggleBtn.style.transform = 'translateY(0)';
    }
  };

  // Event listener for toggle button
  toggleBtn.addEventListener('click', () => {
    if (firBulkActive) {
      // Stop the bulk search
      stopFirBulkSession();
      status.textContent = 'Stopped.';
      status.style.color = '#d9534f';
      status.style.background = '#ffe6e6';
      updateButtonState(false);
    } else {
      // Start the bulk search
      const input = textarea.value;
      const numbers = input.split(/\r?\n/).map(n => n.trim()).filter(n => n.length > 0);
      if (numbers.length === 0) {
        const searchType = document.querySelector('input[name="fir-rod-bulk-type"]:checked').value;
        const typeLabel = searchType === 'fir' ? 'FIR number' : 'Rod number';
        status.textContent = `Please enter at least one ${typeLabel}.`;
        status.style.color = '#d9534f';
        status.style.background = '#ffe6e6';
        // Shake animation
        toggleBtn.style.animation = 'shake 0.5s';
        setTimeout(() => {
          toggleBtn.style.animation = '';
        }, 500);
        return;
      }
      const searchType = document.querySelector('input[name="fir-rod-bulk-type"]:checked').value;
      const typeLabel = searchType === 'fir' ? 'FIR' : 'Rod';
      status.textContent = `Processing ${numbers.length} ${typeLabel}(s)...`;
      status.style.color = '#5cb85c';
      status.style.background = '#e8f5e9';
      updateButtonState(true);
      startFirBulkSession(numbers, searchType);
    }
  });

  // Add shake animation CSS if not exists
  if (!document.getElementById('cnic-bulk-animations')) {
    const style = document.createElement('style');
    style.id = 'cnic-bulk-animations';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
  }
}

// On searchPerson page load, inject widget and check if this tab is the active CNIC bulk session
if (window.location.href.includes('/search/searchPerson')) {
  // Try injecting immediately and retry if form not found
  const tryInject = () => {
    injectCnicBulkWidget();
    // If widget wasn't injected (form not found), retry after a short delay
    if (!document.getElementById('cnic-bulk-widget')) {
      setTimeout(tryInject, 300);
    }
  };
  
  setTimeout(() => {
    tryInject();
    let cnicBulkData = JSON.parse(localStorage.getItem('cnic_bulk_data') || '{}');
    if (cnicBulkData.sessionId && cnicBulkData.numbers && cnicBulkData.numbers.length > 0) {
      if (!cnicBulkSessionId) cnicBulkSessionId = cnicBulkData.sessionId;
      cnicBulkActive = true;
      processNextCNIC();
    }
  }, 500);
}

// On register21 page load, inject widget and check if this tab is the active FIR bulk session
if (window.location.href.includes('/register/register21')) {
  // Try injecting immediately and retry if form not found
  const tryInject = () => {
    injectFirBulkWidget();
    // If widget wasn't injected (form not found), retry after a short delay
    if (!document.getElementById('fir-bulk-widget')) {
      setTimeout(tryInject, 300);
    }
  };
  
  setTimeout(() => {
    tryInject();
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
  let cnicBulkData = JSON.parse(localStorage.getItem('cnic_bulk_data') || '{}');
  if (cnicBulkData.sessionId && cnicBulkData.sessionId === cnicBulkSessionId) {
    localStorage.removeItem('cnic_bulk_data');
  }
});
