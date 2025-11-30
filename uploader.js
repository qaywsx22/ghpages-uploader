import {
  resizeAndConvert,
  getBranchInfo,
  createBlob,
  createTree,
  commitAndPush,
  listFolderFiles
} from './utils.js';

/**
 * Initialize the uploader UI on a page.
 * Expects elements with the same IDs as defined in the HTML:
 * - #repo, #branch, #token, #folder
 * - #width, #height, #quality
 * - #files, #upload, #log
 * Additional full-page UI elements (optional but recommended):
 * - #existing-images-container, #existing-images-empty, #refresh-existing
 * - #upload-images-container, #upload-images-empty
 */
export function initUploader({ logElementId = 'log', uploadButtonId = 'upload' } = {}) {
  const logElement = document.getElementById(logElementId);
  const uploadButton = document.getElementById(uploadButtonId);
  const clearLogButton = document.getElementById('clear-log');

  if (!uploadButton) {
    console.warn(`Upload button #${uploadButtonId} not found`);
    return;
  }

  const repoInput = document.getElementById('repo');
  const branchInput = document.getElementById('branch');
  const tokenInput = document.getElementById('token');
  const folderInput = document.getElementById('folder');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const qualityInput = document.getElementById('quality');
  const fileInput = document.getElementById('files');

  const existingContainer = document.getElementById('existing-images-container');
  const existingEmpty = document.getElementById('existing-images-empty');
  const refreshExistingBtn = document.getElementById('refresh-existing');
  const uploadContainer = document.getElementById('upload-images-container');
  const uploadEmpty = document.getElementById('upload-images-empty');

  const log = msg => {
    if (logElement) {
      logElement.textContent += msg + '\n';
    }
    console.log(msg);
  };

  if (clearLogButton && logElement) {
    clearLogButton.addEventListener('click', () => {
      logElement.textContent = '';
    });
  }

  /** @type {{id:string, file:File, selected:boolean, previewUrl:string}[]} */
  let uploadFiles = [];

  /** @type {{id:string, path:string, downloadUrl:string, selected:boolean}[]} */
  let existingFiles = [];

  const renderUploadPreviews = () => {
    if (!uploadContainer) return;
    uploadContainer.innerHTML = '';

    if (!uploadFiles.length) {
      if (uploadEmpty) uploadEmpty.style.display = 'block';
      return;
    }
    if (uploadEmpty) uploadEmpty.style.display = 'none';

    for (const f of uploadFiles) {
      const col = document.createElement('div');
      col.className = 'uk-text-center';

      const label = document.createElement('label');
      label.className = 'uk-display-block';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = f.selected;
      checkbox.className = 'uk-checkbox';
      checkbox.style.marginBottom = '4px';
      checkbox.addEventListener('change', () => {
        f.selected = checkbox.checked;
      });

      const img = document.createElement('img');
      img.src = f.previewUrl;
      img.alt = f.file.name;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '120px';
      img.loading = 'lazy';
      img.className = 'uk-border-rounded';

      const caption = document.createElement('div');
      caption.className = 'uk-text-small uk-margin-small-top';
      caption.textContent = f.file.name;

      label.appendChild(checkbox);
      label.appendChild(img);
      label.appendChild(caption);
      col.appendChild(label);
      uploadContainer.appendChild(col);
    }
  };

  const renderExistingPreviews = () => {
    if (!existingContainer) return;
    existingContainer.innerHTML = '';

    if (!existingFiles.length) {
      if (existingEmpty) existingEmpty.style.display = 'block';
      return;
    }
    if (existingEmpty) existingEmpty.style.display = 'none';

    for (const f of existingFiles) {
      const col = document.createElement('div');
      col.className = 'uk-text-center';

      const label = document.createElement('label');
      label.className = 'uk-display-block';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = f.selected;
      checkbox.className = 'uk-checkbox';
      checkbox.style.marginBottom = '4px';
      checkbox.addEventListener('change', () => {
        f.selected = checkbox.checked;
      });

      const img = document.createElement('img');
      img.src = f.downloadUrl;
      img.alt = f.path;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '120px';
      img.loading = 'lazy';
      img.className = 'uk-border-rounded';

      const caption = document.createElement('div');
      caption.className = 'uk-text-small uk-margin-small-top';
      caption.textContent = f.path.split('/').slice(-1)[0];

      label.appendChild(checkbox);
      label.appendChild(img);
      label.appendChild(caption);
      col.appendChild(label);
      existingContainer.appendChild(col);
    }
  };

  const getRepoContext = () => {
    const repoValue = repoInput?.value.trim() || '';
    const [owner, repo] = repoValue.split('/');
    const branch = branchInput?.value.trim() || 'main';
    const token = tokenInput?.value.trim() || '';
    const folder = folderInput?.value.trim() || '';

    if (!owner || !repo) {
      throw new Error('Invalid repo format (expected owner/repo)');
    }
    if (!token) {
      throw new Error('GitHub token required');
    }

    return { owner, repo, branch, token, folder };
  };

  const refreshExisting = async () => {
    if (!refreshExistingBtn) return;
    try {
      const { owner, repo, branch, token, folder } = getRepoContext();
      log(`Loading existing images from ${folder || '/'}...`);
      const files = await listFolderFiles(owner, repo, branch, folder, token);
      existingFiles = files.map((item, idx) => ({
        id: `existing-${idx}-${item.sha}`,
        path: item.path,
        downloadUrl: item.download_url,
        selected: false
      }));
      renderExistingPreviews();
      if (!existingFiles.length) {
        log('No existing files found in the target folder.');
      }
    } catch (e) {
      console.error(e);
      log(`❌ Error loading existing images: ${e.message}`);
    }
  };

  if (fileInput && uploadContainer) {
    fileInput.addEventListener('change', () => {
      // Revoke previous object URLs
      for (const f of uploadFiles) {
        if (f.previewUrl) {
          URL.revokeObjectURL(f.previewUrl);
        }
      }

      const files = Array.from(fileInput.files || []);
      uploadFiles = files.map((file, idx) => ({
        id: `upload-${idx}-${Date.now()}`,
        file,
        selected: true,
        previewUrl: URL.createObjectURL(file)
      }));

      renderUploadPreviews();
    });
  }

  if (refreshExistingBtn) {
    refreshExistingBtn.addEventListener('click', () => {
      refreshExisting();
    });
  }

  uploadButton.addEventListener('click', async () => {
    let context;
    try {
      context = getRepoContext();
    } catch (e) {
      alert(e.message);
      return;
    }

    const width = parseInt(widthInput?.value || '0', 10) || 0;
    const height = parseInt(heightInput?.value || '0', 10) || 0;
    const quality = parseInt(qualityInput?.value || '80', 10) || 80;

    const selectedUploads = uploadFiles.filter(f => f.selected);
    const selectedDeletes = existingFiles.filter(f => f.selected);

    if (!selectedUploads.length && !selectedDeletes.length) {
      alert('Select at least one image to upload or delete before committing.');
      return;
    }

    try {
      const { owner, repo, branch, token, folder } = context;

      log('Fetching current branch info...');
      const { commitSha, treeSha } = await getBranchInfo(owner, repo, branch, token);
      log(`Base commit: ${commitSha}`);
      log(`Base tree: ${treeSha}`);

      const treeEntries = [];

      // Handle uploads (add/update files)
      for (const f of selectedUploads) {
        log(`Processing ${f.file.name}…`);
        const { name, blob } = await resizeAndConvert(f.file, width, height, quality);
        const sha = await createBlob(owner, repo, token, await blob.arrayBuffer());
        const targetFolder = folder ? folder : '';
        const path = targetFolder ? `${targetFolder}${name}` : name;
        treeEntries.push({ path, sha, mode: '100644' });
        log(`Prepared blob ${sha} for ${path}`);
      }

      // Handle deletions (existing files)
      for (const f of selectedDeletes) {
        log(`Scheduling delete of ${f.path}...`);
        treeEntries.push({ path: f.path, sha: null, mode: '100644' });
      }

      if (!treeEntries.length) {
        log('No changes to commit.');
        return;
      }

      log('Creating new tree...');
      const newTreeSha = await createTree(owner, repo, token, treeSha, treeEntries);
      log(`New tree SHA: ${newTreeSha}`);

      log('Creating commit...');
      const message = `Update images via uploader – ${new Date().toISOString()}`;
      await commitAndPush(owner, repo, token, branch, newTreeSha, commitSha, message);
      log('✅ Commit created. Check your repository / GitHub Pages site.');
    } catch (e) {
      console.error(e);
      log(`❌ Error during commit: ${e.message}`);
    }
  });
}
