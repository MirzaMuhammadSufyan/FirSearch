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
