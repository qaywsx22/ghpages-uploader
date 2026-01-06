/**
 * Convert an image File to a webP Blob at the requested size and mode.
 * @param {File} file
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {number} quality 0–100
  * @param {{
 *   mode?: 'fit' | 'stretch' | 'side' | 'pad' | 'crop',
 *   noUpscale?: boolean,
 *   sideOption?: 'longest' | 'shortest' | 'width' | 'height',
 *   pad?: { background?: string, position?: string },
 *   crop?: { position?: string },
 *   format?: 'webp' | 'jpg' | 'png'
 * }} [options]

 * @returns {Promise<{name:string, blob:Blob}>}
 */
export async function resizeAndConvert(
  file,
  targetWidth,
  targetHeight,
  quality,
  options = {}
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      const {
        mode = 'fit',
        noUpscale = false,
        sideOption = 'longest',
        pad = {},
        crop = {},
        format = 'webp'
      } = options || {};


      const hasTargetWidth = !!targetWidth;
      const hasTargetHeight = !!targetHeight;

      let canvasWidth = W;
      let canvasHeight = H;
      let drawArgs;
      let usePadBackground = false;

      const padBackground = pad.background || '#ffffff';
      const padPosition = pad.position || 'center';
      const cropPosition = crop.position || 'center';

      const isSmallerThanTarget = () => {
        if (mode === 'side') {
          const targetSide = hasTargetWidth
            ? targetWidth
            : hasTargetHeight
              ? targetHeight
              : 0;
          if (!targetSide) return false;
          const longest = Math.max(W, H);
          return longest <= targetSide;
        }

        const Tw = hasTargetWidth ? targetWidth : 0;
        const Th = hasTargetHeight ? targetHeight : 0;

        if (Tw && Th) {
          return W <= Tw && H <= Th;
        }
        if (Tw) {
          return W <= Tw;
        }
        if (Th) {
          return H <= Th;
        }
        return false;
      };

      const computePadOffsets = (Tw, Th, Dw, Dh, position) => {
        let horiz = 'center';
        let vert = 'center';
        switch (position) {
          case 'top':
            vert = 'top';
            break;
          case 'bottom':
            vert = 'bottom';
            break;
          case 'left':
            horiz = 'left';
            break;
          case 'right':
            horiz = 'right';
            break;
          case 'top-left':
            vert = 'top';
            horiz = 'left';
            break;
          case 'top-right':
            vert = 'top';
            horiz = 'right';
            break;
          case 'bottom-left':
            vert = 'bottom';
            horiz = 'left';
            break;
          case 'bottom-right':
            vert = 'bottom';
            horiz = 'right';
            break;
          default:
            break;
        }

        let dx = 0;
        let dy = 0;

        if (horiz === 'center') dx = (Tw - Dw) / 2;
        else if (horiz === 'right') dx = Tw - Dw;

        if (vert === 'center') dy = (Th - Dh) / 2;
        else if (vert === 'bottom') dy = Th - Dh;

        return { dx, dy };
      };

      const computeCropSourceRect = (W, H, Sw, Sh, position) => {
        let horiz = 'center';
        let vert = 'center';
        switch (position) {
          case 'top':
            vert = 'top';
            break;
          case 'bottom':
            vert = 'bottom';
            break;
          case 'left':
            horiz = 'left';
            break;
          case 'right':
            horiz = 'right';
            break;
          case 'top-left':
            vert = 'top';
            horiz = 'left';
            break;
          case 'top-right':
            vert = 'top';
            horiz = 'right';
            break;
          case 'bottom-left':
            vert = 'bottom';
            horiz = 'left';
            break;
          case 'bottom-right':
            vert = 'bottom';
            horiz = 'right';
            break;
          default:
            break;
        }

        let sx = 0;
        let sy = 0;

        if (horiz === 'center') sx = (W - Sw) / 2;
        else if (horiz === 'right') sx = W - Sw;

        if (vert === 'center') sy = (H - Sh) / 2;
        else if (vert === 'bottom') sy = H - Sh;

        // Clamp to image bounds
        sx = Math.max(0, Math.min(sx, W - Sw));
        sy = Math.max(0, Math.min(sy, H - Sh));

        return { sx, sy };
      };

      // Choose behavior by mode
      if (mode === 'stretch') {
        canvasWidth = hasTargetWidth ? targetWidth : W;
        canvasHeight = hasTargetHeight ? targetHeight : H;
        drawArgs = [img, 0, 0, canvasWidth, canvasHeight];
      } else if (mode === 'side') {
        const targetSide = hasTargetWidth
          ? targetWidth
          : hasTargetHeight
            ? targetHeight
            : 0;
        if (!targetSide) {
          canvasWidth = W;
          canvasHeight = H;
          drawArgs = [img, 0, 0, W, H];
        } else {
          let scale;
          if (sideOption === 'width') {
            scale = targetSide / W;
          } else if (sideOption === 'height') {
            scale = targetSide / H;
          } else if (sideOption === 'shortest') {
            const shortest = Math.min(W, H);
            scale = targetSide / shortest;
          } else {
            const longest = Math.max(W, H);
            scale = targetSide / longest;
          }
          const Dw = Math.round(W * scale);
          const Dh = Math.round(H * scale);
          canvasWidth = Dw;
          canvasHeight = Dh;
          drawArgs = [img, 0, 0, Dw, Dh];
        }
      } else if (mode === 'pad') {
        const Tw = hasTargetWidth ? targetWidth : W;
        const Th = hasTargetHeight ? targetHeight : H;
        const scale = Math.min(Tw / W, Th / H) || 1;
        const Dw = Math.round(W * scale);
        const Dh = Math.round(H * scale);
        canvasWidth = Tw;
        canvasHeight = Th;
        const { dx, dy } = computePadOffsets(Tw, Th, Dw, Dh, padPosition);
        drawArgs = [img, dx, dy, Dw, Dh];
        usePadBackground = true;
      } else if (mode === 'crop') {
        const Tw = hasTargetWidth ? targetWidth : W;
        const Th = hasTargetHeight ? targetHeight : H;
        if (!Tw || !Th) {
          // Fallback to original if no explicit crop size given
          canvasWidth = W;
          canvasHeight = H;
          drawArgs = [img, 0, 0, W, H];
        } else {
          const scale = Math.max(Tw / W, Th / H) || 1;
          const Sw = Math.round(Tw / scale);
          const Sh = Math.round(Th / scale);
          const { sx, sy } = computeCropSourceRect(W, H, Sw, Sh, cropPosition);
          canvasWidth = Tw;
          canvasHeight = Th;
          drawArgs = [img, sx, sy, Sw, Sh, 0, 0, Tw, Th];
        }
      } else {
        // 'fit' mode (default): preserve aspect ratio inside target box
        const Tw = hasTargetWidth ? targetWidth : 0;
        const Th = hasTargetHeight ? targetHeight : 0;
        if (Tw && Th) {
          const scale = Math.min(Tw / W, Th / H) || 1;
          const Dw = Math.round(W * scale);
          const Dh = Math.round(H * scale);
          canvasWidth = Dw;
          canvasHeight = Dh;
          drawArgs = [img, 0, 0, Dw, Dh];
        } else if (Tw) {
          const scale = Tw / W || 1;
          const Dw = Tw;
          const Dh = Math.round(H * scale);
          canvasWidth = Dw;
          canvasHeight = Dh;
          drawArgs = [img, 0, 0, Dw, Dh];
        } else if (Th) {
          const scale = Th / H || 1;
          const Dh = Th;
          const Dw = Math.round(W * scale);
          canvasWidth = Dw;
          canvasHeight = Dh;
          drawArgs = [img, 0, 0, Dw, Dh];
        } else {
          canvasWidth = W;
          canvasHeight = H;
          drawArgs = [img, 0, 0, W, H];
        }
      }

      // Apply "do not resize smaller images" override
      if (noUpscale && isSmallerThanTarget()) {
        canvasWidth = W;
        canvasHeight = H;
        drawArgs = [img, 0, 0, W, H];
        usePadBackground = false;
      }

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      if (mode === 'pad' && usePadBackground) {
        ctx.fillStyle = padBackground;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      ctx.drawImage(...drawArgs);

      // Determine output format and MIME type
      let fmt = (format || 'webp').toLowerCase();
      if (fmt === 'jpeg') fmt = 'jpg';
      if (fmt !== 'webp' && fmt !== 'jpg' && fmt !== 'png') {
        fmt = 'webp';
      }
      const mimeType = fmt === 'png' ? 'image/png' : fmt === 'jpg' ? 'image/jpeg' : 'image/webp';
      const ext = fmt === 'png' ? '.png' : fmt === 'jpg' ? '.jpg' : '.webp';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const outName = baseName + ext;

      canvas.toBlob(
        blob => {
          if (!blob) reject(new Error('Canvas toBlob failed'));
          else resolve({ name: outName, blob });
        },
        mimeType,
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