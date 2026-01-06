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

      // Restore resize mode radio group
      if (opts.resizeMode) {
        const modeRadio = document.querySelector(
          `input[name="resize-mode"][value="${opts.resizeMode}"]`
        );
        if (modeRadio) {
          modeRadio.checked = true;
        }
      }

      // Restore "do not resize smaller images" checkbox
      const noUpscaleEl = document.getElementById('no-upscale');
      if (noUpscaleEl && typeof opts.noUpscale === 'boolean') {
        noUpscaleEl.checked = opts.noUpscale;
      }

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

  const modeRadio = document.querySelector('input[name="resize-mode"]:checked');
  if (modeRadio) {
    options.resizeMode = modeRadio.value;
  }

  const noUpscaleEl = document.getElementById('no-upscale');
  if (noUpscaleEl) {
    options.noUpscale = !!noUpscaleEl.checked;
  }

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
