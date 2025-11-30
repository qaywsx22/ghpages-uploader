const FIELD_IDS = ['repo', 'branch', 'token', 'folder', 'width', 'height', 'quality'];

function loadOptionsIntoForm() {
  if (!chrome?.storage?.local) return;

  chrome.storage.local.get('options', result => {
    const opts = result.options || {};
    FIELD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (opts[id] !== undefined) {
        el.value = opts[id];
      }
    });
  });
}

function saveOptionsFromForm() {
  const options = {};
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    options[id] = el.value;
  });

  if (!chrome?.storage?.local) return;

  chrome.storage.local.set({ options }, () => {
    const status = document.getElementById('status');
    if (status) {
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadOptionsIntoForm();

  const saveButton = document.getElementById('save-options');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      saveOptionsFromForm();
    });
  }
});
