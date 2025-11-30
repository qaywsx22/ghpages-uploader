# GitHub Pages Image Uploader - Project Guide

## Project Overview

This is a Chrome Extension built with Manifest V3 that enables users to resize images locally and push them to a GitHub Pages repository using the Git Data API. The extension provides a user-friendly interface for selecting local images, resizing them to WebP format with specified dimensions and quality, and then uploading them to a GitHub repository via the GitHub API.

Key features:
- Local image processing (no server upload)
- WebP conversion with customizable quality
- Resizing with width/height constraints
- Integration with GitHub Pages repositories
- Commit creation and branch updates via Git Data API
- Modern UI with UIKit design library

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
1. Click the extension icon to open the popup
2. Enter your GitHub repository (owner/repo format)
3. Provide your GitHub PAT with repo scope
4. Select target folder in the repository
5. Set resize parameters (width, height, quality)
6. Select images to upload
7. Click "Upload"

### Running Tests
This project is a Chrome extension, so testing is typically done manually through the extension UI.

## Project Structure

```
.
├── manifest.json          # Chrome extension manifest
├── popup.html             # Extension popup UI with UIKit
├── popup.js               # Popup logic and flow control
├── utils.js               # Core functions for image processing and GitHub API interaction
├── css/                   # UIKit CSS files
├── js/                    # UIKit JS files
├── icons/                 # Extension icons (16x16, 48x48, 128x128)
├── .git/                  # Git repository (for reference)
└── tmp/                   # Temporary directory (for testing)
```

### Key Files

**manifest.json**: Defines the extension metadata, permissions (storage, scripting), and host permissions for GitHub API access.

**popup.html**: Contains the UI for repository configuration, resize settings, file selection, and upload controls using UIKit components.

**popup.js**: Implements the main upload flow logic that handles:
- File selection and processing
- Image resizing and conversion
- GitHub API interaction (branch info, blob creation, tree creation, commit and push)
- Error handling and logging

**utils.js**: Contains the core functionality:
- `resizeAndConvert()`: Resizes and converts images to WebP format
- GitHub API helpers (`githubFetch`, `createBlob`, `createTree`, `commitAndPush`)
- `getBranchInfo()`: Retrieves branch information (note: has a bug - incorrect endpoint)

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