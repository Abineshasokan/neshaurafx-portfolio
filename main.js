/* 
  NESHAURAFX V5.0 - Core Engine JavaScript
  Author: Abinesh Asokan / NESHAURAFX
  Orchestrating Three.js, GSAP ScrollTrigger, Lenis, and Custom Interactions
*/

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initLenis();
  initThree();
  initCustomCursor();
  initMagneticButtons();
  initCardTilt();
  initShowreelPlayer();
  initScrollAnimations();
  initContactForm();
});

/* =========================================================================
   1. PRELOADER ENGINE
   ========================================================================= */
function initPreloader() {
  const preloader = document.getElementById('js-preloader');
  const terminal = document.getElementById('js-preloader-terminal');
  const bar = document.getElementById('js-preloader-bar');
  const percentageText = document.getElementById('js-preloader-percentage');
  
  if (!preloader || !terminal || !bar || !percentageText) return;

  const logs = [
    'INITIALIZING CREATIVE ENGINE...',
    'LOADING VISUAL SYSTEMS...',
    'ANALYZING CONTENT...',
    'NESHAURAFX ONLINE'
  ];

  let currentLogIdx = 0;
  let progress = 0;

  // Add initial log line
  appendLog(logs[0]);

  // Animate progress percentage and progress bar
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 4) + 1;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      // Print the final system online log
      appendLog(logs[3], true);
      
      // End loading sequence after a brief pause
      setTimeout(() => {
        preloader.classList.add('fade-out');
        document.body.classList.remove('loading');
        
        // Trigger initial page entry animations
        triggerEntryAnimations();
      }, 500);
    }

    // Update progress bar width and label
    bar.style.width = `${progress}%`;
    percentageText.textContent = `${progress}%`;

    // Print logs at progressive thresholds
    if (progress > 30 && currentLogIdx === 0) {
      currentLogIdx = 1;
      appendLog(logs[1]);
    } else if (progress > 70 && currentLogIdx === 1) {
      currentLogIdx = 2;
      appendLog(logs[2]);
    }
  }, 35); // Reaches 100% in ~2 to 2.5 seconds (under the 3s constraint)

  function appendLog(text, highlight = false) {
    const p = document.createElement('p');
    p.className = `preloader-log ${highlight ? 'highlight' : ''}`;
    p.textContent = `> ${text}`;
    terminal.appendChild(p);
    
    // Auto scroll terminal to bottom
    terminal.scrollTop = terminal.scrollHeight;
  }
}

// Fade in hero elements after loading completes
function triggerEntryAnimations() {
  gsap.from('.hero-content h1', {
    y: 50,
    opacity: 0,
    duration: 1.2,
    ease: 'power4.out'
  });
  
  gsap.from('.hero-desc', {
    y: 30,
    opacity: 0,
    duration: 1.2,
    delay: 0.2,
    ease: 'power4.out'
  });
  
  gsap.from('.hero-content .button-group', {
    y: 20,
    opacity: 0,
    duration: 1.2,
    delay: 0.4,
    ease: 'power4.out'
  });

  gsap.from('.hero-trust-indicators .trust-indicator', {
    y: 20,
    opacity: 0,
    stagger: 0.1,
    duration: 1,
    delay: 0.6,
    ease: 'power3.out'
  });
  
  gsap.from('header', {
    y: -50,
    opacity: 0,
    duration: 1.2,
    delay: 0.8,
    ease: 'power4.out'
  });
}

/* =========================================================================
   2. LENIS SMOOTH SCROLL
   ========================================================================= */
let lenisInstance = null;

function initLenis() {
  if (typeof Lenis === 'undefined') return;

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
  });

  function raf(time) {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Sync scroll position updates with GSAP ScrollTrigger
  lenisInstance.on('scroll', ScrollTrigger.update);
  
  gsap.ticker.add((time) => {
    lenisInstance.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Smooth scroll links hook
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        lenisInstance.scrollTo(targetEl, {
          offset: -80,
          duration: 1.5,
          immediate: false
        });
      }
    });
  });
}

/* =========================================================================
   3. THREE.JS 3D ENVIRONMENT
   ========================================================================= */
let scene, camera, renderer, mainGeometry, pointLight, particles;
let targetX = 0, targetY = 0;
let currentX = 0, currentY = 0;

function initThree() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // 1. Setup Scene, Camera, Renderer
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7;

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 2. Setup Glass Film Reel Geometry (Group)
  mainGeometry = new THREE.Group();

  // Custom Physically-Based Glass Material for Flanges
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x4f7cff,
    emissive: 0x050510,
    roughness: 0.1,
    metalness: 0.05,
    transmission: 0.90,  // Glass transparency
    ior: 1.55,           // Index of refraction
    thickness: 1.5,
    specularIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.9,
    depthWrite: true,
  });

  // Helper to create vintage film reel flange geometry with 5 circular cutouts
  const createFlangeGeometry = () => {
    const shape = new THREE.Shape();
    // Outer boundary (counter-clockwise)
    shape.absarc(0, 0, 1.5, 0, Math.PI * 2, false);
    
    // Central spindle hole (clockwise)
    const centerHole = new THREE.Path();
    centerHole.absarc(0, 0, 0.2, 0, Math.PI * 2, true);
    shape.holes.push(centerHole);
    
    // 5 circular cutouts (clockwise)
    const numHoles = 5;
    const holeRadius = 0.32;
    const distance = 0.85;
    for (let i = 0; i < numHoles; i++) {
      const angle = (i * Math.PI * 2) / numHoles;
      const hole = new THREE.Path();
      hole.absarc(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        holeRadius,
        0,
        Math.PI * 2,
        true
      );
      shape.holes.push(hole);
    }

    const extrudeSettings = {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.01,
      bevelThickness: 0.01,
      curveSegments: 32
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center(); // Center around origin for balanced rotation
    return geo;
  };

  const flangeGeo = createFlangeGeometry();

  // Create front and back flanges
  const frontFlange = new THREE.Mesh(flangeGeo, glassMaterial);
  frontFlange.position.z = 0.22;
  const backFlange = new THREE.Mesh(flangeGeo, glassMaterial);
  backFlange.position.z = -0.22;

  // Purple film roll core
  const coreGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.44, 32);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x8b5cf6,
    emissive: 0x090212,
    roughness: 0.25,
    metalness: 0.3,
    transmission: 0.4,
    transparent: true,
    opacity: 0.85,
    depthWrite: true
  });
  const filmCore = new THREE.Mesh(coreGeo, coreMat);
  filmCore.rotation.x = Math.PI / 2; // Rotate to align with Z-axis

  // Neon cyan spindle shaft
  const spindleGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.58, 32);
  const spindleMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x006677,
    roughness: 0.2,
    metalness: 0.8
  });
  const spindle = new THREE.Mesh(spindleGeo, spindleMat);
  spindle.rotation.x = Math.PI / 2; // Rotate to align with Z-axis

  // Add subtle holographic wireframe outlines matching the flange cutouts
  const wireframeMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    wireframe: true,
    transparent: true,
    opacity: 0.05
  });
  const frontWire = new THREE.Mesh(flangeGeo, wireframeMat);
  frontWire.position.z = 0.22;
  const backWire = new THREE.Mesh(flangeGeo, wireframeMat);
  backWire.position.z = -0.22;

  // Assemble components into the main group
  mainGeometry.add(frontFlange);
  mainGeometry.add(backFlange);
  mainGeometry.add(filmCore);
  mainGeometry.add(spindle);
  mainGeometry.add(frontWire);
  mainGeometry.add(backWire);

  scene.add(mainGeometry);

  // 3. Setup Floating Particles
  const particlesCount = 350;
  const positions = new Float32Array(particlesCount * 3);
  const colors = new Float32Array(particlesCount * 3);

  const primaryColor = new THREE.Color('#4f7cff');
  const secondaryColor = new THREE.Color('#8b5cf6');
  const accentColor = new THREE.Color('#00e5ff');

  for (let i = 0; i < particlesCount * 3; i += 3) {
    // Spawn positions in a surrounding box
    positions[i] = (Math.random() - 0.5) * 15;
    positions[i+1] = (Math.random() - 0.5) * 15;
    positions[i+2] = (Math.random() - 0.5) * 10;

    // Distribute particle colors from brand palette
    const rand = Math.random();
    let col = primaryColor;
    if (rand > 0.6) col = secondaryColor;
    else if (rand > 0.8) col = accentColor;

    colors[i] = col.r;
    colors[i+1] = col.g;
    colors[i+2] = col.b;
  }

  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Custom round particle texture
  const particleMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particles = new THREE.Points(particlesGeo, particleMat);
  scene.add(particles);

  // 4. Setup Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  // Point light that follows cursor
  pointLight = new THREE.PointLight(0x00e5ff, 3.5, 12);
  pointLight.position.set(0, 0, 2);
  scene.add(pointLight);

  // 5. Coordinates Mouse Parallax setup
  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  });

  // 6. Animation Render Loop
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Rotate main 3D Geometry
    if (mainGeometry) {
      mainGeometry.rotation.z = elapsedTime * 0.4;  // Spin reel
      mainGeometry.rotation.y = elapsedTime * 0.15; // Slow 3D tilt
      mainGeometry.rotation.x = elapsedTime * 0.08; // Slow 3D tilt
    }

    // Slowly move particles
    if (particles) {
      particles.rotation.y = elapsedTime * -0.03;
      particles.rotation.x = elapsedTime * -0.01;
    }

    // Smooth camera mouse parallax (lerping)
    currentX += (targetX - currentX) * 0.07;
    currentY += (targetY - currentY) * 0.07;

    camera.position.x += (currentX * 1.5 - camera.position.x) * 0.05;
    camera.position.y += (-currentY * 1.5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // Update point light position to track target cursor coordinates
    pointLight.position.x = currentX * 5;
    pointLight.position.y = -currentY * 5;

    renderer.render(scene, camera);
  }

  animate();

  // 7. Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // 8. Bind Scroll Pos to 3D Camera / Object Properties
  setupScrollWebGLBinding();
}

function setupScrollWebGLBinding() {
  if (typeof ScrollTrigger === 'undefined' || !mainGeometry) return;

  // Zoom mesh and camera outward/inward based on scrolling progress
  gsap.to(mainGeometry.position, {
    x: 2.2,
    y: -0.5,
    z: -1,
    scrollTrigger: {
      trigger: '#showreel',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });

  gsap.to(mainGeometry.position, {
    x: -2.0,
    y: 0.2,
    z: -2,
    scrollTrigger: {
      trigger: '#work',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });

  gsap.to(mainGeometry.position, {
    x: 0,
    y: -0.2,
    z: 0.5,
    scrollTrigger: {
      trigger: '#contact',
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: 1
    }
  });
}

/* =========================================================================
   4. CUSTOM MAGNETIC CURSOR
   ========================================================================= */
function initCustomCursor() {
  const cursor = document.getElementById('js-cursor');
  const follower = document.getElementById('js-cursor-follower');
  if (!cursor || !follower) return;

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Set immediate position for core dot
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
  });

  // Smooth lag for outer circle follower using frame loops
  function updateFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    
    follower.style.left = `${followerX}px`;
    follower.style.top = `${followerY}px`;
    
    requestAnimationFrame(updateFollower);
  }
  updateFollower();

  // Hover states binding
  const hoverables = document.querySelectorAll('a, button, .js-tilt, #js-play-trigger, .nav-toggle');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hovered');
      follower.classList.add('hovered');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hovered');
      follower.classList.remove('hovered');
    });
  });

  // Specific custom cursor state for Video Project Cards
  const videoCards = document.querySelectorAll('.work-card, .player-wrapper');
  videoCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      follower.classList.add('video-hover');
    });
    card.addEventListener('mouseleave', () => {
      follower.classList.remove('video-hover');
    });
  });
}

/* =========================================================================
   5. MAGNETIC BUTTONS EFFECT
   ========================================================================= */
function initMagneticButtons() {
  const magneticEls = document.querySelectorAll('.js-magnetic');
  if (magneticEls.length === 0) return;

  magneticEls.forEach(btn => {
    btn.addEventListener('mousemove', function(e) {
      const bound = this.getBoundingClientRect();
      // Calculate mouse coordinates relative to button center
      const btnX = bound.left + bound.width / 2;
      const btnY = bound.top + bound.height / 2;
      
      const mouseRelX = e.clientX - btnX;
      const mouseRelY = e.clientY - btnY;

      // Translate button towards mouse coordinate (magnetic pull)
      gsap.to(this, {
        x: mouseRelX * 0.35,
        y: mouseRelY * 0.35,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    btn.addEventListener('mouseleave', function() {
      // Reset position smoothly
      gsap.to(this, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)'
      });
    });
  });
}

/* =========================================================================
   6. 3D INTERACTIVE CARD TILT (PARALLAX)
   ========================================================================= */
function initCardTilt() {
  const tiltCards = document.querySelectorAll('.js-tilt');
  if (tiltCards.length === 0) return;

  tiltCards.forEach(card => {
    const cardInner = card.querySelector('.work-card-inner, .testimonial-card');
    if (!cardInner) return;

    card.addEventListener('mousemove', (e) => {
      const bound = card.getBoundingClientRect();
      const width = bound.width;
      const height = bound.height;
      
      // Relative mouse offset on card (scale to -0.5 to 0.5 range)
      const mouseX = (e.clientX - bound.left) / width - 0.5;
      const mouseY = (e.clientY - bound.top) / height - 0.5;
      
      // Calculate rotation angles (max 10 degrees)
      const rotateX = -mouseY * 10;
      const rotateY = mouseX * 10;

      // Transform inner container to achieve 3D tilt effect
      gsap.to(cardInner, {
        rotateX: rotateX,
        rotateY: rotateY,
        scale: 1.02,
        duration: 0.4,
        ease: 'power2.out'
      });

      // Add a subtle dynamic glow/shadow tracking direction of mouse
      card.style.boxShadow = `
        ${-rotateY * 2}px ${rotateX * 2}px 30px rgba(0, 0, 0, 0.6),
        inset 0 1px 0 rgba(255, 255, 255, 0.15)
      `;
    });

    card.addEventListener('mouseleave', () => {
      // Reset card inner positions
      gsap.to(cardInner, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power2.out'
      });
      
      card.style.boxShadow = '';
    });
  });
}

/* =========================================================================
   7. SHOWREEL VIDEO PLAYER & TIMELINE SYNC
   ========================================================================= */
function initShowreelPlayer() {
  const playerWrapper = document.getElementById('js-player-wrapper');
  const video = document.getElementById('js-showreel-video');
  const overlay = document.getElementById('js-player-overlay');
  const playTrigger = document.getElementById('js-play-trigger');
  
  const miniPlayBtn = document.getElementById('js-mini-play-btn');
  const playIconPath = document.getElementById('js-play-icon-path');
  const volumeBtn = document.getElementById('js-volume-btn');
  const volumeIconPath = document.getElementById('js-volume-icon-path');
  const timelineProgress = document.getElementById('js-timeline-progress');
  const timelineContainer = document.getElementById('js-timeline-container');
  
  const steps = document.querySelectorAll('.timeline-step');
  
  if (!video || !playTrigger || !overlay) return;

  // SVG configurations for play/pause toggle
  const playPath = "M8 5v14l11-7z";
  const pausePath = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";

  // SVG configurations for volume toggle
  const mutePath = "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.03c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z";
  const loudPath = "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z";

  // Play/Pause execution
  function togglePlay() {
    if (video.paused) {
      video.play();
      overlay.classList.add('playing');
      if (playIconPath) playIconPath.setAttribute('d', pausePath);
    } else {
      video.pause();
      overlay.classList.remove('playing');
      if (playIconPath) playIconPath.setAttribute('d', playPath);
    }
  }

  playTrigger.addEventListener('click', togglePlay);
  if (miniPlayBtn) miniPlayBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);

  // Volume execution
  if (volumeBtn && volumeIconPath) {
    volumeBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      if (video.muted) {
        volumeIconPath.setAttribute('d', mutePath);
      } else {
        volumeIconPath.setAttribute('d', loudPath);
      }
    });
  }

  // Update slider progress and sync sequence sidebar steps
  video.addEventListener('timeupdate', () => {
    const progressPercent = (video.currentTime / video.duration) * 100;
    if (timelineProgress) timelineProgress.style.width = `${progressPercent}%`;

    // Timeline sync checking (Showreel sequence runs for 35s total)
    const currentVal = video.currentTime;
    steps.forEach((step, idx) => {
      const stepStartTime = parseInt(step.getAttribute('data-time'), 10);
      const nextStep = steps[idx + 1];
      const stepEndTime = nextStep ? parseInt(nextStep.getAttribute('data-time'), 10) : video.duration;

      if (currentVal >= stepStartTime && currentVal < stepEndTime) {
        steps.forEach(s => s.classList.remove('active'));
        step.classList.add('active');
      }
    });
  });

  // Clicking sidebar timeline steps jumps video to specific section segment
  steps.forEach(step => {
    step.addEventListener('click', () => {
      const targetTime = parseInt(step.getAttribute('data-time'), 10);
      video.currentTime = targetTime;
      if (video.paused) {
        video.play();
        overlay.classList.add('playing');
        if (playIconPath) playIconPath.setAttribute('d', pausePath);
      }
    });
  });

  // Timeline slider bar clicking
  if (timelineContainer) {
    timelineContainer.addEventListener('click', (e) => {
      const rect = timelineContainer.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      video.currentTime = clickPosition * video.duration;
    });
  }



  // Project cards video hover preview controls (Section 5)
  initProjectVideoHoverPreviews();
}

function initProjectVideoHoverPreviews() {
  const cards = document.querySelectorAll('.work-card');
  cards.forEach(card => {
    const video = card.querySelector('.work-video');
    if (!video) return;

    card.addEventListener('mouseenter', () => {
      video.play().catch(err => {
        // Handle autoplay block constraints gracefully
        console.warn("Video hover play blocked", err);
      });
    });

    card.addEventListener('mouseleave', () => {
      video.pause();
      // Reset to beginning
      video.currentTime = 0;
    });
  });
}

/* =========================================================================
   8. GSAP SCROLL-DRIVEN REVEALS & TIMELINE PROGRESS
   ========================================================================= */
function initScrollAnimations() {
  if (typeof ScrollTrigger === 'undefined') return;

  // Header active link update on scroll
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let currentSectionId = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      
      if (scrollPos >= top && scrollPos < top + height) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });

    // Shrink header on scroll
    const header = document.getElementById('js-header');
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Scroll progress bar update
    const scrollProgress = document.getElementById('js-scroll-progress');
    if (scrollProgress) {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const percent = (window.scrollY / totalScroll) * 100;
      scrollProgress.style.width = `${percent}%`;
    }
  });

  // Client Process Step Line Fill Animation (Section 7)
  const processTimeline = document.querySelector('.process-layout');
  const fillLine = document.getElementById('js-process-progress');
  const processSteps = document.querySelectorAll('.js-process-step');
  
  if (processTimeline && fillLine) {
    gsap.to(fillLine, {
      height: '100%',
      scrollTrigger: {
        trigger: processTimeline,
        start: 'top 40%',
        end: 'bottom 50%',
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          // Step activation thresholds
          processSteps.forEach((step, idx) => {
            const stepThreshold = idx / (processSteps.length - 1);
            if (progress >= stepThreshold) {
              step.classList.add('active');
            } else {
              step.classList.remove('active');
            }
          });
        }
      }
    });
  }

  // Section heading splits/fade animations
  const revealElements = document.querySelectorAll('.section-title, .section-desc, .why-card, .work-card, .service-card, .testimonial-card, .about-content');
  revealElements.forEach(el => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1.0,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // Mobile menu toggle logic
  const toggle = document.getElementById('js-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (toggle && navMenu) {
    toggle.addEventListener('click', () => {
      navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
      navMenu.style.flexDirection = 'column';
      navMenu.style.position = 'absolute';
      navMenu.style.top = '100%';
      navMenu.style.left = '0';
      navMenu.style.width = '100%';
      navMenu.style.backgroundColor = 'rgba(5, 5, 5, 0.98)';
      navMenu.style.padding = '30px';
      navMenu.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
    });
  }
}

/* =========================================================================
   9. INTERACTIVE CONTACT FORM & FALLBACK SUBMISSION
   ========================================================================= */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const service = document.getElementById('form-service').value;
    const message = document.getElementById('form-message').value;
    const accessKeyInput = form.querySelector('input[name="access_key"]');
    
    // Check if user has replaced the access key placeholder with a valid Web3Forms key
    if (accessKeyInput && accessKeyInput.value !== 'YOUR_ACCESS_KEY_HERE' && accessKeyInput.value.trim() !== '') {
      // Execute silent AJAX email submit to backend Web3Forms API
      const formData = new FormData(form);
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '⚡ Sending Message...';
      submitBtn.disabled = true;
      
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showNotification('Success!', 'Your project inquiry has been sent to Abinesh.', 'success');
          form.reset();
        } else {
          showNotification('Submission Failed', 'Form submit error. Opening mail client instead...', 'error');
          triggerMailtoFallback(name, email, service, message);
        }
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        showNotification('Connection Issue', 'Network error. Opening mail client instead...', 'error');
        triggerMailtoFallback(name, email, service, message);
      })
      .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
    } else {
      // Fallback: Copy email to clipboard and trigger mailto with formatted values
      triggerMailtoFallback(name, email, service, message);
    }
  });

  function triggerMailtoFallback(name, email, service, message) {
    const targetEmail = 'abineshabinesh46406@gmail.com';
    
    // 1. Copy email address to clipboard
    navigator.clipboard.writeText(targetEmail).then(() => {
      console.log('Email copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy email:', err);
    });
    
    // 2. Format mailto link properties
    const subject = encodeURIComponent(`Project Inquiry: ${service} from ${name}`);
    const body = encodeURIComponent(
      `Hello Abinesh,\n\nI filled out your portfolio contact form. Here are my project details:\n\n` +
      `- Name: ${name}\n` +
      `- Email: ${email}\n` +
      `- Project Type: ${service}\n` +
      `- Details: ${message}\n\n` +
      `Let's discuss further!`
    );
    
    const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    
    // 3. Show dynamic UI toast
    showNotification(
      'Opening Email App', 
      `Copied email: ${targetEmail}. Directing you to your email client...`, 
      'info'
    );
    
    // 4. Redirect window
    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 1000);
  }
}

function showNotification(title, message, type = 'info') {
  // Setup or select floating container
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '30px';
    container.style.right = '30px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
  }

  // Create toast element with glass styling
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.pointerEvents = 'auto';
  toast.style.background = 'rgba(14, 14, 14, 0.95)';
  toast.style.backdropFilter = 'blur(10px)';
  toast.style.border = '1px solid rgba(255, 255, 255, 0.08)';
  
  // Set left border color indicator based on toast type
  if (type === 'success') {
    toast.style.borderLeft = '4px solid #22c55e';
  } else if (type === 'error') {
    toast.style.borderLeft = '4px solid #ef4444';
  } else {
    toast.style.borderLeft = '4px solid #4f7cff';
  }
  
  toast.style.borderRadius = '4px';
  toast.style.padding = '15px 20px';
  toast.style.minWidth = '300px';
  toast.style.maxWidth = '400px';
  toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  toast.style.color = '#ffffff';
  toast.style.transform = 'translateX(100px)';
  toast.style.opacity = '0';
  toast.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';

  toast.innerHTML = `
    <div style="font-family: var(--font-headings); font-weight: 700; font-size: 13px; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
      <span style="color: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#4f7cff'};">
        ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </span>
      ${title}
    </div>
    <div style="font-family: var(--font-body); font-size: 12px; color: var(--color-text-muted); line-height: 1.4;">
      ${message}
    </div>
  `;

  container.appendChild(toast);

  // Trigger smooth entry transitions
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  // Remove toast dynamically after duration
  setTimeout(() => {
    toast.style.transform = 'translateX(100px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 4000);
}
