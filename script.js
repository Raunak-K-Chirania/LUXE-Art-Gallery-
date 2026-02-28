/* ============================================
   LUXE ART GALLERY — INTERACTIVE SCRIPTS
   ============================================ */
import { auth, db, storage } from './firebase-config.js';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {

    // ========== PRELOADER ==========
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => preloader.remove(), 600);
        }, 800);
    });
    // Fallback: hide preloader after 3s in case load event already fired
    setTimeout(() => {
        if (preloader) {
            preloader.classList.add('hidden');
        }
    }, 3000);

    // ========== THEME TOGGLE ==========
    const themeToggle = document.getElementById('themeToggle');

    // Check local storage or default to light theme
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }

    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');

        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // ========== INIT AOS ==========
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 60,
        disable: window.innerWidth < 768 ? 'phone' : false
    });

    // ========== NAVBAR SCROLL EFFECT ==========
    const navbar = document.getElementById('mainNav');
    const backToTopBtn = document.getElementById('backToTop');
    let isScrolling = false;

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const scrollY = window.pageYOffset;

                // Navbar styling
                if (scrollY > 80) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }

                // Back to top button
                if (scrollY > 600) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }

                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    // Back to top click
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ========== ACTIVE NAV ON SCROLL (IntersectionObserver) ==========
    const sections = document.querySelectorAll('section[id]');

    if (sections.length > 0) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    const link = document.querySelector(`.nav-link[href="#${id}"]`);

                    if (link) {
                        document.querySelectorAll('.nav-link').forEach(l => {
                            l.classList.remove('active');
                            l.removeAttribute('aria-current');
                        });
                        link.classList.add('active');
                        link.setAttribute('aria-current', 'page');
                    }
                }
            });
        }, { rootMargin: '-20% 0px -80% 0px' });

        sections.forEach(section => {
            navObserver.observe(section);
        });
    }

    // ========== SMOOTH SCROLL FOR NAV LINKS ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const navbarHeight = navbar.offsetHeight;
                const targetPos = target.offsetTop - navbarHeight;
                window.scrollTo({ top: targetPos, behavior: 'smooth' });

                // Close mobile menu
                const navCollapse = document.getElementById('navMenu');
                if (navCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                    if (bsCollapse) bsCollapse.hide();
                }
            }
        });
    });

    // ========== HERO PARTICLES ==========
    const particlesContainer = document.getElementById('heroParticles');
    if (particlesContainer) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('hero-particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (5 + Math.random() * 5) + 's';
            particle.style.width = (2 + Math.random() * 3) + 'px';
            particle.style.height = particle.style.width;
            particlesContainer.appendChild(particle);
        }
    }

    // ========== COUNTER ANIMATION ==========
    const counters = document.querySelectorAll('.stat-number[data-count]');
    let countersAnimated = false;

    function animateCounters() {
        if (countersAnimated) return;
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            updateCounter();
        });
        countersAnimated = true;
    }

    // Trigger counter when hero stats are in view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) statsObserver.observe(statsSection);

    // ========== GALLERY FILTER ==========
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            const currentGalleryItems = document.querySelectorAll('.gallery-item');

            currentGalleryItems.forEach((item, index) => {
                const category = item.getAttribute('data-category');

                if (filter === 'all' || category === filter) {
                    item.classList.remove('hide');
                    item.classList.add('show');
                    item.style.animationDelay = (index * 0.08) + 's';
                } else {
                    item.classList.add('hide');
                    item.classList.remove('show');
                }
            });

            // Reset scroll position on filter
            if (galleryGrid) {
                galleryGrid.scrollTo({ left: 0, behavior: 'smooth' });
            }
        });
    });

    // ========== HORIZONTAL SCROLL NAV ==========
    const galleryPrevBtn = document.getElementById('galleryPrevBtn');
    const galleryNextBtn = document.getElementById('galleryNextBtn');
    const galleryGrid = document.getElementById('galleryGrid');

    if (galleryGrid) {
        // Calculate scroll amount based on item width + gap
        const getScrollAmount = () => {
            const item = document.querySelector('.gallery-item.show');
            if (item) {
                return item.offsetWidth + 24; // Width + gap
            }
            return 300; // Fallback
        };

        if (galleryPrevBtn) {
            galleryPrevBtn.addEventListener('click', () => {
                galleryGrid.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            });
        }

        if (galleryNextBtn) {
            galleryNextBtn.addEventListener('click', () => {
                galleryGrid.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            });
        }
    }

    // ========== USER AUTHENTICATION ==========
    const authBtn = document.getElementById('authBtn');
    const authBtnText = document.getElementById('authBtnText');
    const authModalEl = document.getElementById('authModal');
    let authModal;
    if (authModalEl) {
        authModal = new bootstrap.Modal(authModalEl);
    }

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const uploadBtnContainer = document.getElementById('uploadBtnContainer');
    const loginPromptContainer = document.getElementById('loginPromptContainer');

    let currentUser = null;

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            authBtnText.textContent = 'Sign Out';
            authBtn.classList.replace('btn-gold', 'btn-outline-gold');
            authBtn.removeAttribute('data-bs-toggle');
            authBtn.removeAttribute('data-bs-target');

            // Show upload button, hide prompt
            if (uploadBtnContainer) uploadBtnContainer.style.display = 'block';
            if (loginPromptContainer) loginPromptContainer.style.display = 'none';
        } else {
            // User is signed out
            currentUser = null;
            authBtnText.textContent = 'Sign In';
            authBtn.classList.replace('btn-outline-gold', 'btn-gold');
            authBtn.setAttribute('data-bs-toggle', 'modal');
            authBtn.setAttribute('data-bs-target', '#authModal');

            // Hide upload button, show prompt
            if (uploadBtnContainer) uploadBtnContainer.style.display = 'none';
            if (loginPromptContainer) loginPromptContainer.style.display = 'block';
        }
    });

    // Handle Login/Logout button click
    authBtn.addEventListener('click', (e) => {
        if (currentUser) {
            e.preventDefault();
            signOut(auth).then(() => {
                showToast('Signed out successfully');
            }).catch((error) => {
                showToast('Error signing out: ' + error.message);
            });
        }
    });

    // Handle Login Submit
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;

            btn.textContent = 'Signing in...';
            btn.disabled = true;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    authModal.hide();
                    loginForm.reset();
                    showToast('Welcome back!');
                })
                .catch((error) => {
                    showToast(error.message.replace('Firebase: ', ''));
                })
                .finally(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                });
        });
    }

    // Handle Sign Up Submit
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const btn = signupForm.querySelector('button');
            const originalText = btn.textContent;

            btn.textContent = 'Creating account...';
            btn.disabled = true;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Update profile with display name
                    return updateProfile(userCredential.user, {
                        displayName: name
                    });
                })
                .then(() => {
                    authModal.hide();
                    signupForm.reset();
                    showToast('Account created successfully!');
                })
                .catch((error) => {
                    showToast(error.message.replace('Firebase: ', ''));
                })
                .finally(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                });
        });
    }

    // ========== ART UPLOAD & FIREBASE STORAGE ==========
    const uploadForm = document.getElementById('uploadArtForm');

    // Load saved artworks from Firestore
    let unsubscribeArtworks = null;
    const loadSavedArtworks = () => {
        if (unsubscribeArtworks) unsubscribeArtworks();

        try {
            const q = query(collection(db, "artworks"));
            unsubscribeArtworks = onSnapshot(q, (querySnapshot) => {
                // Clear existing uploads to avoid duplicates on updates
                const existingUploads = document.querySelectorAll('.gallery-item[data-user-upload="true"]');
                existingUploads.forEach(el => el.remove());

                const spacer = galleryGrid ? galleryGrid.querySelector('.gallery-item-spacer') : null;

                querySnapshot.forEach((doc) => {
                    const artData = doc.data();
                    artData.id = doc.id;
                    const artEl = createArtworkElement(artData);

                    if (galleryGrid) {
                        if (spacer) {
                            galleryGrid.insertBefore(artEl, spacer);
                        } else {
                            galleryGrid.appendChild(artEl);
                        }
                    }
                });
            });
        } catch (error) {
            console.error("Error loading artworks: ", error);
        }
    };

    const createArtworkElement = (art) => {
        if (!art.id) art.id = 'art-' + Date.now().toString() + Math.random().toString(36).substr(2, 5);

        const div = document.createElement('div');
        div.className = 'gallery-item show';
        div.setAttribute('data-category', art.category);
        div.setAttribute('data-user-upload', 'true');
        div.innerHTML = `
            <div class="gallery-card">
                <div class="gallery-img-wrapper">
                    <img src="${art.image}" alt="${art.title}" loading="lazy">
                    <div class="gallery-overlay">
                        <div class="overlay-content">
                            <span class="artwork-category">${capitalize(art.category)}</span>
                            <h3 class="artwork-title">${art.title}</h3>
                            <p class="artwork-artist">By ${art.artist}</p>
                            <button class="btn-view" onclick="openLightbox(this)"><i class="bi bi-arrows-fullscreen"></i></button>
                            ${currentUser && currentUser.uid === art.userId ?
                `<button class="btn-delete" onclick="deleteArtwork('${art.id}', '${art.storagePath}', this)" title="Delete Artwork"><i class="bi bi-trash"></i></button>`
                : ''}
                        </div>
                    </div>
                </div>
                <div class="gallery-info">
                    <h4>${art.title}</h4>
                    <p>${capitalize(art.category)} — User Upload</p>
                </div>
            </div>
        `;

        // Add card tilt effect for new item
        div.querySelector('.gallery-card').addEventListener('mousemove', (e) => {
            if (window.innerWidth <= 991) return;
            const card = div.querySelector('.gallery-card');
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -3;
            const rotateY = (x - centerX) / centerX * 3;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });
        div.querySelector('.gallery-card').addEventListener('mouseleave', () => {
            div.querySelector('.gallery-card').style.transform = '';
        });

        // Add to lightbox items array directly (if lightbox was already opened once)
        // Lightbox list is dynamically rebuilt on click based on .gallery-item:not(.hide)

        return div;
    };

    const capitalize = (str) => {
        if (str === '3d') return '3D Art';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentUser) {
                showToast('You must be signed in to upload artwork.');
                return;
            }

            const fileInput = document.getElementById('artImage');
            const file = fileInput.files[0];
            const btn = uploadForm.querySelector('button[type="submit"]');
            const originalBtnText = btn.innerHTML;

            if (file) {
                // Cloudinary free tier limit for unsigned uploads is 10MB
                if (file.size > 10 * 1024 * 1024) {
                    alert(`The image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please select an image under 10MB.`);
                    return;
                }

                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading...';
                btn.disabled = true;

                try {
                    // Let's add a timeout in case the network request is silently swallowed/blocked by PC adblockers or firewalls
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

                    // 1. Upload image to Cloudinary (Unsigned)
                    const cloudName = 'dkfxbqj1g';
                    const uploadPreset = 'luxe_gallery_upload';
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', uploadPreset);

                    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                        method: 'POST',
                        body: formData,
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Failed to upload image to Cloudinary.');
                    }

                    const downloadURL = data.secure_url;

                    // 2. Save metadata to Firestore
                    const newArt = {
                        title: document.getElementById('artTitle').value,
                        artist: document.getElementById('artArtist').value,
                        category: document.getElementById('artCategory').value,
                        image: downloadURL,
                        storagePath: data.public_id, // Store Cloudinary public_id
                        userId: currentUser.uid,
                        createdAt: new Date().toISOString()
                    };

                    const docRef = await addDoc(collection(db, "artworks"), newArt);
                    newArt.id = docRef.id;

                    // UI update is handled automatically by onSnapshot listener

                    // 4. Reset form
                    uploadForm.reset();
                    const modalEl = document.getElementById('uploadModal');
                    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    modal.hide();

                    showToast('Artwork uploaded successfully!');
                } catch (error) {
                    console.error("Error uploading artwork: ", error);
                    let errorMsg = error.message;
                    if (error.name === 'AbortError') {
                        errorMsg = 'Upload timed out. This may be due to a strict network firewall, an adblocker (try disabling it), or a slow connection.';
                    }
                    alert('Error uploading: ' + errorMsg);
                    showToast('Error uploading: ' + errorMsg);
                } finally {
                    btn.innerHTML = originalBtnText;
                    btn.disabled = false;
                }
            }
        });
    }

    // loadSavedArtworks() is now ONLY called inside onAuthStateChanged 
    // to prevent duplicate onSnapshot listeners firing from initial load + auth load

    // Re-render artworks when auth state changes so delete buttons accurate
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        loadSavedArtworks();
    });

    // ========== DELETE ARTWORK ==========
    window.deleteArtwork = async function (id, storagePath, btn) {
        if (!confirm("Are you sure you want to delete this artwork?")) return;

        try {
            // 1. Delete from Firestore
            await deleteDoc(doc(db, "artworks", id));

            // 2. Delete from Storage (if path exists and is Firebase)
            if (storagePath && storagePath.includes('/')) {
                try {
                    const storageRef = ref(storage, storagePath);
                    await deleteObject(storageRef);
                } catch (e) {
                    console.warn("Could not delete from Firebase Storage (might be Cloudinary).", e);
                }
            }

            // 3. Remove from UI
            const card = btn.closest('.gallery-item');
            if (card) {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => card.remove(), 400);
            }
            showToast('Artwork deleted successfully.');
        } catch (error) {
            console.error("Error deleting artwork: ", error);
            showToast("Failed to delete artwork: " + error.message);
        }
    };

    // ========== LIGHTBOX ==========
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxArtist = document.getElementById('lightboxArtist');
    let currentLightboxIndex = 0;
    let lightboxItems = [];
    let panzoomInstance = null;

    window.openLightbox = function (btn) {
        const card = btn.closest('.gallery-card');
        const img = card.querySelector('.gallery-img-wrapper img');
        const spline = card.querySelector('spline-viewer');
        const title = card.querySelector('.artwork-title');
        const artist = card.querySelector('.artwork-artist');

        // Build array of visible items
        lightboxItems = [];
        document.querySelectorAll('.gallery-item:not(.hide)').forEach(item => {
            const c = item.querySelector('.gallery-card');
            const itemImg = c.querySelector('.gallery-img-wrapper img');
            const itemSpline = c.querySelector('spline-viewer');

            // Only add to lightbox if there's an image (Spline interactive objects can't be put in standard image lightbox easily)
            if (itemImg && !itemSpline) {
                const titleEl = c.querySelector('.artwork-title');
                const artistEl = c.querySelector('.artwork-artist');
                lightboxItems.push({
                    img: itemImg.src,
                    title: titleEl ? titleEl.textContent : 'Untitled',
                    artist: artistEl ? artistEl.textContent : 'Unknown Artist'
                });
            }
        });

        // If clicking on an interactive Spline object, we can't show it in the image lightbox
        // But the user clicked 'zoom' on it, so let's show a toast message explaining it's already interactive
        if (spline) {
            showToast('3D scenes are interactive directly on the card.');
            return;
        }

        // Find current index
        const currentImg = img ? img.src : null;
        if (!currentImg) return;

        currentLightboxIndex = lightboxItems.findIndex(i => i.img === currentImg);
        if (currentLightboxIndex === -1) currentLightboxIndex = 0;

        showLightboxItem(currentLightboxIndex);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialize Panzoom if not already initialized
        if (!panzoomInstance && typeof Panzoom !== 'undefined') {
            panzoomInstance = Panzoom(lightboxImg, {
                maxScale: 5,
                contain: 'outside',
                step: 0.3
            });

            // Allow wheel zoom
            lightboxImg.parentElement.addEventListener('wheel', panzoomInstance.zoomWithWheel);
        } else if (panzoomInstance) {
            panzoomInstance.reset();
        }
    };

    window.closeLightbox = function () {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        if (panzoomInstance) panzoomInstance.reset();
    };

    window.navigateLightbox = function (direction) {
        currentLightboxIndex += direction;
        if (currentLightboxIndex < 0) currentLightboxIndex = lightboxItems.length - 1;
        if (currentLightboxIndex >= lightboxItems.length) currentLightboxIndex = 0;
        showLightboxItem(currentLightboxIndex);
        if (panzoomInstance) panzoomInstance.reset();
    };

    function showLightboxItem(index) {
        const item = lightboxItems[index];
        lightboxImg.src = item.img;
        lightboxTitle.textContent = item.title;
        lightboxArtist.textContent = item.artist;
    }

    // Close lightbox on backdrop click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // ========== CONTENT PROTECTION ==========
    // Disable right-click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showToast('Right-click is disabled to protect artwork');
    });

    // Disable keyboard shortcuts for saving/copying
    document.addEventListener('keydown', (e) => {
        // Ctrl+S, Ctrl+U, Ctrl+C (on images), Ctrl+Shift+I, F12
        if (
            (e.ctrlKey && e.key === 's') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            e.key === 'F12'
        ) {
            e.preventDefault();
            showToast('This action is disabled to protect artwork');
        }
    });

    // Disable drag on all images
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
        img.setAttribute('draggable', 'false');
    });

    // Disable text selection on gallery
    document.querySelectorAll('.gallery-card, .lightbox-content').forEach(el => {
        el.style.userSelect = 'none';
        el.style.webkitUserSelect = 'none';
    });

    // Add protected class to body
    document.body.classList.add('protected');

    // ========== TOAST NOTIFICATION ==========
    const toastEl = document.getElementById('customToast');
    const toastMsg = document.getElementById('toastMessage');
    let toastTimeout;

    function showToast(message) {
        toastMsg.textContent = message;
        toastEl.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2500);
    }

    // ========== CONTACT FORM ==========
    window.handleContactSubmit = function (e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Message Sent!';
        btn.disabled = true;
        btn.style.background = '#28a745';

        showToast('Thank you! Your message has been sent successfully.');

        setTimeout(() => {
            form.reset();
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.background = '';
        }, 3000);
    };

    // ========== NEWSLETTER SUBSCRIBE ==========
    window.handleSubscribe = function (e) {
        e.preventDefault();
        const form = e.target;
        const input = form.querySelector('input');
        const btn = form.querySelector('button');
        const originalText = btn.textContent;

        btn.textContent = 'Subscribed!';
        btn.disabled = true;

        showToast('Welcome! You\'ve been subscribed to our newsletter.');

        setTimeout(() => {
            input.value = '';
            btn.textContent = originalText;
            btn.disabled = false;
        }, 3000);
    };

    // ========== PARALLAX EFFECT ON HERO (SUBTLE) ==========
    const heroSection = document.getElementById('hero');
    if (heroSection && window.innerWidth > 991) {
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;

            const frame1 = document.querySelector('.hero-frame-1');
            const frame2 = document.querySelector('.hero-frame-2');

            if (frame1) frame1.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
            if (frame2) frame2.style.transform = `translate(${x * - 6}px, ${y * - 6}px)`;
        });
    }

    // ========== GALLERY CARD TILT ON HOVER ==========
    document.querySelectorAll('.gallery-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth <= 991) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -3;
            const rotateY = (x - centerX) / centerX * 3;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
});
