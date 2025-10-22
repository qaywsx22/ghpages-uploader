import {
  resizeAndConvert,
  getBranchInfo,
  createBlob,
  createTree,
  commitAndPush
} from './utils.js';

const log = msg => {
  const pre = document.getElementById('log');
  pre.textContent += msg + '\n';
};

document.getElementById('upload').addEventListener('click', async () => {
  const repoInput = document.getElementById('repo').value.trim(); // e.g., octocat/Hello-World
  const [owner, repo] = repoInput.split('/');
  if (!owner || !repo) return alert('Invalid repo format');

  const branch = document.getElementById('branch').value.trim() || 'main';
  const token = document.getElementById('token').value.trim();
  if (!token) return alert('GitHub token required');

  const folder = document.getElementById('folder').value.trim(); // e.g., images/
  const width = parseInt(document.getElementById('width').value) || 0;
  const height = parseInt(document.getElementById('height').value) || 0;
  const quality = parseInt(document.getElementById('quality').value) || 80;

  const files = Array.from(document.getElementById('files').files);
  if (!files.length) return alert('Select at least one image');

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