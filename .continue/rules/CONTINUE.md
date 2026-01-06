# GitHub Pages Image Uploader - Project Guide

## Project Overview

This is a Chrome Extension built with Manifest V3 that enables users to resize images locally and push them to a GitHub Pages repository using the Git Data API. The extension provides a full-page UIKit-based interface for selecting local images, resizing them to WebP format with specified dimensions and quality, previewing existing and new images, and then uploading them to a GitHub repository via the GitHub API.

Key features:
- Local image processing (no server upload)
- WebP conversion with customizable quality
- Resizing with width/height constraints
- Integration with GitHub Pages repositories
- Commit creation and branch updates via Git Data API
- Modern full-page UI with UIKit design library
- Preview grids for existing repo images and new uploads with drag-and-drop ordering and selection

## Getting Started

### Prerequisites
- Google Chrome browser
- GitHub account with repository access
- GitHub Personal Access Token (PAT) with repo scope

### Installation
1. Clone or download the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this project directory

### Basic Usage
1. Click the extension icon; this opens the **full-page uploader** (`tab.html`) in a new tab.
2. In the "Options" accordion:
   - Enter your GitHub repository (owner/repo format)
   - Provide your GitHub PAT with repo scope
   - Select the target branch and folder
   - Adjust resize parameters (width, height, quality) as needed
3. (Optional) Click **Refresh** in the "Existing images" section to load current images from the target folder and select any to delete.
4. Use the file input in "Images to upload" to select local images; they appear as cards with previews and checkboxes.
5. Use the checkboxes in both sections to choose which images to upload and/or delete.
6. Click **Commit** to create a single commit that applies all selected uploads and deletions.

### Running Tests
This project is a Chrome extension, so testing is typically done manually through the extension UI.

## Project Structure

```
.
├── manifest.json          # Chrome extension manifest (MV3, background service worker)
├── background.js          # Service worker; opens full-page tab on extension icon click
├── tab.html               # Main full-page UIKit-based uploader UI
├── tab.js                 # Wires tab.html to uploader logic and options
├── uploader.js            # Shared upload logic (image processing + Git/GitHub flow)
├── utils.js               # Core functions for image processing and GitHub API interaction
├── options.html           # Options page UI
├── options.js             # Options page logic (Chrome storage integration)
├── css/
│   ├── uikit.min.css      # UIKit CSS
│   ├── tab.css            # Styles for full-page uploader
│   └── options.css        # Styles for options page
├── js/
│   ├── uikit.min.js       # UIKit JS
│   └── uikit-icons.min.js # UIKit icons
├── icons/                 # Extension icons (16x16, 48x48, 128x128)
├── popup.html             # Legacy popup UI (no longer used)
├── popup.js               # Legacy popup logic (no longer used)
├── .git/                  # Git repository (for reference)
└── tmp/                   # Temporary directory (for testing)
```

### Key Files

**manifest.json**: Defines the extension metadata, permissions (storage, scripting), and host permissions for GitHub API access. Uses a background service worker (`background.js`) and a full-page tab (`tab.html`) instead of a browser-action popup.

**tab.html**: Contains the full-page UIKit UI for repository configuration, resize settings (width, height, quality), resize mode selection (Fit, Stretch, Side, Pad, Crop), the "Do not resize smaller images" toggle, existing-image previews, upload previews, and the commit/log sections. Uses UIKit grid, card, accordion, and sortable components.

**tab.js**: Initializes the full-page UI, wires up form fields and buttons, syncs defaults from Chrome storage (including resize mode and the no-upscale option), and calls `initUploader` from `uploader.js`.

**uploader.js**: Implements the main upload flow logic that handles:
- File selection and processing
- Image resizing and conversion via `resizeAndConvert`, based on the selected resize mode and "do not resize smaller images" flag
- GitHub API interaction (branch info, blob creation, tree creation, commit and push)
- Listing existing files in a target folder via `listFolderFiles`
- Rendering card-based preview items for both existing and upload images, with checkboxes for selection and a card body that acts as the sortable drag handle
- Error handling and logging to the on-page log area

**options.html / options.js**: Implement a dedicated options page backed by `chrome.storage.local` for saving defaults such as repo, branch, folder, and other non-sensitive settings (token field currently disabled in the UI for security considerations).

**popup.html / popup.js**: Legacy popup-based UI and logic from the original version. These are no longer wired into the manifest and can be considered deprecated.

**utils.js**: Contains the core functionality:
- `resizeAndConvert()`: Resizes and converts images to WebP format, supporting multiple resize modes (Fit, Stretch, Side, Pad, Crop), optional padding/cropping anchors, and an option to avoid upscaling smaller images
- GitHub API helpers (`githubFetch`, `createBlob`, `createTree`, `commitAndPush`)
- `getBranchInfo()`: Retrieves branch information (note: historically had a bug with an incorrect endpoint)
- `listFolderFiles()`: Lists files in the configured GitHub folder for previews

## Development Workflow

### Coding Standards
- Uses ES6 modules and modern JavaScript features
- Follows Chrome Extension Manifest V3 requirements
- Implements async/await for API calls
- Uses proper error handling and logging
- Leverages UIKit design components for UI consistency

### Testing Approach
Testing is primarily manual through the Chrome extension UI, including:
- Image processing with various parameters
- GitHub API integration
- Error handling scenarios

### Build and Deployment
The project is a Chrome extension that requires:
1. Packaging as a Chrome extension
2. Loading in development mode via `chrome://extensions/`
3. Publishing to Chrome Web Store for distribution

### Contribution Guidelines
- Follow existing code style and patterns
- Add comments for complex logic
- Ensure proper error handling
- Test thoroughly with various image types and parameters
- Utilize UIKit components for consistent UI design

## Key Concepts

### GitHub Git Data API
This extension uses the GitHub Git Data API to:
1. Retrieve branch information (`/git/refs/heads/{branch}`) 
2. Create blobs (`/git/blobs`) for image data
3. Create trees (`/git/trees`) to organize files
4. Create commits (`/git/commits`) to record changes
5. Update branch references (`/git/refs/heads/{branch}`)

### Image Processing Pipeline
1. Select images via file input
2. Convert to WebP format with specified quality
3. Resize images to target dimensions
4. Create blobs with base64-encoded image data
5. Build tree structure with new files
6. Create commit with tree reference
7. Push changes to repository

### Security Considerations
- GitHub PATs are stored in Chrome's storage (session or sync)
- No image data is sent to external servers
- All processing happens locally in the browser

## UI Implementation with UIKit

### Design Philosophy
The extension utilizes the UIKit design library to provide a modern, responsive, and accessible user interface with consistent styling across all components.

### UIKit Components Used
- **Card**: For organizing form sections
- **Form Elements**: Input fields, file selection, and buttons with proper styling
- **Notification**: For displaying logs and messages
- **Grid System**: For responsive layout organization
- **Button**: For action elements with consistent styling

### Benefits of UIKit Integration
- Consistent design language across all UI elements
- Responsive layout that adapts to different screen sizes
- Accessible components with proper ARIA attributes
- Reduced development time with pre-built components
- Built-in theming capabilities

## Common Tasks

### Adding New Features
1. Create new functions in `utils.js` for additional image processing
2. Modify `popup.html` to add UI controls using UIKit components
3. Update `popup.js` to handle new logic
4. Test thoroughly with existing functionality

### Managing GitHub Tokens
1. Use `chrome.storage.session` for temporary token storage
2. Consider encryption for persistent storage (storage.local)
3. Implement token expiration handling

### Implementing Options Page
- Create `options.html` and `options.js` for settings interface
- Use `chrome.storage.sync` for non-sensitive defaults
- Implement settings helper to manage configuration

### Full-Page UI Implementation
- Add `tab.html` for extended interface
- Implement `background.js` for tab management
- Add "Open full page" button in popup to launch tab interface

### Batch Processing
- Implement folder listing functionality
- Add UI to select multiple images for batch operations
- Create commit that deletes/replaces images in one operation

## Troubleshooting

### Common Issues
1. **404 Not Found errors**: Verify repository name format (owner/repo) and branch name
2. **Authentication errors**: Check that your PAT has the correct scopes (repo access)
3. **Rate limiting**: GitHub API has rate limits; consider retry logic
4. **Image processing failures**: Some image formats might not be supported by canvas

### Debugging Tips
1. Check browser console for error messages
2. Use Chrome DevTools to inspect network requests
3. Verify token permissions in GitHub settings
4. Test with smaller images first

## References

- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [GitHub Git Data API](https://docs.github.com/en/rest/git)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Canvas API for Image Processing](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [UIKit Documentation](https://getuikit.com/docs/)
- [UIKit CSS Framework](https://getuikit.com/)
- [UIKit JavaScript Components](https://getuikit.com/docs/javascript)

## Recent Changes (Full-page UI Refactor)

- Switched from popup-based UI to a full-page uploader opened by clicking the extension toolbar icon.
- Added `tab.html` and `tab.js` as the main UIKit-based full-page interface.
- Introduced `uploader.js` to share upload logic between UIs (currently used by the full-page tab).
- Added `background.js` service worker to handle `chrome.action.onClicked` and open `tab.html`.
- Updated `manifest.json` to use a background service worker and removed `default_popup`.
- Marked `popup.html` and `popup.js` as legacy/unused; they can be deleted.

## Recent Changes (Previews, options, and styling)

- Added existing-images and upload-images preview sections with checkboxes allowing selective upload/deletion in a single commit.
- Implemented GitHub folder listing via `listFolderFiles` to fetch current images from the target repo folder.
- Extended commit flow to handle both new uploads and deletions in one Git tree/commit.
- Added `options.html` and `options.js` for a dedicated options page backed by `chrome.storage.local` (token field currently disabled).
- Synced saved options into the full-page header via `tab.js`, and added a "Save options" button in the header to write defaults from within the uploader.
- Updated `tab.html` header to a two-column, accordion-based layout (default expanded) with a clear-log button.
- Extracted inline styles from `tab.html` and `options.html` into `css/tab.css` and `css/options.css`.
- Added a UIKit-based resize mode radio group (Fit, Stretch, Side, Pad, Crop) to `tab.html`.
- Added a "Do not resize images that are already smaller than the target" checkbox to avoid unintended upscaling.
- Updated `tab.js` to persist resize mode and no-upscale options in `chrome.storage.local`.
- Extended `uploader.js` to read resize mode and no-upscale settings from the UI and pass them into `resizeAndConvert`.
- Extended `resizeAndConvert` in `utils.js` to support multiple resize modes, optional padding/cropping anchors, and a no-upscale guard.