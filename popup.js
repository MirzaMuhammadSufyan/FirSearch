document.getElementById('openAll').addEventListener('click', function() {
  const input = document.getElementById('firNumbers').value;
  const numbers = input.split(/\s+/).map(n => n.trim()).filter(n => n.length > 0);
  if (numbers.length === 0) {
    document.getElementById('status').textContent = 'Please enter at least one FIR number.';
    return;
  }
  document.getElementById('status').textContent = `Processing ${numbers.length} FIR(s)...`;
  // Send numbers to content script in the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length === 0) return;
    chrome.tabs.sendMessage(tabs[0].id, { firNumbers: numbers, firBulkStart: true });
  });
});

document.getElementById('stopAll').addEventListener('click', function() {
  document.getElementById('status').textContent = 'Stopped.';
  // Send stop message to content script in the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length === 0) return;
    chrome.tabs.sendMessage(tabs[0].id, { firBulkStop: true });
  });
});

// Edit FIR toggle logic
const editFirToggle = document.getElementById('editFirToggle');
// Restore toggle state
chrome.storage.sync.get(['editFirAutoClick'], function(result) {
  editFirToggle.checked = !!result.editFirAutoClick;
});
// Save toggle state and notify all tabs
editFirToggle.addEventListener('change', function() {
  chrome.storage.sync.set({ editFirAutoClick: editFirToggle.checked });
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { editFirAutoClick: editFirToggle.checked });
    });
  });
});

// Mulziman tab toggle logic
const mulzimanTabToggle = document.getElementById('mulzimanTabToggle');
// Restore toggle state
chrome.storage.sync.get(['autoClickMulzimanTab'], function(result) {
  mulzimanTabToggle.checked = !!result.autoClickMulzimanTab;
});
// Save toggle state and notify all tabs
mulzimanTabToggle.addEventListener('change', function() {
  chrome.storage.sync.set({ autoClickMulzimanTab: mulzimanTabToggle.checked });
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { autoClickMulzimanTab: mulzimanTabToggle.checked });
    });
  });
});

// Helper for tab toggles
const tabToggles = [
  { id: 'tab2Toggle', storage: 'autoClickTab2', msg: 'autoClickTab2' },
  { id: 'tab4Toggle', storage: 'autoClickTab4', msg: 'autoClickTab4' },
  { id: 'tab6Toggle', storage: 'autoClickTab6', msg: 'autoClickTab6' },
  { id: 'tab9Toggle', storage: 'autoClickTab9', msg: 'autoClickTab9' },
  { id: 'tab8Toggle', storage: 'autoClickTab8', msg: 'autoClickTab8' },
  { id: 'tab7Toggle', storage: 'autoClickTab7', msg: 'autoClickTab7' },
  { id: 'tab15Toggle', storage: 'autoClickTab15', msg: 'autoClickTab15' },
  { id: 'tab3Toggle', storage: 'autoClickTab3', msg: 'autoClickTab3' },
  { id: 'tab10Toggle', storage: 'autoClickTab10', msg: 'autoClickTab10' },
  { id: 'tab17Toggle', storage: 'autoClickTab17', msg: 'autoClickTab17' },
  { id: 'tab12Toggle', storage: 'autoClickTab12', msg: 'autoClickTab12' },
  { id: 'tab13Toggle', storage: 'autoClickTab13', msg: 'autoClickTab13' },
];
tabToggles.forEach(({ id, storage, msg }) => {
  const el = document.getElementById(id);
  chrome.storage.sync.get([storage], function(result) {
    el.checked = !!result[storage];
  });
  el.addEventListener('change', function() {
    chrome.storage.sync.set({ [storage]: el.checked });
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { [msg]: el.checked });
      });
    });
  });
});

// Tab switching logic
const tabBtns = [
  { btn: document.getElementById('tab-firlist'), panel: document.getElementById('tabPanel-firlist') },
  { btn: document.getElementById('tab-search'), panel: document.getElementById('tabPanel-search') },
  { btn: document.getElementById('tab-editfir'), panel: document.getElementById('tabPanel-editfir') }
  // Add more tabs here in the future
];
tabBtns.forEach(({ btn, panel }, idx) => {
  btn.addEventListener('click', function() {
    tabBtns.forEach(({ btn: b, panel: p }) => {
      b.classList.remove('active');
      p.style.display = 'none';
    });
    btn.classList.add('active');
    panel.style.display = 'block';
  });
});
// Default to first tab (Bulk FIR List Page)
if (tabBtns.length > 0) {
  tabBtns[0].btn.classList.add('active');
  tabBtns[0].panel.style.display = 'block';
}
