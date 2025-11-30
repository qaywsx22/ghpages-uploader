import {
  resizeAndConvert,
  getBranchInfo,
  createBlob,
  createTree,
  commitAndPush
} from './utils.js';

/**
 * Initialize the uploader UI on a page.
 * Expects elements with the same IDs as defined in the HTML:
 * - #repo, #branch, #token, #folder
 * - #width, #height, #quality
 * - #files, #upload, #log
 */
export function initUploader({ logElementId = 'log', uploadButtonId = 'upload' } = {}) {
  const logElement = document.getElementById(logElementId);
  const uploadButton = document.getElementById(uploadButtonId);

  if (!uploadButton) {
    console.warn(`Upload button #${uploadButtonId} not found`);
    return;
  }

  const log = msg => {
    if (logElement) {
      logElement.textContent += msg + '\n';
    }
    console.log(msg);
  };

  uploadButton.addEventListener('click', async () => {
    const repoInput = document.getElementById('repo').value.trim(); // e.g., octocat/Hello-World
    const [owner, repo] = repoInput.split('/');
    if (!owner || !repo) {
      alert('Invalid repo format');
      return;
    }

    const branch = document.getElementById('branch').value.trim() || 'main';
    const token = document.getElementById('token').value.trim();
    if (!token) {
      alert('GitHub token required');
      return;
    }

    const folder = document.getElementById('folder').value.trim(); // e.g., images/
    const width = parseInt(document.getElementById('width').value, 10) || 0;
    const height = parseInt(document.getElementById('height').value, 10) || 0;
    const quality = parseInt(document.getElementById('quality').value, 10) || 80;

    const fileInput = document.getElementById('files');
    const files = fileInput ? Array.from(fileInput.files) : [];
    if (!files.length) {
      alert('Select at least one image');
      return;
    }

    try {
      log('Fetching current branch info...');
      const { commitSha, treeSha } = await getBranchInfo(owner, repo, branch, token);
      log(`Base commit: ${commitSha}`);
      log(`Base tree: ${treeSha}`);

      const blobInfos = [];
      for (const f of files) {
        log(`Processing ${f.name}…`);
        const { name, blob } = await resizeAndConvert(f, width, height, quality);
        const sha = await createBlob(owner, repo, token, await blob.arrayBuffer());
        const path = folder ? `${folder}${name}` : name;
        blobInfos.push({ path, sha, mode: '100644' });
        log(`Created blob ${sha} for ${path}`);
      }

      log('Creating new tree...');
      const newTreeSha = await createTree(owner, repo, token, treeSha, blobInfos);
      log(`New tree SHA: ${newTreeSha}`);

      log('Creating commit...');
      const message = `Upload images via Chrome extension – ${new Date().toISOString()}`;
      await commitAndPush(owner, repo, token, branch, newTreeSha, commitSha, message);
      log('✅ Success! Check your GitHub Pages site.');
    } catch (e) {
      console.error(e);
      log(`❌ Error: ${e.message}`);
    }
  });
}
