import { initUploader } from './uploader.js';

const FIELD_IDS = ['repo', 'branch', 'token', 'folder', 'width', 'height', 'quality'];

function applyStoredOptionsToHeader() {
  return new Promise(resolve => {
    if (!chrome?.storage?.local) {
      resolve();
      return;
    }

    chrome.storage.local.get('options', result => {
      const opts = result.options || {};
      FIELD_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (opts[id] !== undefined) {
          el.value = opts[id];
        }
      });
      resolve();
    });
  });
}

function saveHeaderOptionsToStorage() {
  if (!chrome?.storage?.local) return;
  const options = {};
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    options[id] = el.value;
  });
  chrome.storage.local.set({ options });
}

document.addEventListener('DOMContentLoaded', async () => {
  await applyStoredOptionsToHeader();

  const saveButton = document.getElementById('save-header-options');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      saveHeaderOptionsToStorage();
    });
  }

  // Initialize the full-page uploader UI after applying stored defaults
  initUploader();
});
