   // Modal functionality
        class ModalManager {
            constructor() {
                this.init();
            }

            init() {
                // Add click listeners to all path nodes with data-modal attribute
                document.querySelectorAll('.UMA__path-node[data-modal]').forEach(node => {
                    node.addEventListener('click', (e) => {
                        e.preventDefault();
                        const modalId = node.getAttribute('data-modal');
                        this.openModal(modalId);
                    });
                });

                // Add click listeners to close buttons
                document.querySelectorAll('.uma-close').forEach(closeBtn => {
                    closeBtn.addEventListener('click', () => {
                        this.closeModal();
                    });
                });

                // Close modal when clicking outside of modal content
                document.querySelectorAll('.uma-modal').forEach(modal => {
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            this.closeModal();
                        }
                    });
                });

                // Close modal with Escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.closeModal();
                    }
                });
            }

            openModal(modalId) {
                const modal = document.getElementById(`moduleModal-${modalId}`);
                if (modal) {
                    modal.style.display = 'block';
                    document.body.style.overflow = 'hidden'; // Prevent background scrolling
                }
            }

            closeModal() {
                document.querySelectorAll('.uma-modal').forEach(modal => {
                    modal.style.display = 'none';
                });
                document.body.style.overflow = 'auto'; // Restore scrolling
            }
        }

        // Initialize modal manager when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new ModalManager();
        });

// coach carousel 
 class EliteCoachesCarousel {
            constructor() {
                this.track = document.getElementById('carouselTrack');
                this.prevBtn = document.getElementById('prevBtn');
                this.nextBtn = document.getElementById('nextBtn');
                this.dotsContainer = document.getElementById('carouselDots');
                this.cards = this.track.querySelectorAll('.coach-card');
                this.currentIndex = 0;
                this.cardsPerView = this.getCardsPerView();
                this.maxIndex = Math.max(0, this.cards.length - this.cardsPerView);
                
                this.init();
            }

            getCardsPerView() {
                if (window.innerWidth <= 480) return 1;
                if (window.innerWidth <= 768) return 2;
                if (window.innerWidth <= 1024) return 3;
                return 3;
            }

            init() {
                this.createDots();
                this.updateCarousel();
                this.bindEvents();
            }

            createDots() {
                this.dotsContainer.innerHTML = '';
                const dotsCount = Math.ceil(this.cards.length / this.cardsPerView);
                
                for (let i = 0; i < dotsCount; i++) {
                    const dot = document.createElement('button');
                    dot.classList.add('dot');
                    if (i === 0) dot.classList.add('active');
                    dot.addEventListener('click', () => this.goToSlide(i));
                    this.dotsContainer.appendChild(dot);
                }
            }

            updateCarousel() {
                const cardWidth = this.cards[0].offsetWidth;
                const gap = 24; // var(--spacing-md)
                const translateX = -(this.currentIndex * (cardWidth + gap));
                
                this.track.style.transform = `translateX(${translateX}px)`;
                this.updateDots();
                this.updateButtons();
            }

            updateDots() {
                const dots = this.dotsContainer.querySelectorAll('.dot');
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === Math.floor(this.currentIndex / this.cardsPerView));
                });
            }

            updateButtons() {
                // Never disable buttons for infinite scroll
                this.prevBtn.disabled = false;
                this.nextBtn.disabled = false;
            }

            next() {
                if (this.currentIndex < this.maxIndex) {
                    this.currentIndex = Math.min(this.currentIndex + 1, this.maxIndex);
                } else {
                    // Go to beginning when at the end
                    this.currentIndex = 0;
                }
                this.updateCarousel();
            }

            prev() {
                if (this.currentIndex > 0) {
                    this.currentIndex = Math.max(this.currentIndex - 1, 0);
                } else {
                    // Go to end when at the beginning
                    this.currentIndex = this.maxIndex;
                }
                this.updateCarousel();
            }

            goToSlide(slideIndex) {
                this.currentIndex = Math.min(slideIndex * this.cardsPerView, this.maxIndex);
                this.updateCarousel();
            }

            bindEvents() {
                this.nextBtn.addEventListener('click', () => this.next());
                this.prevBtn.addEventListener('click', () => this.prev());

                // Keyboard navigation
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowRight') this.next();
                    if (e.key === 'ArrowLeft') this.prev();
                });

                // Touch/swipe support
                let startX = 0;
                let endX = 0;

                this.track.addEventListener('touchstart', e => {
                    startX = e.touches[0].clientX;
                });

                this.track.addEventListener('touchend', e => {
                    endX = e.changedTouches[0].clientX;
                    const diff = startX - endX;
                    
                    if (Math.abs(diff) > 50) {
                        if (diff > 0) this.next();
                        else this.prev();
                    }
                });

                // Resize handler
                window.addEventListener('resize', () => {
                    this.cardsPerView = this.getCardsPerView();
                    this.maxIndex = Math.max(0, this.cards.length - this.cardsPerView);
                    this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
                    this.createDots();
                    this.updateCarousel();
                });

                // Auto-play (optional)
                setInterval(() => {
                    if (this.currentIndex >= this.maxIndex) {
                        this.currentIndex = 0;
                    } else {
                        this.next();
                    }
                }, 5000);
            }
        }

        // Initialize carousel when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new EliteCoachesCarousel();
        });

// end coach carousel

// Mobile Tooltip Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if device is touch-enabled
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Get all tooltip triggers - now includes pricing-bonus elements and feature screenshots
    const tooltipTriggers = document.querySelectorAll('.feature-text, .flowchart-step, .pricing-bonus, .feature-screenshot');
    
    // Only apply mobile behavior on touch devices or small screens
    if (isTouchDevice || window.innerWidth <= 768) {
        tooltipTriggers.forEach(trigger => {
            const tooltip = trigger.querySelector('.tooltip');
            if (!tooltip) return;
            
            // Add tooltip-toggle class for mobile behavior
            trigger.classList.add('tooltip-toggle');
            
            // Handle tap/touch events
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other open tooltips
                document.querySelectorAll('.tooltip-toggle.active').forEach(activeTooltip => {
                    if (activeTooltip !== trigger) {
                        activeTooltip.classList.remove('active');
                    }
                });
                
                // Toggle current tooltip
                trigger.classList.toggle('active');
            });
            
            // Handle keyboard navigation
            trigger.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    trigger.classList.toggle('active');
                }
                
                if (e.key === 'Escape') {
                    trigger.classList.remove('active');
                }
            });
            
            // Make element focusable for keyboard users
            if (!trigger.hasAttribute('tabindex')) {
                trigger.setAttribute('tabindex', '0');
            }
        });
        
        // Close tooltips when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.tooltip-toggle')) {
                document.querySelectorAll('.tooltip-toggle.active').forEach(activeTooltip => {
                    activeTooltip.classList.remove('active');
                });
            }
        });
        
        // Close tooltips when scrolling (for mobile)
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                document.querySelectorAll('.tooltip-toggle.active').forEach(activeTooltip => {
                    activeTooltip.classList.remove('active');
                });
            }, 150);
        });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', function() {
            setTimeout(() => {
                document.querySelectorAll('.tooltip-toggle.active').forEach(activeTooltip => {
                    activeTooltip.classList.remove('active');
                });
            }, 500);
        });
    }
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Re-evaluate if we need mobile behavior
            const needsMobileBehavior = window.innerWidth <= 768;
            
            tooltipTriggers.forEach(trigger => {
                if (needsMobileBehavior && !trigger.classList.contains('tooltip-toggle')) {
                    trigger.classList.add('tooltip-toggle');
                } else if (!needsMobileBehavior && isTouchDevice === false) {
                    trigger.classList.remove('tooltip-toggle', 'active');
                }
            });
        }, 250);
    });
});

// Optional: Add swipe gesture support for closing tooltips
if ('ontouchstart' in window) {
    let startY = 0;
    
    document.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        const currentY = e.touches[0].clientY;
        const diffY = Math.abs(currentY - startY);
        
        // If user swipes significantly, close tooltips
        if (diffY > 50) {
            document.querySelectorAll('.tooltip-toggle.active').forEach(activeTooltip => {
                activeTooltip.classList.remove('active');
            });
        }
    }, { passive: true });
}

// Mobile Sticky CTA Button Functionality
class MobileStickyCTA {
    constructor() {
        this.ctaButton = null;
        this.heroSection = null;
        this.isVisible = false;
        this.isInitialized = false;
        this.scrollHandler = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        this.ctaButton = document.getElementById('mobile-sticky-cta');
        this.heroSection = document.querySelector('.lab-hero-section');
        

        
        if (!this.ctaButton || !this.heroSection) {
            console.warn('Mobile CTA elements not found');
            return;
        }

        // Only initialize on mobile devices
        if (window.innerWidth <= 768) {
            this.bindEvents();
            this.checkVisibility();
            this.isInitialized = true;
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768 && !this.isInitialized) {
                this.bindEvents();
                this.checkVisibility();
                this.isInitialized = true;
            } else if (window.innerWidth > 768 && this.isInitialized) {
                this.hideCTA();
                this.unbindEvents();
                this.isInitialized = false;
            }
        });
    }

    bindEvents() {
        // Remove existing listener to prevent duplicates
        this.unbindEvents();
        
        // Create throttled scroll handler
        let ticking = false;
        this.scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.checkVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }

    unbindEvents() {
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }
    }

    checkVisibility() {
        if (!this.heroSection || !this.ctaButton || window.innerWidth > 768) return;

        // Always show CTA on mobile devices
        if (!this.isVisible) {
            this.showCTA();
        }
    }

    showCTA() {
        if (this.ctaButton) {
            this.ctaButton.classList.add('visible');
            this.isVisible = true;
        }
    }

    hideCTA() {
        if (this.ctaButton) {
            this.ctaButton.classList.remove('visible');
            this.isVisible = false;
        }
    }
}

// Smooth scroll function for the CTA button
function scrollToJoinNow() {
    const joinSection = document.getElementById('join-now');
    if (joinSection) {
        // Add smooth fade animation
        const mobileCTA = document.getElementById('mobile-sticky-cta');
        if (mobileCTA) {
            mobileCTA.style.opacity = '0.7';
            setTimeout(() => {
                mobileCTA.style.opacity = '1';
            }, 300);
        }

        // Smooth scroll to the section
        joinSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Smooth scroll function for navigation links
function scrollToSection(selector) {
    const section = document.querySelector(selector);
    if (section) {
        // Calculate offset for sticky nav
        const offset = 60; // Height of sticky nav
        const elementPosition = section.offsetTop;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Initialize Mobile Sticky CTA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MobileStickyCTA();
});

// Also try immediate initialization in case DOM is already loaded
if (document.readyState !== 'loading') {
    new MobileStickyCTA();
}