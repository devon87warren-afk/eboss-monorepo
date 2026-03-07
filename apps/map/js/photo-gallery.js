// Photo Gallery System for ANA EBOSS Planner
// Handles photo thumbnails, lightbox viewer, and asset-photo linking

/**
 * Initialize the photo gallery system
 * Creates the lightbox modal if it doesn't exist
 */
function initPhotoGallery() {
  if (document.getElementById('photo-lightbox')) return;
  
  const lightbox = document.createElement('div');
  lightbox.id = 'photo-lightbox';
  lightbox.className = 'photo-lightbox hidden';
  lightbox.innerHTML = `
    <div class="lightbox-overlay">
      <div class="lightbox-content">
        <button class="lightbox-close" title="Close (Esc)">
          <span class="material-icons">close</span>
        </button>
        <button class="lightbox-nav lightbox-prev hidden" title="Previous">
          <span class="material-icons">chevron_left</span>
        </button>
        <button class="lightbox-nav lightbox-next hidden" title="Next">
          <span class="material-icons">chevron_right</span>
        </button>
        <div class="lightbox-image-container">
          <img id="lightbox-image" src="" alt="Asset Photo">
          <div id="lightbox-loading" class="lightbox-loading hidden">
            <div class="spinner"></div>
          </div>
        </div>
        <div class="lightbox-info">
          <h4 id="lightbox-title"></h4>
          <p id="lightbox-meta"></p>
          <div class="lightbox-actions">
            <button id="lightbox-download" class="secondary" title="Download">
              <span class="material-icons">download</span> Download
            </button>
            <button id="lightbox-share" class="secondary" title="Copy Link">
              <span class="material-icons">link</span> Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(lightbox);
  
  // Event listeners
  lightbox.querySelector('.lightbox-close').addEventListener('click', closePhotoLightbox);
  lightbox.querySelector('.lightbox-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closePhotoLightbox();
  });
  
  document.getElementById('lightbox-download').addEventListener('click', downloadCurrentPhoto);
  document.getElementById('lightbox-share').addEventListener('click', shareCurrentPhoto);
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    
    switch (e.key) {
      case 'Escape':
        closePhotoLightbox();
        break;
      case 'ArrowLeft':
        navigateLightbox(-1);
        break;
      case 'ArrowRight':
        navigateLightbox(1);
        break;
    }
  });
}

// Current lightbox state
let lightboxState = {
  currentIndex: 0,
  photos: [],
  currentAsset: null
};

/**
 * Open the photo lightbox
 * @param {string} photoUrl - URL of the photo to display
 * @param {Object} asset - The asset object associated with the photo
 * @param {Array} allPhotos - Optional array of all photos for navigation
 */
function openPhotoLightbox(photoUrl, asset, allPhotos = null) {
  initPhotoGallery();
  
  const lightbox = document.getElementById('photo-lightbox');
  const image = document.getElementById('lightbox-image');
  const loading = document.getElementById('lightbox-loading');
  const title = document.getElementById('lightbox-title');
  const meta = document.getElementById('lightbox-meta');
  
  // Set up navigation if multiple photos
  if (allPhotos && allPhotos.length > 1) {
    lightboxState.photos = allPhotos;
    lightboxState.currentIndex = allPhotos.findIndex(p => p.url === photoUrl);
    lightboxState.currentAsset = asset;
    
    updateLightboxNav();
  } else {
    lightboxState.photos = [{ url: photoUrl, asset }];
    lightboxState.currentIndex = 0;
    lightboxState.currentAsset = asset;
    
    document.querySelector('.lightbox-prev').classList.add('hidden');
    document.querySelector('.lightbox-next').classList.add('hidden');
  }
  
  // Show loading
  loading.classList.remove('hidden');
  image.classList.add('hidden');
  
  // Load image
  image.src = photoUrl;
  image.onload = () => {
    loading.classList.add('hidden');
    image.classList.remove('hidden');
  };
  
  // Set info
  title.textContent = asset?.label || 'Asset Photo';
  meta.textContent = asset?.kw ? `${asset.kw} kW • ${new Date().toLocaleDateString()}` : '';
  
  // Show lightbox
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Close the photo lightbox
 */
function closePhotoLightbox() {
  const lightbox = document.getElementById('photo-lightbox');
  if (lightbox) {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

/**
 * Navigate between photos in lightbox
 * @param {number} direction - -1 for previous, 1 for next
 */
function navigateLightbox(direction) {
  const newIndex = lightboxState.currentIndex + direction;
  
  if (newIndex < 0 || newIndex >= lightboxState.photos.length) return;
  
  lightboxState.currentIndex = newIndex;
  const photo = lightboxState.photos[newIndex];
  
  const image = document.getElementById('lightbox-image');
  const loading = document.getElementById('lightbox-loading');
  const title = document.getElementById('lightbox-title');
  const meta = document.getElementById('lightbox-meta');
  
  loading.classList.remove('hidden');
  image.classList.add('hidden');
  
  image.src = photo.url;
  image.onload = () => {
    loading.classList.add('hidden');
    image.classList.remove('hidden');
  };
  
  title.textContent = photo.asset?.label || 'Asset Photo';
  meta.textContent = photo.asset?.kw ? `${photo.asset.kw} kW` : '';
  
  updateLightboxNav();
}

/**
 * Update lightbox navigation buttons visibility
 */
function updateLightboxNav() {
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');
  
  prevBtn.classList.toggle('hidden', lightboxState.currentIndex === 0);
  nextBtn.classList.toggle('hidden', lightboxState.currentIndex === lightboxState.photos.length - 1);
}

/**
 * Download the current photo
 */
async function downloadCurrentPhoto() {
  const photo = lightboxState.photos[lightboxState.currentIndex];
  if (!photo) return;
  
  try {
    const response = await fetch(photo.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${photo.asset?.label || 'asset'}-photo.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download photo:', error);
    showStatusMessage('Failed to download photo');
  }
}

/**
 * Copy photo link to clipboard
 */
async function shareCurrentPhoto() {
  const photo = lightboxState.photos[lightboxState.currentIndex];
  if (!photo) return;
  
  try {
    await navigator.clipboard.writeText(photo.url);
    showStatusMessage('Photo link copied to clipboard');
  } catch (error) {
    console.error('Failed to copy link:', error);
    showStatusMessage('Failed to copy link');
  }
}

/**
 * Create a photo thumbnail element for the asset list
 * @param {string} photoUrl - URL of the photo
 * @param {Object} asset - The asset object
 * @param {Function} onClick - Optional click handler
 * @returns {HTMLElement} The thumbnail element
 */
function createPhotoThumbnail(photoUrl, asset, onClick = null) {
  const container = document.createElement('div');
  container.className = 'photo-thumbnail';
  
  const img = document.createElement('img');
  img.src = photoUrl;
  img.alt = `${asset.label} photo`;
  img.loading = 'lazy';
  
  // Show placeholder while loading
  img.style.opacity = '0';
  img.onload = () => {
    img.style.opacity = '1';
  };
  
  const overlay = document.createElement('div');
  overlay.className = 'photo-thumbnail-overlay';
  overlay.innerHTML = '<span class="material-icons">zoom_in</span>';
  
  container.appendChild(img);
  container.appendChild(overlay);
  
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      // Get all photos from current filtered assets for navigation
      const allPhotos = taggedAssets
        .filter(a => a.photoUrl)
        .map(a => ({ url: a.photoUrl, asset: a }));
      openPhotoLightbox(photoUrl, asset, allPhotos);
    }
  });
  
  return container;
}

/**
 * Get all photos for a specific project/site
 * @param {string} siteId - The site/project ID
 * @returns {Array} Array of photo objects with url and asset
 */
function getProjectPhotos(siteId) {
  return taggedAssets
    .filter(asset => asset.siteId === siteId && asset.photoUrl)
    .map(asset => ({
      url: asset.photoUrl,
      asset: asset,
      uploadedAt: asset.createdAt
    }));
}

/**
 * Show a gallery view of all photos for the current project
 */
function showProjectGallery() {
  const photos = getProjectPhotos(activeSiteId);
  
  if (photos.length === 0) {
    showStatusMessage('No photos in this project');
    return;
  }
  
  // Create gallery modal
  let modal = document.getElementById('project-gallery-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'project-gallery-modal';
    modal.className = 'dialog-overlay';
    modal.innerHTML = `
      <div class="dialog" style="max-width: 90vw; max-height: 90vh; width: 800px;">
        <div class="dialog-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3>Project Photos (${photos.length})</h3>
          <button class="icon-btn close-gallery">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; max-height: 70vh; overflow-y: auto; padding: 10px;">
          <!-- Photos will be inserted here -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.close-gallery').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
  
  // Update photo grid
  const grid = modal.querySelector('.gallery-grid');
  grid.innerHTML = photos.map(photo => `
    <div class="gallery-item" data-asset-id="${photo.asset.id}" style="cursor: pointer; border-radius: 8px; overflow: hidden; position: relative; aspect-ratio: 1;">
      <img src="${photo.url}" alt="${photo.asset.label}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 5px; font-size: 11px;">
        ${photo.asset.label}
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  grid.querySelectorAll('.gallery-item').forEach((item, index) => {
    item.addEventListener('click', () => {
      openPhotoLightbox(photos[index].url, photos[index].asset, photos);
    });
  });
  
  modal.classList.remove('hidden');
}

// Export functions for use in app.js
window.photoGallery = {
  init: initPhotoGallery,
  open: openPhotoLightbox,
  close: closePhotoLightbox,
  createThumbnail: createPhotoThumbnail,
  getProjectPhotos: getProjectPhotos,
  showProjectGallery: showProjectGallery
};
