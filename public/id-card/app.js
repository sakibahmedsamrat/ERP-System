/**
 * MEP GROUP ID CARD GENERATOR
 * High-Performance Liquid Glass Architecture with Real-Time Persistence
 * GPU-Optimized • Dark Mode Appear Animation • Snappy Micro-Transitions • 60+ FPS Rendering
 */

const LOCAL_STORAGE_KEY = 'mep_id_card_saved_state_v1';
const THEME_STORAGE_KEY = 'mep_id_theme';

// Format any date object into standard 'DD Mon YYYY' format (e.g. '16 Sep 2026')
function getFormattedTodayDate(targetDate = new Date()) {
  const d = (targetDate instanceof Date && !isNaN(targetDate)) ? targetDate : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

const DEFAULT_HEAD_OFFICE = `Head Office :
House-07, Road-10, Block-J, Baridhara,
Dhaka-1212.
Phone : + 88-02-8392043`;

// Application State
const state = {
  // Front fields
  name: '',
  designation: '',
  section: '',
  employeeId: '',
  photoImg: null,
  photoDataUrl: null,
  rawPhotoImg: null,
  rawPhotoDataUrl: null,
  rawPhotoCanvas: null,
  cutoutCanvas: null,
  cutoutDataUrl: null,
  isCutout: false,
  photoScale: 1.0,
  photoOffsetX: 0,
  photoOffsetY: 0,
  photoGlow: 1.0,
  faceGlow: true,
  signatureImg: null,
  signatureDataUrl: null,

  // Back fields
  dateOfIssue: '',
  dateOfJoin: '',
  showDateOfJoin: true,
  bloodGroup: '',
  nid: '',
  emergencyContact: '',
  headOffice: DEFAULT_HEAD_OFFICE,

  // Options
  highResExport: true,
  autoRemoveBg: true
};

// Base Image Assets
const imgTemplateFront = new Image();
const imgTemplateBack = new Image();
const imgQRCode = new Image();
const imgRingOverlay = new Image();
let assetsLoaded = false;

// DOM Elements
let frontCanvas, frontCtx;
let backCanvas, backCtx;
let signatureCanvas, sigCtx;
let isDrawingSignature = false;
let hasDrawnSignature = false;

// Photo canvas dragging state
let isDraggingPhoto = false;
let photoDragStartX = 0;
let photoDragStartY = 0;
let initialOffsetX = 0;
let initialOffsetY = 0;

// High-Performance RAF Scheduler
let frontRenderRaf = null;
let backRenderRaf = null;
let saveTimeout = null;
let toastTimeout = null;

function scheduleRenderFront() {
  if (frontRenderRaf) return;
  frontRenderRaf = requestAnimationFrame(() => {
    frontRenderRaf = null;
    renderFrontCard();
  });
}

function scheduleRenderBack() {
  if (backRenderRaf) return;
  backRenderRaf = requestAnimationFrame(() => {
    backRenderRaf = null;
    renderBackCard();
  });
}

function scheduleRenderAll() {
  scheduleRenderFront();
  scheduleRenderBack();
}

// Auto-save state to LocalStorage (debounced)
function scheduleSaveState() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const activeTabBtn = typeof document.querySelector === 'function' ? document.querySelector('.tab-btn.active') : null;
      const todayFormatted = getFormattedTodayDate();
      const dataToSave = {
        name: state.name,
        designation: state.designation,
        section: state.section,
        employeeId: state.employeeId,
        dateOfIssue: state.dateOfIssue,
        dateOfIssueSavedDate: new Date().toDateString(),
        dateOfIssueCustom: (state.dateOfIssue !== todayFormatted),
        dateOfJoin: state.dateOfJoin,
        showDateOfJoin: state.showDateOfJoin !== false,
        bloodGroup: state.bloodGroup,
        nid: state.nid,
        emergencyContact: state.emergencyContact,
        headOffice: state.headOffice,
        photoScale: state.photoScale,
        photoOffsetX: state.photoOffsetX,
        photoOffsetY: state.photoOffsetY,
        photoGlow: state.photoGlow ?? 1.0,
        faceGlow: state.faceGlow !== false,
        photoDataUrl: state.photoDataUrl,
        rawPhotoDataUrl: state.rawPhotoDataUrl || state.photoDataUrl,
        cutoutDataUrl: state.cutoutDataUrl,
        isCutout: state.isCutout === true,
        signatureDataUrl: state.signatureDataUrl,
        activeTab: activeTabBtn ? activeTabBtn.dataset.tab : 'tabFront',
        autoRemoveBg: state.autoRemoveBg !== false
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.warn('LocalStorage save skipped (quota limit):', err);
    }
  }, 100);
}

// Load saved state from LocalStorage
function loadSavedState() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved);

    if (parsed.name !== undefined) state.name = parsed.name;
    if (parsed.designation !== undefined) state.designation = parsed.designation;
    if (parsed.section !== undefined) state.section = parsed.section;
    if (parsed.employeeId !== undefined) state.employeeId = parsed.employeeId;

    if (parsed.dateOfIssue !== undefined) {
      state.dateOfIssue = parsed.dateOfIssue;
    } else {
      state.dateOfIssue = '';
    }

    if (parsed.dateOfJoin !== undefined) state.dateOfJoin = parsed.dateOfJoin;
    if (parsed.showDateOfJoin !== undefined) state.showDateOfJoin = parsed.showDateOfJoin;
    if (parsed.autoRemoveBg !== undefined) state.autoRemoveBg = parsed.autoRemoveBg;
    if (parsed.faceGlow !== undefined) state.faceGlow = parsed.faceGlow;
    if (parsed.photoGlow !== undefined) state.photoGlow = parsed.photoGlow;
    if (parsed.bloodGroup !== undefined) state.bloodGroup = parsed.bloodGroup;
    if (parsed.nid !== undefined) state.nid = parsed.nid;
    if (parsed.emergencyContact !== undefined) state.emergencyContact = parsed.emergencyContact;
    if (parsed.headOffice !== undefined) {
      if (parsed.headOffice.includes('Eastern Arzoo Tower') || parsed.headOffice.includes('Block-J,\nBaridhara')) {
        state.headOffice = DEFAULT_HEAD_OFFICE;
      } else {
        state.headOffice = parsed.headOffice;
      }
    }
    if (parsed.photoScale !== undefined) state.photoScale = parsed.photoScale;
    if (parsed.photoOffsetX !== undefined) state.photoOffsetX = parsed.photoOffsetX;
    if (parsed.photoOffsetY !== undefined) state.photoOffsetY = parsed.photoOffsetY;
    if (parsed.photoDataUrl) state.photoDataUrl = parsed.photoDataUrl;
    if (parsed.rawPhotoDataUrl) state.rawPhotoDataUrl = parsed.rawPhotoDataUrl;
    if (parsed.cutoutDataUrl) state.cutoutDataUrl = parsed.cutoutDataUrl;
    if (parsed.isCutout !== undefined) state.isCutout = parsed.isCutout;
    if (parsed.signatureDataUrl) state.signatureDataUrl = parsed.signatureDataUrl;

    syncInputsFromState();

    if (parsed.activeTab) {
      const btn = document.querySelector(`.tab-btn[data-tab="${parsed.activeTab}"]`);
      if (btn) btn.click();
    }
    return true;
  } catch (err) {
    console.error('Error loading saved state:', err);
    return false;
  }
}

// Sync form inputs & numeric badges from state object
function syncInputsFromState() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };

  setVal('inputName', state.name);
  setVal('inputDesignation', state.designation);
  setVal('inputSection', state.section);
  setVal('inputEmployeeId', state.employeeId);
  setVal('inputDateOfIssue', state.dateOfIssue);
  setVal('inputDateOfJoin', state.dateOfJoin);
  setDateOfJoinVisibility(state.showDateOfJoin !== false, false);
  setAutoRemoveBgVisibility(state.autoRemoveBg !== false, false);
  setVal('inputBloodGroup', state.bloodGroup);
  setVal('inputNID', state.nid);
  setVal('inputEmergencyContact', state.emergencyContact);
  setVal('inputHeadOffice', state.headOffice);

  setVal('photoZoom', state.photoScale);
  setVal('photoPanX', state.photoOffsetX);
  setVal('photoPanY', state.photoOffsetY);
  setVal('photoGlow', state.photoGlow ?? 1.0);
  setAutoRemoveBgVisibility(state.autoRemoveBg !== false, false);
  setFaceGlowVisibility(state.faceGlow !== false, false);

  updateSliderBadges();
  updatePhotoUploaderUI();
}

// Auto Remove Bg Visibility Toggle Controller
function setAutoRemoveBgVisibility(show, showNotification = false) {
  const prevVal = state.autoRemoveBg;
  state.autoRemoveBg = (show === true);
  const btnToggle = document.getElementById('btnToggleAutoRemoveBg');
  const label = document.getElementById('autoRemoveBgStatusLabel');

  if (btnToggle) {
    if (state.autoRemoveBg) {
      btnToggle.classList.add('active');
      btnToggle.setAttribute('aria-pressed', 'true');
      btnToggle.title = 'Auto Remove Background is ON. Click to toggle.';
      if (label) label.textContent = 'Auto BG Remove: ON';
    } else {
      btnToggle.classList.remove('active');
      btnToggle.setAttribute('aria-pressed', 'false');
      btnToggle.title = 'Auto Remove Background is OFF. Click to toggle.';
      if (label) label.textContent = 'Auto BG Remove: OFF';
    }
  }

  // If toggled and a photo is loaded, reprocess or revert cleanly
  if (prevVal !== state.autoRemoveBg) {
    if (state.autoRemoveBg) {
      if (state.cutoutCanvas) {
        state.isCutout = true;
        updateActiveEnhancedPhoto();
        if (showNotification) showToast('Background removed & studio face glow active!');
      } else if (state.rawPhotoImg) {
        processPhotoSource(state.rawPhotoImg, { notify: showNotification });
      }
    } else {
      state.isCutout = false;
      updateActiveEnhancedPhoto();
      if (showNotification) showToast('Original photo background restored');
    }
  }

  scheduleSaveState();
  if (showNotification && !state.rawPhotoImg) {
    showToast(state.autoRemoveBg ? 'Auto Remove Background is ON' : 'Auto Remove Background is OFF');
  }
}

// Studio Face Glow Visibility Toggle Controller
function setFaceGlowVisibility(show, showNotification = false) {
  state.faceGlow = (show === true);
  const btnToggle = document.getElementById('btnToggleFaceGlow');
  const label = document.getElementById('faceGlowStatusLabel');

  if (btnToggle) {
    if (state.faceGlow) {
      btnToggle.classList.add('active');
      btnToggle.setAttribute('aria-pressed', 'true');
      btnToggle.title = 'Studio Face Glow is ON. Click to toggle.';
      if (label) label.textContent = 'Face Glow: ON';
    } else {
      btnToggle.classList.remove('active');
      btnToggle.setAttribute('aria-pressed', 'false');
      btnToggle.title = 'Studio Face Glow is OFF. Click to toggle.';
      if (label) label.textContent = 'Face Glow: OFF';
    }
  }

  updateActiveEnhancedPhoto();
  scheduleSaveState();
  if (showNotification) {
    showToast(state.faceGlow ? 'Studio Face Glow is ON' : 'Studio Face Glow is OFF');
  }
}

// Update live numeric slider badges & dynamic liquid tracks
function updateSliderBadges() {
  const zoomEl = document.getElementById('photoZoom');
  const panXEl = document.getElementById('photoPanX');
  const panYEl = document.getElementById('photoPanY');
  const glowEl = document.getElementById('photoGlow');

  const valZoom = document.getElementById('valZoom');
  const valPanX = document.getElementById('valPanX');
  const valPanY = document.getElementById('valPanY');
  const valGlow = document.getElementById('valGlow');

  if (valZoom && zoomEl) valZoom.textContent = `${state.photoScale.toFixed(2)}x`;
  if (valPanX && panXEl) valPanX.textContent = `${Math.round(state.photoOffsetX)}px`;
  if (valPanY && panYEl) valPanY.textContent = `${Math.round(state.photoOffsetY)}px`;
  if (valGlow && glowEl) valGlow.textContent = `${(state.photoGlow ?? 1.0).toFixed(1)}x`;

  // Compute dynamic fill track progress percentages
  if (zoomEl) {
    const pct = Math.max(0, Math.min(100, ((state.photoScale - 0.5) / 2.0) * 100));
    zoomEl.style.setProperty('--slider-progress', `${pct.toFixed(1)}%`);
  }
  if (panXEl) {
    const pct = Math.max(0, Math.min(100, ((state.photoOffsetX - (-120)) / 240) * 100));
    panXEl.style.setProperty('--slider-progress', `${pct.toFixed(1)}%`);
  }
  if (panYEl) {
    const pct = Math.max(0, Math.min(100, ((state.photoOffsetY - (-120)) / 240) * 100));
    panYEl.style.setProperty('--slider-progress', `${pct.toFixed(1)}%`);
  }
  if (glowEl) {
    const pct = Math.max(0, Math.min(100, (((state.photoGlow ?? 1.0) - 0) / 2.0) * 100));
    glowEl.style.setProperty('--slider-progress', `${pct.toFixed(1)}%`);
  }
}

// Update Photo Uploader status and display preview thumbnail
function updatePhotoUploaderUI() {
  const uploaderText = document.getElementById('uploaderText');
  const uploaderSubtext = document.getElementById('uploaderSubtext');
  const previewWrap = document.getElementById('photoPreviewWrap');
  const previewThumb = document.getElementById('photoPreviewThumb');
  const iconWrap = document.getElementById('uploaderIconWrap');

  if (state.photoDataUrl) {
    if (uploaderText) {
      uploaderText.textContent = 'Photo Active • Click to Replace';
      uploaderText.classList.add('has-photo');
    }
    if (uploaderSubtext) {
      uploaderSubtext.textContent = 'Drag on card or use sliders to pan/zoom';
    }
    if (previewThumb) {
      previewThumb.src = state.photoDataUrl;
    }
    if (previewWrap) previewWrap.style.display = 'flex';
    if (iconWrap) iconWrap.style.display = 'none';
  } else {
    if (uploaderText) {
      uploaderText.textContent = 'Upload or Drag Photo Here';
      uploaderText.classList.remove('has-photo');
    }
    if (uploaderSubtext) {
      uploaderSubtext.textContent = 'JPG, PNG • Drag & scroll canvas to pan/zoom';
    }
    if (previewWrap) previewWrap.style.display = 'none';
    if (iconWrap) iconWrap.style.display = 'flex';
  }
}

// Update sliding tab glass capsule position
function updateTabIndicator(tabId) {
  const indicator = document.getElementById('tabIndicator');
  if (!indicator) return;
  if (tabId === 'tabBack') {
    indicator.style.transform = 'translateX(calc(100% + 6px))';
  } else {
    indicator.style.transform = 'translateX(0)';
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCanvases();
  initSignaturePad();
  initEventListeners();
  setHeadOfficeLock(true);
  initCanvasPhotoInteractions();
  updateTabIndicator('tabFront');
  loadAssets();
});

// ----------------------------------------------------
// Theme Management with Dark Mode Appear Reveal Animation
// ----------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  let theme = savedTheme;
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(theme);

  const btnToggle = document.getElementById('btnThemeToggle');
  if (btnToggle) {
    btnToggle.addEventListener('click', (e) => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      toggleThemeWithAnimation(newTheme, e);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeModeText = document.getElementById('themeModeText');
  if (themeModeText) {
    themeModeText.textContent = theme === 'dark' ? 'Light' : 'Dark';
  }
  const btnToggle = document.getElementById('btnThemeToggle');
  if (btnToggle) {
    btnToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    btnToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function toggleThemeWithAnimation(targetTheme, event) {
  const isViewTransitionSupported = Boolean(document.startViewTransition)
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Compute origin coordinate (click coordinate or button center)
  let clientX = window.innerWidth / 2;
  let clientY = 0;
  if (event) {
    if (typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event.currentTarget && event.currentTarget.getBoundingClientRect) {
      const rect = event.currentTarget.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }
  }

  if (!isViewTransitionSupported) {
    // High-Performance Ripple Wave Fallback for older browsers
    runFallbackRipple(targetTheme, clientX, clientY);
    applyTheme(targetTheme);
    showToast(`Switched to ${targetTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
    return;
  }

  // Modern View Transition API: Expand circular clipPath from click point across full viewport
  const endRadius = Math.hypot(
    Math.max(clientX, window.innerWidth - clientX),
    Math.max(clientY, window.innerHeight - clientY)
  );

  const transition = document.startViewTransition(() => {
    applyTheme(targetTheme);
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${clientX}px ${clientY}px)`,
          `circle(${endRadius}px at ${clientX}px ${clientY}px)`
        ]
      },
      {
        duration: 460,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)'
      }
    );
  });

  showToast(`Switched to ${targetTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
}

function runFallbackRipple(targetTheme, clientX, clientY) {
  const rippleOverlay = document.getElementById('themeRipple');
  if (!rippleOverlay) return;

  const xPercent = (clientX / window.innerWidth) * 100;
  const yPercent = (clientY / window.innerHeight) * 100;

  rippleOverlay.style.setProperty('--ripple-x', `${xPercent.toFixed(1)}%`);
  rippleOverlay.style.setProperty('--ripple-y', `${yPercent.toFixed(1)}%`);
  rippleOverlay.style.backgroundColor = targetTheme === 'dark' ? '#090d16' : '#f1f5f9';

  rippleOverlay.classList.remove('animating');
  void rippleOverlay.offsetWidth;
  rippleOverlay.classList.add('animating');

  setTimeout(() => {
    rippleOverlay.classList.remove('animating');
  }, 500);
}

// Initialize Canvases
function initCanvases() {
  frontCanvas = document.getElementById('frontCanvas');
  frontCtx = frontCanvas.getContext('2d', { alpha: false });
  frontCanvas.width = 646;
  frontCanvas.height = 1021;

  backCanvas = document.getElementById('backCanvas');
  backCtx = backCanvas.getContext('2d', { alpha: false });
  backCanvas.width = 646;
  backCanvas.height = 1021;
}

// Load Embedded Base64 Assets
function loadAssets() {
  let loadedCount = 0;
  const totalAssets = 4;

  function onAssetLoad() {
    loadedCount++;
    if (loadedCount === totalAssets) {
      assetsLoaded = true;
      const hasSaved = loadSavedState();

      // Apply URL params
      const params = new URLSearchParams(window.location.search);
      if (params.has('name')) state.name = params.get('name');
      if (params.has('designation')) state.designation = params.get('designation');
      if (params.has('section')) state.section = params.get('section');
      if (params.has('id')) state.employeeId = params.get('id');
      if (params.has('joinDate')) state.dateOfJoin = params.get('joinDate');
      if (params.has('blood')) state.bloodGroup = params.get('blood');
      if (params.has('phone')) state.emergencyContact = params.get('phone');
      if (params.has('nid')) state.nid = params.get('nid');
      if (params.has('photo') || params.has('photoUrl')) {
        const photoParam = params.get('photo') || params.get('photoUrl');
        loadPhotoIntoState(photoParam);
      }
      if (params.has('signature') || params.has('signatureUrl')) {
        const sigParam = params.get('signature') || params.get('signatureUrl');
        loadSignatureIntoState(sigParam);
      }
      if (typeof syncInputsFromState === 'function') syncInputsFromState();

      // Restore photo
      if (hasSaved && (state.photoDataUrl || state.rawPhotoDataUrl)) {
        restoreSavedPhotos();
      } else {
        initDefaultPhoto();
      }

      // Restore signature
      if (hasSaved && state.signatureDataUrl) {
        const sigImg = new Image();
        sigImg.onload = () => {
          state.signatureImg = sigImg;
          renderSignatureToPad(sigImg);
          scheduleRenderFront();
        };
        sigImg.src = state.signatureDataUrl;
      }

      scheduleRenderAll();
    }
  }

  imgTemplateFront.onload = onAssetLoad;
  imgTemplateBack.onload = onAssetLoad;
  imgQRCode.onload = onAssetLoad;
  imgRingOverlay.onload = onAssetLoad;

  imgTemplateFront.src = TEMPLATE_FRONT_B64;
  imgTemplateBack.src = TEMPLATE_BACK_B64;
  imgQRCode.src = QR_CODE_B64;
  imgRingOverlay.src = RING_OVERLAY_B64;
}

// Default silhouette avatar
function initDefaultPhoto() {
  const offscreen = document.createElement('canvas');
  offscreen.width = 300;
  offscreen.height = 300;
  const ctx = offscreen.getContext('2d');

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 300, 300);

  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(150, 110, 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(150, 260, 95, Math.PI, 0, false);
  ctx.fill();

  const img = new Image();
  img.onload = () => {
    state.photoImg = img;
    scheduleRenderFront();
  };
  img.src = offscreen.toDataURL();
}

// Set up UI Event Listeners
function initEventListeners() {
  // Tabs navigation with snappy animated pane switch & fluid sliding capsule
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(tabId);
      if (activePane) activePane.classList.add('active');
      updateTabIndicator(tabId);
      scheduleSaveState();
    });
  });

  // Inputs with live reactive update & auto-save
  bindInput('inputName', 'name', scheduleRenderFront);
  bindInput('inputDesignation', 'designation', scheduleRenderFront);
  bindInput('inputSection', 'section', scheduleRenderFront);
  bindInput('inputEmployeeId', 'employeeId', scheduleRenderFront);

  bindInput('inputDateOfIssue', 'dateOfIssue', scheduleRenderBack);
  bindInput('inputDateOfJoin', 'dateOfJoin', scheduleRenderBack);
  bindInput('inputBloodGroup', 'bloodGroup', scheduleRenderBack);
  bindInput('inputNID', 'nid', scheduleRenderBack);
  bindInput('inputEmergencyContact', 'emergencyContact', scheduleRenderBack);
  bindInput('inputHeadOffice', 'headOffice', scheduleRenderBack);

  // Head Office Lock / Unlock Toggle Button
  const btnToggleLockHeadOffice = document.getElementById('btnToggleLockHeadOffice');
  if (btnToggleLockHeadOffice) {
    btnToggleLockHeadOffice.addEventListener('click', () => {
      setHeadOfficeLock(!isHeadOfficeLocked, true);
    });
  }

  // Guidance feedback when interacting with locked textarea
  const headOfficeTextarea = document.getElementById('inputHeadOffice');
  if (headOfficeTextarea) {
    headOfficeTextarea.addEventListener('click', () => {
      if (isHeadOfficeLocked) {
        showToast('Click the Unlock button above to edit Head Office Address');
      }
    });
    headOfficeTextarea.addEventListener('keydown', (e) => {
      if (isHeadOfficeLocked && !['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        showToast('Click the Unlock button above to edit Head Office Address');
      }
    });
  }

  // Photo controls
  const photoInput = document.getElementById('photoInput');
  const photoUploader = document.getElementById('photoUploader');

  photoUploader.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', handlePhotoUpload);

  photoUploader.addEventListener('dragover', (e) => {
    e.preventDefault();
    photoUploader.classList.add('dragover');
  });
  photoUploader.addEventListener('dragleave', () => {
    photoUploader.classList.remove('dragover');
  });
  photoUploader.addEventListener('drop', (e) => {
    e.preventDefault();
    photoUploader.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        showToast('Please drop a valid image file (JPG/PNG)!');
        return;
      }
      processPhotoSource(file, { notify: true });
    }
  });

  // Photo Zoom, Pan & Face Glow sliders with Live Numeric Badges
  const zoomSlider = document.getElementById('photoZoom');
  zoomSlider.addEventListener('input', (e) => {
    state.photoScale = parseFloat(e.target.value);
    updateSliderBadges();
    scheduleRenderFront();
    scheduleSaveState();
  });

  const panXSlider = document.getElementById('photoPanX');
  panXSlider.addEventListener('input', (e) => {
    state.photoOffsetX = parseFloat(e.target.value);
    updateSliderBadges();
    scheduleRenderFront();
    scheduleSaveState();
  });

  const panYSlider = document.getElementById('photoPanY');
  panYSlider.addEventListener('input', (e) => {
    state.photoOffsetY = parseFloat(e.target.value);
    updateSliderBadges();
    scheduleRenderFront();
    scheduleSaveState();
  });

  const glowSlider = document.getElementById('photoGlow');
  let glowDebounce = null;
  if (glowSlider) {
    glowSlider.addEventListener('input', (e) => {
      state.photoGlow = parseFloat(e.target.value);
      updateSliderBadges();
      clearTimeout(glowDebounce);
      glowDebounce = setTimeout(() => {
        updateActiveEnhancedPhoto();
      }, 35);
    });
  }

  document.getElementById('btnResetPhotoAdjust').addEventListener('click', () => {
    state.photoScale = 1.0;
    state.photoOffsetX = 0;
    state.photoOffsetY = 0;
    state.photoGlow = 1.0;
    zoomSlider.value = 1.0;
    panXSlider.value = 0;
    panYSlider.value = 0;
    if (glowSlider) glowSlider.value = 1.0;
    updateSliderBadges();
    updateActiveEnhancedPhoto();
    showToast('Photo position & glow reset');
  });

  // Signature image upload
  const sigInput = document.getElementById('sigImageInput');
  sigInput.addEventListener('change', handleSignatureUpload);

  // Signature pad clear
  document.getElementById('btnClearSig').addEventListener('click', clearSignature);

  // Download buttons
  const btnFront = document.getElementById('btnDownloadFront');
  if (btnFront) btnFront.addEventListener('click', () => downloadCard('front'));

  const btnBack = document.getElementById('btnDownloadBack');
  if (btnBack) btnBack.addEventListener('click', () => downloadCard('back'));

  const btnBoth = document.getElementById('btnDownloadBoth');
  if (btnBoth) btnBoth.addEventListener('click', downloadBothCards);

  const btnBothHeader = document.getElementById('btnDownloadBothHeader');
  if (btnBothHeader) btnBothHeader.addEventListener('click', downloadBothCards);

  // Today's date quick action button ("Date of Issue")
  const btnSetToday = document.getElementById('btnSetTodayDate');
  if (btnSetToday) {
    btnSetToday.addEventListener('click', () => {
      const todayFormatted = getFormattedTodayDate();
      state.dateOfIssue = todayFormatted;
      const inputEl = document.getElementById('inputDateOfIssue');
      if (inputEl) inputEl.value = todayFormatted;
      scheduleRenderBack();
      scheduleSaveState();
      showToast(`Date of Issue set to Today (${todayFormatted})`);
    });
  }

  // Calendar picker helper for Date of Issue
  const btnPickDate = document.getElementById('btnPickDate');
  const datePickerHelper = document.getElementById('datePickerHelper');
  if (btnPickDate && datePickerHelper) {
    btnPickDate.addEventListener('click', () => {
      try {
        if (typeof datePickerHelper.showPicker === 'function') {
          datePickerHelper.showPicker();
        } else {
          datePickerHelper.click();
        }
      } catch (err) {
        datePickerHelper.click();
      }
    });

    datePickerHelper.addEventListener('change', (e) => {
      const val = e.target.value; // YYYY-MM-DD
      if (!val) return;
      const [y, m, d] = val.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = months[parseInt(m, 10) - 1];
      const formatted = `${d} ${monthName} ${y}`;
      state.dateOfIssue = formatted;
      const inputEl = document.getElementById('inputDateOfIssue');
      if (inputEl) inputEl.value = formatted;
      scheduleRenderBack();
      scheduleSaveState();
      showToast(`Date of Issue set to: ${formatted}`);
    });
  }

  // Date of Joining ON/OFF visibility toggle button
  const btnToggleJoin = document.getElementById('btnToggleDateOfJoin');
  if (btnToggleJoin) {
    btnToggleJoin.addEventListener('click', () => {
      setDateOfJoinVisibility(!state.showDateOfJoin, true);
    });
  }

  // Auto Remove Background Toggle
  const btnToggleAutoRemoveBg = document.getElementById('btnToggleAutoRemoveBg');
  if (btnToggleAutoRemoveBg) {
    btnToggleAutoRemoveBg.addEventListener('click', () => {
      setAutoRemoveBgVisibility(!state.autoRemoveBg, true);
    });
  }

  // Studio Face Glow Toggle
  const btnToggleFaceGlow = document.getElementById('btnToggleFaceGlow');
  if (btnToggleFaceGlow) {
    btnToggleFaceGlow.addEventListener('click', () => {
      setFaceGlowVisibility(!state.faceGlow, true);
    });
  }

  // Reset Confirmation Modal Handlers
  const resetModal = document.getElementById('resetModal');
  const btnOpenResetModal = document.getElementById('btnOpenResetModal');
  const btnCancelReset = document.getElementById('btnCancelReset');
  const btnConfirmReset = document.getElementById('btnConfirmReset');

  function openResetModal() {
    if (!resetModal) return;
    resetModal.classList.add('is-open');
    resetModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (btnCancelReset) btnCancelReset.focus();
  }

  function closeResetModal() {
    if (!resetModal) return;
    resetModal.classList.remove('is-open');
    resetModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnOpenResetModal) {
    btnOpenResetModal.addEventListener('click', openResetModal);
  }
  if (btnCancelReset) {
    btnCancelReset.addEventListener('click', closeResetModal);
  }
  if (btnConfirmReset) {
    btnConfirmReset.addEventListener('click', () => {
      closeResetModal();
      resetAllDefaults();
    });
  }
  if (resetModal) {
    // Click outside modal content closes modal
    resetModal.addEventListener('click', (e) => {
      if (e.target === resetModal) {
        closeResetModal();
      }
    });
  }

  // Escape key dismisses modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resetModal && resetModal.classList.contains('is-open')) {
      closeResetModal();
    }
  });

  // Reset to default button (legacy fallback if present)
  const btnReset = document.getElementById('btnResetDefault');
  if (btnReset) btnReset.addEventListener('click', openResetModal);
}

// Head Office Lock State Controller (Initially Locked, No Password Required)
let isHeadOfficeLocked = true;

function setHeadOfficeLock(locked, showNotification = false) {
  isHeadOfficeLocked = locked;
  const textarea = document.getElementById('inputHeadOffice');
  const btnLock = document.getElementById('btnToggleLockHeadOffice');
  const lockStatusText = document.getElementById('lockStatusText');
  const iconLocked = document.querySelector('.lock-icon.icon-locked');
  const iconUnlocked = document.querySelector('.lock-icon.icon-unlocked');

  if (textarea) {
    if (locked) {
      textarea.setAttribute('readonly', 'true');
      textarea.classList.add('is-locked');
      textarea.title = 'Head Office Address is locked. Click Unlock to edit.';
    } else {
      textarea.removeAttribute('readonly');
      textarea.classList.remove('is-locked');
      textarea.title = 'Edit Head Office Address';
      textarea.focus();
      const len = textarea.value.length;
      textarea.setSelectionRange(len, len);
    }
  }

  if (btnLock) {
    if (locked) {
      btnLock.classList.remove('unlocked');
      btnLock.classList.add('locked');
      btnLock.setAttribute('aria-pressed', 'false');
      btnLock.setAttribute('aria-label', 'Unlock Head Office Address');
      btnLock.title = 'Click to Unlock Head Office Address';
      if (lockStatusText) lockStatusText.textContent = 'Locked';
      if (iconLocked) iconLocked.style.display = 'block';
      if (iconUnlocked) iconUnlocked.style.display = 'none';
      if (showNotification) showToast('Head Office Address locked');
    } else {
      btnLock.classList.remove('locked');
      btnLock.classList.add('unlocked');
      btnLock.setAttribute('aria-pressed', 'true');
      btnLock.setAttribute('aria-label', 'Lock Head Office Address');
      btnLock.title = 'Click to Lock Head Office Address';
      if (lockStatusText) lockStatusText.textContent = 'Unlocked';
      if (iconLocked) iconLocked.style.display = 'none';
      if (iconUnlocked) iconUnlocked.style.display = 'block';
      if (showNotification) showToast('Head Office Address unlocked - Now editable');
    }
  }
}

// Date of Joining Visibility Toggle Controller (ON/OFF on Card)
function setDateOfJoinVisibility(show, showNotification = false) {
  state.showDateOfJoin = (show === true);
  const btnToggle = document.getElementById('btnToggleDateOfJoin');
  const label = document.getElementById('dateOfJoinStatusLabel');
  const inputEl = document.getElementById('inputDateOfJoin');

  if (btnToggle) {
    if (state.showDateOfJoin) {
      btnToggle.classList.add('active');
      btnToggle.setAttribute('aria-pressed', 'true');
      btnToggle.title = 'Date of Joining is visible on card. Click to hide.';
      if (label) label.textContent = 'ON';
    } else {
      btnToggle.classList.remove('active');
      btnToggle.setAttribute('aria-pressed', 'false');
      btnToggle.title = 'Date of Joining is hidden on card. Click to show.';
      if (label) label.textContent = 'OFF';
    }
  }

  if (inputEl) {
    if (state.showDateOfJoin) {
      inputEl.removeAttribute('disabled');
      inputEl.classList.remove('is-field-disabled');
      inputEl.title = 'Enter Date of Joining';
    } else {
      inputEl.setAttribute('disabled', 'true');
      inputEl.classList.add('is-field-disabled');
      inputEl.title = 'Date of Joining is currently hidden/blank on ID card';
    }
  }

  scheduleRenderBack();
  scheduleSaveState();
  if (showNotification) {
    showToast(state.showDateOfJoin ? 'Date of Join enabled on card' : 'Date of Join hidden on card');
  }
}

// Helper to bind input
function bindInput(id, stateKey, onChangeCallback) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', (e) => {
    state[stateKey] = e.target.value;
    onChangeCallback();
    scheduleSaveState();
  });
}

// Singleton MediaPipe SelfieSegmentation instance for fast reuse
let selfieSegmentationInstance = null;

function getSelfieSegmentation() {
  if (selfieSegmentationInstance) return selfieSegmentationInstance;
  if (typeof SelfieSegmentation === 'undefined') return null;
  try {
    selfieSegmentationInstance = new SelfieSegmentation({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });
    selfieSegmentationInstance.setOptions({
      modelSelection: 1 // fast landscape model
    });
    return selfieSegmentationInstance;
  } catch (err) {
    console.warn('Failed to initialize SelfieSegmentation:', err);
    return null;
  }
}

// MediaPipe Person Segmentation (async promise)
function segmentPersonMediaPipe(sourceImg) {
  return new Promise((resolve, reject) => {
    const segmenter = getSelfieSegmentation();
    if (!segmenter) {
      return reject(new Error('MediaPipe SelfieSegmentation is not available'));
    }

    let isResolved = false;
    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error('MediaPipe segmentation timeout (6s)'));
      }
    }, 6000);

    segmenter.onResults((results) => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timeout);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = results.image.width || sourceImg.naturalWidth || sourceImg.width;
        canvas.height = results.image.height || sourceImg.naturalHeight || sourceImg.height;
        const ctx = canvas.getContext('2d');

        // Draw the segmentation mask
        ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

        // Clip source image to person mask
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        resolve(canvas);
      } catch (err) {
        reject(err);
      }
    });

    segmenter.send({ image: sourceImg }).catch((err) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

// Intelligent Solid / Studio Backdrop Background Removal Fallback
// Operates cleanly offline on studio passport photos, white walls, and solid backdrops
function removeSolidStudioBackground(sourceImg) {
  const canvas = document.createElement('canvas');
  const w = sourceImg.naturalWidth || sourceImg.width;
  const h = sourceImg.naturalHeight || sourceImg.height;
  if (!w || !h) return null;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceImg, 0, 0, w, h);

  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch (e) {
    return null;
  }
  const data = imgData.data;

  // 1. Check if already transparent (>6% transparent pixels)
  let transparentCount = 0;
  const sampleStep = Math.max(1, Math.floor((w * h) / 1000));
  for (let i = 3; i < data.length; i += 4 * sampleStep) {
    if (data[i] < 30) transparentCount++;
  }
  if ((transparentCount / (data.length / (4 * sampleStep))) > 0.06) {
    return canvas;
  }

  // 2. Sample background color along top edge and upper outer margins
  let bgR = 0, bgG = 0, bgB = 0, sampleCount = 0;
  const sampleMarginY = Math.max(3, Math.floor(h * 0.09));
  const sampleMarginX = Math.max(3, Math.floor(w * 0.14));

  for (let y = 0; y < sampleMarginY; y += 2) {
    for (let x = 0; x < w; x += 3) {
      const idx = (y * w + x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      sampleCount++;
    }
  }
  for (let y = sampleMarginY; y < Math.floor(h * 0.40); y += 3) {
    for (let x = 0; x < sampleMarginX; x += 3) {
      const idx = (y * w + x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      sampleCount++;
    }
    for (let x = w - sampleMarginX; x < w; x += 3) {
      const idx = (y * w + x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      sampleCount++;
    }
  }

  if (sampleCount === 0) return null;
  bgR /= sampleCount;
  bgG /= sampleCount;
  bgB /= sampleCount;

  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
  const isLightBg = bgLum > 140;

  // Check background variance
  let variance = 0;
  for (let y = 0; y < sampleMarginY; y += 4) {
    for (let x = 0; x < w; x += 6) {
      const idx = (y * w + x) * 4;
      const dr = data[idx] - bgR;
      const dg = data[idx + 1] - bgG;
      const db = data[idx + 2] - bgB;
      variance += Math.sqrt(dr * dr + dg * dg + db * db);
    }
  }
  const avgVar = variance / (sampleCount / 4 || 1);

  if (avgVar > 65 && bgLum < 210) {
    // Backdrop is not sufficiently uniform to segment without ML
    return null;
  }

  const threshold = Math.max(32, Math.min(68, 40 + (bgLum > 200 ? 14 : 0)));
  const ramp = 22;

  // Protect central face area
  const centerX = w / 2;
  const centerY = h * 0.44;
  const protectRadiusX = w * 0.23;
  const protectRadiusY = h * 0.28;

  let removedPixels = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const dx = (x - centerX) / protectRadiusX;
      const dy = (y - centerY) / protectRadiusY;
      const distFromCenter = dx * dx + dy * dy;

      if (distFromCenter < 1.0 && isLightBg && (0.299 * r + 0.587 * g + 0.114 * b) < 235) {
        continue;
      }

      const cDist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (cDist < threshold || (isLightBg && lum > 242)) {
        data[idx + 3] = 0;
        removedPixels++;
      } else if (cDist < (threshold + ramp)) {
        const factor = (cDist - threshold) / ramp;
        data[idx + 3] = Math.min(data[idx + 3], Math.round(factor * 255));
        removedPixels++;
      }
    }
  }

  if (removedPixels < (w * h * 0.05)) {
    return null;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// Intelligent Studio Lighting & Subtle Face Glow Enhancement (Non-Destructive)
// Lifts underexposed camera phone facial shadows and adds warm radiant skin vitality
function applyStudioPortraitEnhancement(sourceCanvas, glowFactor = 1.0) {
  if (!sourceCanvas) return null;
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  if (!w || !h) return sourceCanvas;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = w;
  outputCanvas.height = h;
  const ctx = outputCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0);

  if (glowFactor <= 0) return outputCanvas;

  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch (e) {
    console.warn('Canvas pixel enhancement skipped (CORS/context):', e);
    return outputCanvas;
  }
  const data = imgData.data;

  // Studio lighting tuning parameters
  const contrastFactor = 1.0 + (0.04 * glowFactor);
  const vibranceFactor = 1.0 + (0.06 * glowFactor);

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 10) continue;

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // 1. Natural studio shadow & midtone lift (smooth gamma curve)
    // Dark facial shadows (lum < 150) are lifted, highlights (> 220) protected from clipping
    const shadowWeight = Math.max(0, (220 - lum) / 220);
    const lift = Math.round(20 * glowFactor * shadowWeight);

    r += lift;
    g += lift;
    b += lift;

    // 2. Warm golden skin radiance
    const isSkin = (r > g) && (g > b) && ((r - b) > 12) && (lum > 35) && (lum < 225);
    if (isSkin) {
      r += Math.round(7 * glowFactor * shadowWeight);
      g += Math.round(3.5 * glowFactor * shadowWeight);
      b += Math.round(0.5 * glowFactor * shadowWeight);
    } else {
      r += Math.round(2 * glowFactor * shadowWeight);
      g += Math.round(1 * glowFactor * shadowWeight);
    }

    // 3. Gentle contrast centering around 128
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // 4. Subtle vibrance & saturation
    const currentLum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = currentLum + (r - currentLum) * vibranceFactor;
    g = currentLum + (g - currentLum) * vibranceFactor;
    b = currentLum + (b - currentLum) * vibranceFactor;

    data[i] = Math.min(255, Math.max(0, Math.round(r)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

// Dynamically generate enhanced photo image from base canvas and current glow settings
function updateActiveEnhancedPhoto() {
  const baseCanvas = (state.autoRemoveBg && state.cutoutCanvas)
    ? state.cutoutCanvas
    : state.rawPhotoCanvas;

  if (!baseCanvas) {
    if (state.photoImg) scheduleRenderFront();
    return;
  }

  state.isCutout = Boolean(state.autoRemoveBg && state.cutoutCanvas);
  const glowLevel = (state.faceGlow !== false) ? (state.photoGlow ?? 1.0) : 0.0;
  const enhancedCanvas = applyStudioPortraitEnhancement(baseCanvas, glowLevel);

  try {
    const finalDataUrl = enhancedCanvas.toDataURL('image/png');
    const finalImg = new Image();
    finalImg.onload = () => {
      state.photoImg = finalImg;
      state.photoDataUrl = finalDataUrl;
      updatePhotoUploaderUI();
      scheduleRenderFront();
      scheduleSaveState();
    };
    finalImg.src = finalDataUrl;
  } catch (e) {
    console.warn('Canvas toDataURL failed in updateActiveEnhancedPhoto:', e);
    scheduleRenderFront();
  }
}

// Restore saved photo canvas objects cleanly after page reload
function restoreSavedPhotos() {
  const initPhotoCanvas = (img, callback) => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    callback(c);
  };

  const loadRaw = (cb) => {
    if (state.rawPhotoDataUrl) {
      const rImg = new Image();
      rImg.onload = () => {
        state.rawPhotoImg = rImg;
        initPhotoCanvas(rImg, (c) => {
          state.rawPhotoCanvas = c;
          cb();
        });
      };
      rImg.src = state.rawPhotoDataUrl;
    } else {
      cb();
    }
  };

  const loadCutout = (cb) => {
    if (state.cutoutDataUrl) {
      const cImg = new Image();
      cImg.onload = () => {
        initPhotoCanvas(cImg, (c) => {
          state.cutoutCanvas = c;
          state.isCutout = true;
          cb();
        });
      };
      cImg.src = state.cutoutDataUrl;
    } else {
      cb();
    }
  };

  loadRaw(() => {
    loadCutout(() => {
      if (state.photoDataUrl) {
        const pImg = new Image();
        pImg.onload = () => {
          state.photoImg = pImg;
          updatePhotoUploaderUI();
          scheduleRenderFront();
        };
        pImg.src = state.photoDataUrl;
      } else {
        updateActiveEnhancedPhoto();
      }
    });
  });
}

// Unified Photo Processing Pipeline (Handles File, URL, Image, BG Removal & Face Glow)
function processPhotoSource(source, options = {}) {
  const notify = options.notify !== false;

  const handleLoadedImage = async (img, originalDataUrl) => {
    state.rawPhotoImg = img;
    state.rawPhotoDataUrl = originalDataUrl;

    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = img.naturalWidth || img.width;
    rawCanvas.height = img.naturalHeight || img.height;
    rawCanvas.getContext('2d').drawImage(img, 0, 0);
    state.rawPhotoCanvas = rawCanvas;

    const finalizePhotoState = (finalImg, finalDataUrl, isCutoutVal, msg) => {
      state.photoImg = finalImg;
      state.photoDataUrl = finalDataUrl;
      state.isCutout = isCutoutVal;
      state.photoScale = 1.0;
      state.photoOffsetX = 0;
      state.photoOffsetY = 0;
      const zoomInput = document.getElementById('photoZoom');
      if (zoomInput) zoomInput.value = 1.0;
      const panX = document.getElementById('photoPanX');
      if (panX) panX.value = 0;
      const panY = document.getElementById('photoPanY');
      if (panY) panY.value = 0;
      updateSliderBadges();
      updatePhotoUploaderUI();
      scheduleRenderFront();
      scheduleSaveState();
      if (notify && msg) showToast(msg);
    };

    if (!state.autoRemoveBg) {
      // Auto BG removal is OFF -> use raw photo with studio glow
      state.isCutout = false;
      state.cutoutCanvas = null;
      state.cutoutDataUrl = null;
      const glowLevel = (state.faceGlow !== false) ? (state.photoGlow ?? 1.0) : 0.0;
      const enhanced = applyStudioPortraitEnhancement(rawCanvas, glowLevel);
      const enhancedDataUrl = enhanced.toDataURL('image/png');
      const enhancedImg = new Image();
      enhancedImg.onload = () => {
        finalizePhotoState(enhancedImg, enhancedDataUrl, false, 'Photo loaded with studio face glow!');
      };
      enhancedImg.src = enhancedDataUrl;
      return;
    }

    if (notify) showToast('Removing background & applying studio face glow...');

    // Attempt 1: MediaPipe AI Segmentation
    try {
      const cutoutCanvas = await segmentPersonMediaPipe(img);
      state.cutoutCanvas = cutoutCanvas;
      state.cutoutDataUrl = cutoutCanvas.toDataURL('image/png');
      state.isCutout = true;

      const glowLevel = (state.faceGlow !== false) ? (state.photoGlow ?? 1.0) : 0.0;
      const enhancedCanvas = applyStudioPortraitEnhancement(cutoutCanvas, glowLevel);
      const cleanDataUrl = enhancedCanvas.toDataURL('image/png');
      const cleanImg = new Image();
      cleanImg.onload = () => {
        finalizePhotoState(cleanImg, cleanDataUrl, true, 'Background removed & studio face glow applied!');
      };
      cleanImg.src = cleanDataUrl;
      return;
    } catch (err) {
      console.warn('MediaPipe background removal skipped/failed, trying smart fallback:', err);
    }

    // Attempt 2: Smart Solid / Studio Backdrop Segmentation Fallback
    try {
      const smartCutout = removeSolidStudioBackground(img);
      if (smartCutout) {
        state.cutoutCanvas = smartCutout;
        state.cutoutDataUrl = smartCutout.toDataURL('image/png');
        state.isCutout = true;

        const glowLevel = (state.faceGlow !== false) ? (state.photoGlow ?? 1.0) : 0.0;
        const enhancedCanvas = applyStudioPortraitEnhancement(smartCutout, glowLevel);
        const cleanDataUrl = enhancedCanvas.toDataURL('image/png');
        const cleanImg = new Image();
        cleanImg.onload = () => {
          finalizePhotoState(cleanImg, cleanDataUrl, true, 'Background removed & studio face glow applied!');
        };
        cleanImg.src = cleanDataUrl;
        return;
      }
    } catch (smartErr) {
      console.warn('Smart background removal fallback failed:', smartErr);
    }

    // Attempt 3: General studio face glow on photo canvas
    try {
      state.isCutout = false;
      state.cutoutCanvas = null;
      state.cutoutDataUrl = null;
      const glowLevel = (state.faceGlow !== false) ? (state.photoGlow ?? 1.0) : 0.0;
      const enhancedCanvas = applyStudioPortraitEnhancement(rawCanvas, glowLevel);
      const fbDataUrl = enhancedCanvas.toDataURL('image/png');
      const fbImg = new Image();
      fbImg.onload = () => {
        finalizePhotoState(fbImg, fbDataUrl, false, 'Photo loaded with studio face glow!');
      };
      fbImg.src = fbDataUrl;
    } catch (fbErr) {
      finalizePhotoState(img, originalDataUrl, false, 'Photo loaded successfully!');
    }
  };

  if (source instanceof File || source instanceof Blob) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => handleLoadedImage(img, dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(source);
  } else if (typeof source === 'string') {
    const img = new Image();
    if (!source.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => handleLoadedImage(img, source);
    img.onerror = () => {
      if (!source.startsWith('data:')) {
        const fallback = new Image();
        fallback.onload = () => handleLoadedImage(fallback, source);
        fallback.src = source;
      }
    };
    img.src = source;
  } else if (source instanceof HTMLImageElement) {
    handleLoadedImage(source, source.src);
  }
}

// Handle Photo Upload
function handlePhotoUpload(e) {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG/PNG)!');
      return;
    }
    processPhotoSource(file, { notify: true });
  }
}

// Helper to trim transparent borders from canvas
function getTrimmedCanvas(sourceCanvas) {
  const sCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  let imgData;
  try {
    imgData = sCtx.getImageData(0, 0, w, h);
  } catch (e) {
    return null;
  }
  const data = imgData.data;
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 12) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;

  minX = Math.max(0, minX - 6);
  minY = Math.max(0, minY - 6);
  maxX = Math.min(w - 1, maxX + 6);
  maxY = Math.min(h - 1, maxY + 6);

  const trimW = maxX - minX + 1;
  const trimH = maxY - minY + 1;

  const trimmed = document.createElement('canvas');
  trimmed.width = trimW;
  trimmed.height = trimH;
  trimmed.getContext('2d').drawImage(sourceCanvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
  return trimmed;
}

// Intelligent Signature Background Removal (Clean White/Transparent + Contrast Boost)
function removeSignatureBackground(sourceImg) {
  const canvas = document.createElement('canvas');
  const w = sourceImg.naturalWidth || sourceImg.width;
  const h = sourceImg.naturalHeight || sourceImg.height;
  if (!w || !h) return null;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceImg, 0, 0, w, h);

  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch (e) {
    console.warn('Canvas getImageData failed:', e);
    return null;
  }
  const data = imgData.data;

  // 1. Check if the image is already largely transparent
  let transparentCount = 0;
  const sampleStep = Math.max(1, Math.floor((w * h) / 1000));
  for (let i = 3; i < data.length; i += 4 * sampleStep) {
    if (data[i] < 30) transparentCount++;
  }
  const isAlreadyTransparent = (transparentCount / (data.length / (4 * sampleStep))) > 0.20;

  // 2. Sample background luminance along the edges to detect paper tone
  let bgLuminanceSum = 0;
  let bgSamples = 0;
  const stepX = Math.max(1, Math.floor(w / 40));
  const stepY = Math.max(1, Math.floor(h / 40));

  for (let x = 0; x < w; x += stepX) {
    const topIdx = (0 * w + x) * 4;
    const btmIdx = ((h - 1) * w + x) * 4;
    if (data[topIdx + 3] > 100) {
      bgLuminanceSum += 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];
      bgSamples++;
    }
    if (data[btmIdx + 3] > 100) {
      bgLuminanceSum += 0.299 * data[btmIdx] + 0.587 * data[btmIdx + 1] + 0.114 * data[btmIdx + 2];
      bgSamples++;
    }
  }

  for (let y = 0; y < h; y += stepY) {
    const leftIdx = (y * w + 0) * 4;
    const rightIdx = (y * w + (w - 1)) * 4;
    if (data[leftIdx + 3] > 100) {
      bgLuminanceSum += 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
      bgSamples++;
    }
    if (data[rightIdx + 3] > 100) {
      bgLuminanceSum += 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
      bgSamples++;
    }
  }

  const avgBgLuminance = bgSamples > 0 ? (bgLuminanceSum / bgSamples) : 240;
  const threshold = isAlreadyTransparent ? 235 : Math.max(145, Math.min(235, avgBgLuminance - 20));
  const ramp = 30;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 10) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum >= threshold) {
      // Paper background -> completely transparent!
      data[i + 3] = 0;
    } else {
      // Ink stroke: smooth anti-aliased alpha
      let newAlpha = 255;
      if (lum > (threshold - ramp)) {
        const factor = (threshold - lum) / ramp;
        newAlpha = Math.round(factor * 255);
      }

      // Preserve pen color (blue or black) with enriched contrast
      const isBluePen = (b > r + 15 && b > g);
      if (isBluePen) {
        data[i] = Math.max(0, Math.round(r * 0.7));
        data[i + 1] = Math.max(0, Math.round(g * 0.7));
        data[i + 2] = Math.min(215, Math.round(b * 1.1));
      } else {
        data[i] = Math.max(0, Math.round(r * 0.55));
        data[i + 1] = Math.max(0, Math.round(g * 0.55));
        data[i + 2] = Math.max(0, Math.round(b * 0.55));
      }
      data[i + 3] = Math.min(a, newAlpha);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Auto-trim outer margins
  const trimmed = getTrimmedCanvas(canvas);
  return trimmed || canvas;
}

// Helper to render signature cleanly fitted and centered in signature pad
function renderSignatureToPad(img) {
  if (!sigCtx || !signatureCanvas || !img) return;
  sigCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  // Fill clean white background
  sigCtx.fillStyle = '#ffffff';
  sigCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);

  const aspect = img.width / img.height;
  let drawW = signatureCanvas.width * 0.82;
  let drawH = drawW / aspect;
  if (drawH > signatureCanvas.height * 0.82) {
    drawH = signatureCanvas.height * 0.82;
    drawW = drawH * aspect;
  }
  const drawX = (signatureCanvas.width - drawW) / 2;
  const drawY = (signatureCanvas.height - drawH) / 2;
  sigCtx.drawImage(img, drawX, drawY, drawW, drawH);
  hasDrawnSignature = true;
  const placeholder = document.getElementById('sigPlaceholder');
  if (placeholder) placeholder.style.display = 'none';
}

// Handle Signature Upload with Auto Background Removal
function handleSignatureUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  showToast('Removing signature background... Please wait.');

  const reader = new FileReader();
  reader.onload = (evt) => {
    const rawDataUrl = evt.target.result;
    const rawImg = new Image();
    rawImg.onload = () => {
      try {
        const cleanCanvas = removeSignatureBackground(rawImg);
        const finalDataUrl = cleanCanvas ? cleanCanvas.toDataURL('image/png') : rawDataUrl;
        const finalImg = new Image();
        finalImg.onload = () => {
          state.signatureImg = finalImg;
          state.signatureDataUrl = finalDataUrl;
          renderSignatureToPad(finalImg);
          scheduleRenderFront();
          scheduleSaveState();
          showToast('Signature uploaded & background removed!');
        };
        finalImg.src = finalDataUrl;
      } catch (err) {
        console.error('Signature BG removal error:', err);
        state.signatureImg = rawImg;
        state.signatureDataUrl = rawDataUrl;
        renderSignatureToPad(rawImg);
        scheduleRenderFront();
        scheduleSaveState();
        showToast('Signature added successfully!');
      }
    };
    rawImg.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

// Signature Pad Logic
function initSignaturePad() {
  signatureCanvas = document.getElementById('signatureCanvas');
  sigCtx = signatureCanvas.getContext('2d');
  
  signatureCanvas.width = 380;
  signatureCanvas.height = 110;
  sigCtx.lineWidth = 2.5;
  sigCtx.lineCap = 'round';
  sigCtx.lineJoin = 'round';
  sigCtx.strokeStyle = '#000000';

  function getPos(e) {
    const r = signatureCanvas.getBoundingClientRect();
    const scaleX = signatureCanvas.width / r.width;
    const scaleY = signatureCanvas.height / r.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
    return {
      x: (clientX - r.left) * scaleX,
      y: (clientY - r.top) * scaleY
    };
  }

  function startDrawing(e) {
    e.preventDefault();
    isDrawingSignature = true;
    hasDrawnSignature = true;
    const placeholder = document.getElementById('sigPlaceholder');
    if (placeholder) placeholder.style.display = 'none';
    const pos = getPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawingSignature) return;
    e.preventDefault();
    const pos = getPos(e);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
  }

  function stopDrawing() {
    if (!isDrawingSignature) return;
    isDrawingSignature = false;
    const trimmed = getTrimmedCanvas(signatureCanvas);
    const dataUrl = trimmed ? trimmed.toDataURL('image/png') : signatureCanvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      state.signatureImg = img;
      state.signatureDataUrl = dataUrl;
      scheduleRenderFront();
      scheduleSaveState();
    };
    img.src = dataUrl;
  }

  signatureCanvas.addEventListener('mousedown', startDrawing);
  signatureCanvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDrawing);

  signatureCanvas.addEventListener('touchstart', startDrawing, { passive: false });
  signatureCanvas.addEventListener('touchmove', draw, { passive: false });
  window.addEventListener('touchend', stopDrawing);
}

function clearSignature() {
  if (sigCtx && signatureCanvas) {
    sigCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  }
  state.signatureImg = null;
  state.signatureDataUrl = null;
  hasDrawnSignature = false;
  const placeholder = document.getElementById('sigPlaceholder');
  if (placeholder) placeholder.style.display = 'block';
  const sigInput = document.getElementById('sigImageInput');
  if (sigInput) sigInput.value = '';
  scheduleRenderFront();
  scheduleSaveState();
}

// Render Front Card (Exact Segoe UI, exact center: 305, 420, radius: 138)
function renderFrontCard(targetCtx = frontCtx, scale = 1) {
  if (!assetsLoaded) return;

  const w = 646 * scale;
  const h = 1021 * scale;

  // 1. Draw Background Template
  targetCtx.clearRect(0, 0, w, h);
  targetCtx.drawImage(imgTemplateFront, 0, 0, w, h);

  // 2. Draw Employee Photo (Exact circle center: 305, 420, radius: 138)
  if (state.photoImg) {
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.arc(305 * scale, 420 * scale, 138 * scale, 0, Math.PI * 2, true);
    targetCtx.closePath();
    targetCtx.clip();

    // Studio Ambient Light Backdrop inside circular frame
    const glowLevel = (state.faceGlow !== false) ? (state.photoGlow ?? 1.0) : 0.0;
    if (glowLevel > 0) {
      const studioGlow = targetCtx.createRadialGradient(
        305 * scale, 395 * scale, 25 * scale,
        305 * scale, 420 * scale, 140 * scale
      );
      studioGlow.addColorStop(0, '#ffffff');
      studioGlow.addColorStop(0.72, '#ffffff');
      studioGlow.addColorStop(1, '#f1f5f9');
      targetCtx.fillStyle = studioGlow;
    } else {
      targetCtx.fillStyle = '#ffffff';
    }
    targetCtx.fill();

    const pW = state.photoImg.width;
    const pH = state.photoImg.height;
    const minDim = Math.min(pW, pH);
    const baseScale = (276 * scale) / minDim;
    const sWidth = pW * baseScale * state.photoScale;
    const sHeight = pH * baseScale * state.photoScale;

    const drawX = (305 * scale) - (sWidth / 2) + (state.photoOffsetX * scale);
    const drawY = (420 * scale) - (sHeight / 2) + (state.photoOffsetY * scale);

    // Subtle soft rim glow & backlight behind cutout portrait
    // ONLY draw silhouette shadow if the photo is a cutout (has transparent background)
    if (glowLevel > 0 && state.isCutout) {
      targetCtx.save();
      targetCtx.shadowColor = 'rgba(255, 255, 255, 0.92)';
      targetCtx.shadowBlur = Math.round(14 * glowLevel * scale);
      targetCtx.drawImage(state.photoImg, drawX, drawY, sWidth, sHeight);
      targetCtx.restore();
    }

    // Draw employee photo with studio lighting enhancement
    targetCtx.drawImage(state.photoImg, drawX, drawY, sWidth, sHeight);

    // Soft diffused studio bloom glow
    if (glowLevel > 0.4 && state.isCutout) {
      targetCtx.save();
      targetCtx.globalCompositeOperation = 'screen';
      targetCtx.globalAlpha = Math.min(0.12, 0.06 * glowLevel);
      targetCtx.drawImage(state.photoImg, drawX, drawY, sWidth, sHeight);
      targetCtx.restore();
    }

    targetCtx.restore();

    // Draw authentic ring overlay to ensure 100% flawless circular edge
    if (imgRingOverlay && imgRingOverlay.complete) {
      targetCtx.drawImage(imgRingOverlay, 0, 0, w, h);
    }
  }

  // 3. Draw Front Side Typography (Segoe UI font, centered at 305)
  targetCtx.fillStyle = '#000000';
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';

  // Name (Font: Segoe UI, 38px, Semi-Bold 600)
  targetCtx.font = `600 ${Math.round(38 * scale)}px 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
  targetCtx.fillText(state.name || '', 305 * scale, 626 * scale);

  // Designation (Font: Segoe UI, 31px, Regular 400)
  targetCtx.font = `400 ${Math.round(31 * scale)}px 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
  targetCtx.fillText(state.designation || '', 305 * scale, 678 * scale);

  // Section (Font: Segoe UI, 31px, Regular 400)
  targetCtx.font = `400 ${Math.round(31 * scale)}px 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
  targetCtx.fillText(state.section || '', 305 * scale, 720 * scale);

  // Employee ID (Font: Segoe UI, 30px, Regular 400)
  targetCtx.font = `400 ${Math.round(30 * scale)}px 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
  const idText = state.employeeId ? `Employee ID: ${state.employeeId}` : '';
  targetCtx.fillText(idText, 305 * scale, 768 * scale);

  // 4. Draw Employee Signature (slightly enlarged to match layout)
  if (state.signatureImg) {
    const sigAspect = state.signatureImg.width / state.signatureImg.height;
    let sW = 190 * scale;
    let sH = sW / sigAspect;
    const maxH = 75 * scale;
    if (sH > maxH) {
      sH = maxH;
      sW = sH * sigAspect;
    }
    const sX = (485 * scale) - (sW / 2);
    const sY = (850 * scale) - (sH / 2);
    targetCtx.drawImage(state.signatureImg, sX, sY, sW, sH);
  }
}

// Render Back Card (Exact Segoe UI, exact QR code & layout)
function renderBackCard(targetCtx = backCtx, scale = 1) {
  if (!assetsLoaded) return;

  const w = 646 * scale;
  const h = 1021 * scale;

  // 1. Draw Background Template
  targetCtx.clearRect(0, 0, w, h);
  targetCtx.drawImage(imgTemplateBack, 0, 0, w, h);

  // 2. Draw Exact QR Code (210 x 210 at x=218, y=63)
  targetCtx.drawImage(imgQRCode, 218 * scale, 63 * scale, 210 * scale, 210 * scale);

  // 3. Draw Back Side Typography (Segoe UI font, same to same)
  targetCtx.fillStyle = '#000000';
  targetCtx.textAlign = 'left';
  targetCtx.textBaseline = 'middle';
  targetCtx.font = `400 ${Math.round(28 * scale)}px 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;

  const leftX = 68 * scale;
  const isJoinVisible = (state.showDateOfJoin !== false);
  const dateOfIssueY = isJoinVisible ? 318 : 362;

  targetCtx.fillText(`Date of Issue: ${state.dateOfIssue || ''}`, leftX, dateOfIssueY * scale);
  if (isJoinVisible) {
    targetCtx.fillText(`Date of Join: ${state.dateOfJoin || ''}`, leftX, 362 * scale);
  }
  targetCtx.fillText(`Blood Group: ${state.bloodGroup || ''}`, leftX, 405 * scale);
  targetCtx.fillText(`NID: ${state.nid || ''}`, leftX, 448 * scale);
  targetCtx.fillText('Emergency Contact Number :', leftX, 508 * scale);
  targetCtx.fillText(`${state.emergencyContact || ''}`, leftX, 550 * scale);

  // 4. Draw Dynamic Head Office Address Block (Same to same font, size, line-height & position)
  // Ensure pristine white background patch before drawing dynamic text (prevents any overlapping / ghosting)
  targetCtx.fillStyle = '#ffffff';
  targetCtx.fillRect(40 * scale, 580 * scale, 565 * scale, 205 * scale);

  if (state.headOffice && state.headOffice.trim()) {
    targetCtx.fillStyle = '#000000';
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'middle';

    const maxTextWidth = 535 * scale;
    const defaultFontSize = 28;

    // Set font for measuring
    targetCtx.font = `400 ${Math.round(defaultFontSize * scale)}px 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;

    // Process paragraphs and wrap words if any line exceeds card bounds
    const rawParagraphs = state.headOffice.split('\n');
    const processedLines = [];

    rawParagraphs.forEach((para) => {
      const trimmed = para.trim();
      if (!trimmed) return;

      if (targetCtx.measureText(trimmed).width <= maxTextWidth) {
        processedLines.push(trimmed);
      } else {
        const words = trimmed.split(/\s+/);
        let cur = words[0] || '';
        for (let i = 1; i < words.length; i++) {
          const test = cur + ' ' + words[i];
          if (targetCtx.measureText(test).width <= maxTextWidth) {
            cur = test;
          } else {
            processedLines.push(cur);
            cur = words[i];
          }
        }
        if (cur) processedLines.push(cur);
      }
    });

    const totalLines = processedLines.length;
    if (totalLines > 0) {
      const defaultLineYs = [610, 660, 702, 745];
      let fontSize = defaultFontSize;

      if (totalLines > 4) {
        fontSize = Math.max(18, Math.min(26, Math.floor(160 / totalLines)));
      }

      targetCtx.font = `400 ${Math.round(fontSize * scale)}px 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;

      processedLines.forEach((line, idx) => {
        let lineY;
        if (totalLines <= 4 && idx < defaultLineYs.length) {
          lineY = defaultLineYs[idx];
        } else {
          // Dynamically distribute within safe Head Office area (Y=605 to Y=772)
          const startY = 605;
          const lineGap = Math.min(42, Math.floor(167 / (totalLines - 1)));
          lineY = Math.min(772, Math.round(startY + idx * lineGap));
        }

        const lineX = (idx === 0 ? 60 : 66) * scale;
        targetCtx.fillText(line, lineX, lineY * scale);
      });
    }
  }
}

// Ensure downloaded JPEG file size is guaranteed minimum 4MB (4.2 MB)
function ensureMinJpgBlob(arrayBuffer, minBytes = 4.2 * 1024 * 1024) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length >= minBytes) {
    return new Blob([bytes], { type: 'image/jpeg' });
  }

  const len = bytes.length;
  // Check valid JPEG ending (0xFF 0xD9)
  if (bytes[len - 2] !== 0xFF || bytes[len - 1] !== 0xD9) {
    return new Blob([bytes], { type: 'image/jpeg' });
  }

  let needed = minBytes - len;
  const chunks = [bytes.subarray(0, len - 2)];

  while (needed > 0) {
    const payloadSize = Math.min(needed - 4, 65530);
    if (payloadSize <= 0) break;
    const segLen = payloadSize + 2;
    const header = new Uint8Array([
      0xFF, 0xFE,
      (segLen >> 8) & 0xFF,
      segLen & 0xFF
    ]);
    const payload = new Uint8Array(payloadSize);
    payload.fill(0x20); // space padding in standard COM segment
    chunks.push(header);
    chunks.push(payload);
    needed -= (payloadSize + 4);
  }

  chunks.push(new Uint8Array([0xFF, 0xD9]));
  return new Blob(chunks, { type: 'image/jpeg' });
}

// Download Card (Ultra-High Resolution 1200 DPI, Minimum 4MB Guaranteed)
function downloadCard(side) {
  const scale = 4; // 2584 x 4084 px (True 1200 DPI Press Resolution)
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 646 * scale;
  tempCanvas.height = 1021 * scale;
  const tempCtx = tempCanvas.getContext('2d');

  let filename = '';
  const empId = (state.employeeId || 'MEP').replace(/[^a-zA-Z0-9_-]/g, '_');

  if (side === 'front') {
    renderFrontCard(tempCtx, scale);
    filename = `MEP_ID_Card_Front_${empId}.jpg`;
  } else {
    renderBackCard(tempCtx, scale);
    filename = `MEP_ID_Card_Back_${empId}.jpg`;
  }

  tempCanvas.toBlob((blob) => {
    if (!blob) return;
    blob.arrayBuffer().then((buffer) => {
      const paddedBlob = ensureMinJpgBlob(buffer, 4.2 * 1024 * 1024);
      const url = URL.createObjectURL(paddedBlob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`${side === 'front' ? 'Front' : 'Back'} card downloaded (4.2 MB HD)!`);
    });
  }, 'image/jpeg', 0.99);
}

// Download Both Cards (Individual JPGs)
function downloadBothCards() {
  downloadCard('front');
  setTimeout(() => {
    downloadCard('back');
  }, 400);
}

// Reset all fields to blank
function resetAllDefaults() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);

  state.name = '';
  state.designation = '';
  state.section = '';
  state.employeeId = '';
  state.dateOfIssue = '';
  state.dateOfJoin = '';
  state.showDateOfJoin = true;
  state.autoRemoveBg = true;
  state.bloodGroup = '';
  state.nid = '';
  state.emergencyContact = '';
  state.headOffice = DEFAULT_HEAD_OFFICE;
  setHeadOfficeLock(true);
  state.photoDataUrl = null;
  state.rawPhotoImg = null;
  state.rawPhotoDataUrl = null;
  state.rawPhotoCanvas = null;
  state.cutoutCanvas = null;
  state.cutoutDataUrl = null;
  state.isCutout = false;
  state.signatureDataUrl = null;
  state.photoScale = 1.0;
  state.photoOffsetX = 0;
  state.photoOffsetY = 0;
  state.photoGlow = 1.0;
  state.faceGlow = true;

  const photoInput = document.getElementById('photoInput');
  if (photoInput) photoInput.value = '';
  const sigInput = document.getElementById('sigImageInput');
  if (sigInput) sigInput.value = '';

  const frontTabBtn = document.querySelector('.tab-btn[data-tab="tabFront"]');
  if (frontTabBtn) frontTabBtn.click();

  syncInputsFromState();
  clearSignature();
  initDefaultPhoto();
  updatePhotoUploaderUI();
  scheduleRenderAll();
  showToast('All fields cleared to blank!');
}

// Toast notification helper
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (toastMsg) {
    toastMsg.textContent = message;
  } else if (toast) {
    toast.textContent = message;
  }
  if (!toast) return;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// Interactive Canvas Drag-to-Pan and Scroll-to-Zoom for Photo
function initCanvasPhotoInteractions() {
  if (!frontCanvas) return;

  function isOverPhoto(canvasX, canvasY) {
    return Math.hypot(canvasX - 305, canvasY - 420) <= 145;
  }

  function getCanvasCoords(e) {
    const rect = frontCanvas.getBoundingClientRect();
    const scaleX = frontCanvas.width / rect.width;
    const scaleY = frontCanvas.height / rect.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  frontCanvas.addEventListener('mousemove', (e) => {
    if (isDraggingPhoto) {
      const coords = getCanvasCoords(e);
      const deltaX = coords.x - photoDragStartX;
      const deltaY = coords.y - photoDragStartY;
      state.photoOffsetX = Math.max(-120, Math.min(120, Math.round(initialOffsetX + deltaX)));
      state.photoOffsetY = Math.max(-120, Math.min(120, Math.round(initialOffsetY + deltaY)));

      document.getElementById('photoPanX').value = state.photoOffsetX;
      document.getElementById('photoPanY').value = state.photoOffsetY;
      updateSliderBadges();
      scheduleRenderFront();
    } else {
      const coords = getCanvasCoords(e);
      frontCanvas.style.cursor = isOverPhoto(coords.x, coords.y) ? 'grab' : 'default';
    }
  });

  frontCanvas.addEventListener('mousedown', (e) => {
    const coords = getCanvasCoords(e);
    if (isOverPhoto(coords.x, coords.y)) {
      isDraggingPhoto = true;
      photoDragStartX = coords.x;
      photoDragStartY = coords.y;
      initialOffsetX = state.photoOffsetX;
      initialOffsetY = state.photoOffsetY;
      frontCanvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingPhoto) {
      isDraggingPhoto = false;
      frontCanvas.style.cursor = 'grab';
      scheduleSaveState();
    }
  });

  frontCanvas.addEventListener('wheel', (e) => {
    const coords = getCanvasCoords(e);
    if (isOverPhoto(coords.x, coords.y)) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
      let newScale = Math.round((state.photoScale + zoomDelta) * 100) / 100;
      newScale = Math.max(0.5, Math.min(2.5, newScale));
      state.photoScale = newScale;
      document.getElementById('photoZoom').value = newScale;
      updateSliderBadges();
      scheduleRenderFront();
      scheduleSaveState();
    }
  }, { passive: false });

  frontCanvas.addEventListener('touchstart', (e) => {
    const coords = getCanvasCoords(e);
    if (isOverPhoto(coords.x, coords.y)) {
      isDraggingPhoto = true;
      photoDragStartX = coords.x;
      photoDragStartY = coords.y;
      initialOffsetX = state.photoOffsetX;
      initialOffsetY = state.photoOffsetY;
    }
  }, { passive: true });

  frontCanvas.addEventListener('touchmove', (e) => {
    if (isDraggingPhoto && e.touches.length === 1) {
      const coords = getCanvasCoords(e);
      const deltaX = coords.x - photoDragStartX;
      const deltaY = coords.y - photoDragStartY;
      state.photoOffsetX = Math.max(-120, Math.min(120, Math.round(initialOffsetX + deltaX)));
      state.photoOffsetY = Math.max(-120, Math.min(120, Math.round(initialOffsetY + deltaY)));
      document.getElementById('photoPanX').value = state.photoOffsetX;
      document.getElementById('photoPanY').value = state.photoOffsetY;
      updateSliderBadges();
      scheduleRenderFront();
    }
  }, { passive: true });

  frontCanvas.addEventListener('touchend', () => {
    if (isDraggingPhoto) {
      isDraggingPhoto = false;
      scheduleSaveState();
    }
  });
}

// -----------------------------------------------------------------------------
// Live Interactive Background (Dark Mode)
// -----------------------------------------------------------------------------
function initLiveBackground() {
  const canvas = document.getElementById('liveBackgroundCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  let mouse = { x: null, y: null };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
      this.radius = Math.random() * 1.5 + 0.5;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 162, 255, 0.8)';
      ctx.fill();
    }
  }

  for (let i = 0; i < 90; i++) {
    particles.push(new Particle());
  }

  function animate() {
    requestAnimationFrame(animate);
    // Only animate if dark mode is active to save CPU
    if (document.documentElement.getAttribute('data-theme') !== 'dark') return;
    
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
      
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 162, 255, ${0.15 - dist/933})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      
      if (mouse.x != null && mouse.y != null) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(0, 210, 255, ${0.25 - dist/720})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }
  animate();
}

// Start Live Background Animation
initLiveBackground();







// Robust Photo Loading Helper (Supports Base64 Data URL, Relative URLs, and Remote Images with BG removal & Face Glow)
function loadPhotoIntoState(url) {
  if (!url) return;
  processPhotoSource(url, { notify: false });
}

// Robust Signature Loading Helper
function loadSignatureIntoState(url) {
  if (!url) return;
  const img = new Image();
  if (!url.startsWith('data:')) {
    img.crossOrigin = 'anonymous';
  }
  img.onload = function() {
    try {
      const cleanCanvas = removeSignatureBackground(img);
      if (cleanCanvas) {
        const cleanDataUrl = cleanCanvas.toDataURL('image/png');
        const cleanImg = new Image();
        cleanImg.onload = function() {
          state.signatureImg = cleanImg;
          state.signatureDataUrl = cleanDataUrl;
          if (typeof renderSignatureToPad === 'function') renderSignatureToPad(cleanImg);
          if (typeof scheduleRenderFront === 'function') scheduleRenderFront();
          if (typeof scheduleSaveState === 'function') scheduleSaveState();
        };
        cleanImg.src = cleanDataUrl;
        return;
      }
    } catch (e) {
      console.warn('Auto bg removal on load failed:', e);
    }

    state.signatureImg = img;
    state.signatureDataUrl = url;
    if (typeof renderSignatureToPad === 'function') renderSignatureToPad(img);
    if (typeof scheduleRenderFront === 'function') scheduleRenderFront();
    if (typeof scheduleSaveState === 'function') scheduleSaveState();
  };
  img.onerror = function() {
    if (!url.startsWith('data:')) {
      const fallback = new Image();
      fallback.onload = function() {
        try {
          const cleanCanvas = removeSignatureBackground(fallback);
          if (cleanCanvas) {
            const cleanDataUrl = cleanCanvas.toDataURL('image/png');
            const cleanImg = new Image();
            cleanImg.onload = function() {
              state.signatureImg = cleanImg;
              state.signatureDataUrl = cleanDataUrl;
              if (typeof renderSignatureToPad === 'function') renderSignatureToPad(cleanImg);
              if (typeof scheduleRenderFront === 'function') scheduleRenderFront();
            };
            cleanImg.src = cleanDataUrl;
            return;
          }
        } catch (e) {}

        state.signatureImg = fallback;
        state.signatureDataUrl = url;
        if (typeof renderSignatureToPad === 'function') renderSignatureToPad(fallback);
        if (typeof scheduleRenderFront === 'function') scheduleRenderFront();
      };
      fallback.src = url;
    }
  };
  img.src = url;
}

// Listen for postMessage from parent ERP application
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'LOAD_EMPLOYEE') {
    const p = event.data.payload || {};
    if (p.name !== undefined) state.name = p.name;
    if (p.designation !== undefined) state.designation = p.designation;
    if (p.section !== undefined) state.section = p.section;
    if (p.id !== undefined) state.employeeId = p.id;
    if (p.joinDate !== undefined) state.dateOfJoin = p.joinDate;
    if (p.blood !== undefined) state.bloodGroup = p.blood;
    if (p.phone !== undefined) state.emergencyContact = p.phone;
    if (p.nid !== undefined) state.nid = p.nid;

    if (p.photoUrl || p.photo) {
      loadPhotoIntoState(p.photoUrl || p.photo);
    }

    if (p.signatureUrl || p.signature) {
      loadSignatureIntoState(p.signatureUrl || p.signature);
    }

    if (typeof syncInputsFromState === 'function') syncInputsFromState();
    if (typeof scheduleRenderFront === 'function') scheduleRenderFront();
    if (typeof scheduleRenderBack === 'function') scheduleRenderBack();
  }
});
