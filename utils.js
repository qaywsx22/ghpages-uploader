/**
 * Convert an image File to a webP Blob at the requested size.
 * @param {File} file
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {number} quality 0–100
 * @returns {Promise<{name:string, blob:Blob}>}
 */
export async function resizeAndConvert(file, targetWidth, targetHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const w = targetWidth || img.naturalWidth;
      const h = targetHeight || img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        blob => {
          if (!blob) reject(new Error('Canvas toBlob failed'));
          else resolve({ name: file.name.replace(/\.\w+$/, '.webp'), blob });
        },
        'image/webp',
        quality / 100
      );
    };
    img.onerror = e => reject(e);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Basic fetch wrapper that attaches the GitHub PAT.
 */
export async function githubFetch(url, init = {}, token) {
  const headers = init.headers ?? {};
  headers['Authorization'] = `token ${token}`;
  headers['Accept'] = 'application/vnd.github.v3+json';
  return fetch(url, { ...init, headers });
}

/**
 * List files in a repository folder on a given branch using the
 * GitHub Contents API.
 * Returns an array of objects with at least { path, download_url }.
 */
export async function listFolderFiles(owner, repo, branch, folder, token) {
  const trimmed = (folder || '').replace(/^\/+|\/+$/g, '');
  const encodePath = p => p.split('/').map(encodeURIComponent).join('/');
  const base = `https://api.github.com/repos/${owner}/${repo}/contents`;
  const url = trimmed
    ? `${base}/${encodePath(trimmed)}?ref=${encodeURIComponent(branch)}`
    : `${base}?ref=${encodeURIComponent(branch)}`;

  const res = await githubFetch(url, {}, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to list folder contents');
  if (!Array.isArray(json)) return [];
  return json.filter(item => item.type === 'file');
}

/**
 * Create a blob in the repo and return its SHA.
 */
export async function createBlob(owner, repo, token, data, encoding = 'base64') {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  const res = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
    {
      method: 'POST',
      body: JSON.stringify({ content: base64, encoding })
    },
    token
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Blob creation failed');
  return json.sha;
}


/**
 * Create a new tree that adds or updates the given paths.
 */
export async function createTree(owner, repo, token, baseTreeSha, files) {
  // files: [{path, sha, mode:'100644'}]
  const res = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: files.map(f => ({
          path: f.path,
          mode: f.mode,
          type: 'blob',
          sha: f.sha
        }))
      })
    },
    token
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Tree creation failed');
  return json.sha;
}

/**
 * Create a commit pointing to the new tree and update the branch reference.
 */
export async function commitAndPush(owner, repo, token, branch, treeSha, parentSha, message) {
  // 1. create commit
  const commitRes = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: treeSha,
        parents: [parentSha]
      })
    },
    token
  );
  const commitJson = await commitRes.json();
  if (!commitRes.ok) throw new Error(commitJson.message || 'Commit failed');

  // 2. update ref
  const refRes = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ sha: commitJson.sha })
    },
    token
  );
  const refJson = await refRes.json();
  if (!refRes.ok) throw new Error(refJson.message || 'Updating ref failed');
}

/**
 * Get the current HEAD commit SHA and its tree SHA for a branch.
 */
export async function getBranchInfo(owner, repo, branch, token) {
  const refRes = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {},
    token
  );
  const refJson = await refRes.json();
  if (!refRes.ok) throw new Error(refJson.message || 'Branch not found');

  const commitSha = refJson.object.sha;
  const commitRes = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`,
    {},
    token
  );
  const commitJson = await commitRes.json();
  if (!commitRes.ok) throw new Error(commitJson.message || 'Commit fetch failed');

  return { commitSha, treeSha: commitJson.tree.sha };
}