import { initUploader } from './uploader.js';

const FIELD_IDS = ['repo', 'branch', 'token', 'folder', 'width', 'height', 'quality'];

function updateModeOptionVisibility() {
  const modeRadio = document.querySelector('input[name="resize-mode"]:checked');
  const mode = modeRadio ? modeRadio.value : 'fit';

  const sideBlock = document.getElementById('mode-options-side');
  const padBlock = document.getElementById('mode-options-pad');
  const cropBlock = document.getElementById('mode-options-crop');

  if (sideBlock) {
    sideBlock.hidden = mode !== 'side';
  }
  if (padBlock) {
    padBlock.hidden = mode !== 'pad';
  }
  if (cropBlock) {
    cropBlock.hidden = mode !== 'crop';
  }
}

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

      // Restore side/pad/crop specific options
      const sideOptionEl = document.getElementById('side-option');
      if (sideOptionEl && typeof opts.sideOption === 'string') {
        sideOptionEl.value = opts.sideOption;
      }

      const padBackgroundEl = document.getElementById('pad-background');
      if (padBackgroundEl && typeof opts.padBackground === 'string') {
        padBackgroundEl.value = opts.padBackground;
      }

      const padPositionEl = document.getElementById('pad-position');
      if (padPositionEl && typeof opts.padPosition === 'string') {
        padPositionEl.value = opts.padPosition;
      }

      const cropPositionEl = document.getElementById('crop-position');
      if (cropPositionEl && typeof opts.cropPosition === 'string') {
        cropPositionEl.value = opts.cropPosition;
      }

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

      // Restore output format radio group
      if (opts.outputFormat) {
        const formatRadio = document.querySelector(
          `input[name="output-format"][value="${opts.outputFormat}"]`
        );
        if (formatRadio) {
          formatRadio.checked = true;
        }
      }

      // Ensure correct visibility for mode-specific option blocks
      updateModeOptionVisibility();

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

  const formatRadio = document.querySelector('input[name="output-format"]:checked');
  if (formatRadio) {
    options.outputFormat = formatRadio.value;
  }

  const sideOptionEl = document.getElementById('side-option');
  if (sideOptionEl) {
    options.sideOption = sideOptionEl.value;
  }

  const padBackgroundEl = document.getElementById('pad-background');
  if (padBackgroundEl) {
    options.padBackground = padBackgroundEl.value;
  }

  const padPositionEl = document.getElementById('pad-position');
  if (padPositionEl) {
    options.padPosition = padPositionEl.value;
  }

  const cropPositionEl = document.getElementById('crop-position');
  if (cropPositionEl) {
    options.cropPosition = cropPositionEl.value;
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

  // Wire up resize-mode radios to toggle mode-specific sections
  const modeRadios = document.querySelectorAll('input[name="resize-mode"]');
  modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateModeOptionVisibility();
    });
  });

  // Initialize visibility based on default / restored mode
  updateModeOptionVisibility();

  // Initialize the full-page uploader UI after applying stored defaults
  initUploader();
});
