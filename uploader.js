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

    const createPreviewListItem = ({ selected, onSelectedChange, imgSrc, imgAlt, captionText }) => {
    const item = document.createElement('li');
    item.className = 'uk-text-center gph-preview-item';

    const card = document.createElement('div');
    card.className = 'uk-card uk-card-default uk-card-small uk-height-1-1 uk-flex uk-flex-column';

    const cardBody = document.createElement('div');
    cardBody.className = 'uk-card-body uk-sortable-handle';
    cardBody.style.display = 'flex';
    cardBody.style.alignItems = 'center';
    cardBody.style.justifyContent = 'center';

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = imgAlt;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '160px';
    img.loading = 'lazy';
    img.className = 'uk-border-rounded';

    cardBody.appendChild(img);

    const cardFooter = document.createElement('div');
    cardFooter.className = 'uk-card-footer';
    cardFooter.style.display = 'flex';
    cardFooter.style.flexDirection = 'column';
    cardFooter.style.justifyContent = 'space-between';
    // cardFooter.style.minHeight = '64px';

    const firstRow = document.createElement('div');

    firstRow.className = 'uk-flex uk-flex-middle uk-flex-between';

    const label = document.createElement('label');
    label.className = 'uk-flex uk-flex-middle uk-margin-remove';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selected;
    checkbox.className = 'uk-checkbox';
    checkbox.style.marginRight = '6px';
    checkbox.addEventListener('change', () => {
      onSelectedChange?.(checkbox.checked);
    });

    const caption = document.createElement('span');
    caption.className = 'uk-text-small uk-text-truncate';
    caption.textContent = captionText;

    label.appendChild(checkbox);
    label.appendChild(caption);
    firstRow.appendChild(label);

    const secondRow = document.createElement('div');
    secondRow.className = 'uk-text-meta uk-text-small uk-text-truncate';
    secondRow.style.textAlign = 'left';

    let currentAlt = imgAlt;
    secondRow.textContent = currentAlt;

    const enableAltEditing = () => {
      // Prevent multiple editors on the same row
      if (secondRow.querySelector('input')) return;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'uk-input uk-form-small';
      input.value = currentAlt;

      secondRow.textContent = '';
      secondRow.appendChild(input);

      input.focus();
      input.select();

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;

        let nextAlt = input.value.trim();
        if (!nextAlt) {
          nextAlt = imgAlt;
        }

        currentAlt = nextAlt;
        img.alt = nextAlt;
        secondRow.textContent = nextAlt;
      };

      input.addEventListener('blur', () => {
        finish();
      });

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          finish();
        }
      });
    };

    secondRow.addEventListener('dblclick', enableAltEditing);

    cardFooter.appendChild(firstRow);
    cardFooter.appendChild(secondRow);

    card.appendChild(cardBody);
    card.appendChild(cardFooter);
    item.appendChild(card);

    return item;
  };



  const renderUploadPreviews = () => {
    if (!uploadContainer) return;
    uploadContainer.innerHTML = '';

    if (!uploadFiles.length) {
      if (uploadEmpty) uploadEmpty.style.display = 'block';
      return;
    }
    if (uploadEmpty) uploadEmpty.style.display = 'none';

    for (const f of uploadFiles) {
      const item = createPreviewListItem({
        selected: f.selected,
        onSelectedChange: next => {
          f.selected = next;
        },
        imgSrc: f.previewUrl,
        imgAlt: f.file.name,
        captionText: f.file.name
      });

      uploadContainer.appendChild(item);
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
      const item = createPreviewListItem({
        selected: f.selected,
        onSelectedChange: next => {
          f.selected = next;
        },
        imgSrc: f.downloadUrl,
        imgAlt: f.path,
        captionText: f.path.split('/').slice(-1)[0]
      });


      existingContainer.appendChild(item);

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

    const modeInput = document.querySelector('input[name="resize-mode"]:checked');
    const resizeMode = modeInput ? modeInput.value : 'fit';

        const noUpscaleInput = document.getElementById('no-upscale');
    const noUpscale = !!noUpscaleInput?.checked;

    const formatInput = document.querySelector('input[name="output-format"]:checked');
    const outputFormat = formatInput ? formatInput.value : 'webp';

    const sideOptionEl = document.getElementById('side-option');
    const sideOption = sideOptionEl?.value || 'longest';

    const padBackgroundEl = document.getElementById('pad-background');
    const padBackground = padBackgroundEl?.value || '#ffffff';

    const padPositionEl = document.getElementById('pad-position');
    const padPosition = padPositionEl?.value || 'center';

    const cropPositionEl = document.getElementById('crop-position');
    const cropPosition = cropPositionEl?.value || 'center';

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
        const { name, blob } = await resizeAndConvert(f.file, width, height, quality, {
          mode: resizeMode,
          noUpscale,
          format: outputFormat,
          sideOption,
          pad: {
            background: padBackground,
            position: padPosition
          },
          crop: {
            position: cropPosition
          }
        });


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
