(function(w, d){
    // Wait for jQuery then init once
    function waitForjQuery(cb){
      if (w.jQuery) cb(w.jQuery);
      else setTimeout(function(){ waitForjQuery(cb); }, 50);
    }
  
    // Throttle via rAF
    function rafThrottle(fn){
      var ticking = false;
      return function(){
        if (ticking) return;
        ticking = true;
        var ctx = this, args = arguments;
        requestAnimationFrame(function(){
          ticking = false;
          fn.apply(ctx, args);
        });
      };
    }
  
    waitForjQuery(function($){
      if ($('body').data('uma-init') === 1) return;
      $('body').data('uma-init', 1);
  
      console.log('UMA header script initializing. jQuery:', $.fn.jquery);
  
      // ===============================
      // MODALS (delegated)
      // ===============================
      function openModal(modalId){
        var $m = $('#modal-' + modalId);
        if (!$m.length) { console.error('Modal not found: #modal-' + modalId); return; }
        if (!$m.parent().is('body')) $m.appendTo('body');
        $m.css('display', 'block').attr('aria-hidden', 'false').addClass('active').fadeIn(200);
        $('body').addClass('uma-modal-open').css('overflow','hidden');
      }
      function closeModal($m){
        // Pause any videos in the modal before closing
        pauseModalVideos($m);
        
        $m.fadeOut(200, function(){
          $m.removeClass('active').attr('aria-hidden','true').css('display','none');
        });
        $('body').removeClass('uma-modal-open').css('overflow','auto');
      }
      
      function pauseModalVideos($modal){
        // Find all video iframes in the modal
        var $videos = $modal.find('iframe');
        
        $videos.each(function(){
          var iframe = this;
          var src = iframe.src;
          
          // Handle Vimeo videos
          if (src.includes('player.vimeo.com')) {
            try {
              // Try to pause using Vimeo Player API if available
              if (window.Vimeo && iframe.contentWindow && iframe.contentWindow.postMessage) {
                iframe.contentWindow.postMessage('{"method":"pause"}', '*');
              }
            } catch (e) {
              console.log('Could not pause Vimeo video:', e);
            }
          }
          
          // Handle YouTube videos
          else if (src.includes('youtube.com') || src.includes('youtu.be')) {
            try {
              // Method 1: Try to pause using YouTube Player API
              if (iframe.contentWindow && iframe.contentWindow.postMessage) {
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
              }
              
              // Method 2: Try alternative YouTube API commands
              if (iframe.contentWindow && iframe.contentWindow.postMessage) {
                iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
              }
              
              // Method 3: Remove and restore src to force stop
              var originalSrc = iframe.src;
              iframe.src = '';
              setTimeout(function(){
                iframe.src = originalSrc;
              }, 100);
              
            } catch (e) {
              console.log('Could not pause YouTube video:', e);
              // Fallback: remove src to stop video
              try {
                var originalSrc = iframe.src;
                iframe.src = '';
                setTimeout(function(){
                  iframe.src = originalSrc;
                }, 100);
              } catch (fallbackError) {
                console.log('Fallback YouTube pause failed:', fallbackError);
              }
            }
          }
          
          // For any other video iframe, try to remove the src to stop playback
          else {
            try {
              var originalSrc = iframe.src;
              iframe.src = '';
              // Restore src after a brief moment to allow for reopening
              setTimeout(function(){
                iframe.src = originalSrc;
              }, 100);
            } catch (e) {
              console.log('Could not pause video:', e);
            }
          }
        });
      }
  
      $(d).on('click', '[data-modal]', function(e){
        e.preventDefault();
        e.stopPropagation();
        openModal($(this).attr('data-modal'));
      });
      $(d).on('click', '.uma-modal', function(e){
        if (e.target === this) closeModal($(this));
      });
      $(d).on('click', '.uma-close', function(e){
        e.preventDefault();
        closeModal($(this).closest('.uma-modal'));
      });
      $(d).on('keydown', function(e){
        if (e.key === 'Escape') {
          var $activeModal = $('.uma-modal.active');
          if ($activeModal.length) closeModal($activeModal);
        }
      });
  
      // ===============================
      // BASIC CAROUSEL (IDs: #carouselTrack, #prevBtn, #nextBtn, #carouselDots)
      // ===============================
      function initCarousel(){
        var $track = $('#carouselTrack');
        if (!$track.length) return;
  
        var $prev = $('#prevBtn');
        var $next = $('#nextBtn');
        var $dots = $('#carouselDots');
        var $cards = $track.find('.coach-card');
  
        var gap = 24;
        var cardWidth = 320 + gap; // default fallback
        var visible = Math.max(1, Math.floor($track.width() / cardWidth));
        var index = 0;
  
        // If real width is measurable, use it
        if ($cards.length) {
          var realW = $cards.first().outerWidth();
          if (realW) cardWidth = realW + gap;
          visible = Math.max(1, Math.floor($track.width() / cardWidth));
        }
  
        function createDots(){
          $dots.empty();
          var pages = Math.ceil($cards.length / visible);
          var cardSymbols = ['&spades;', '&hearts;', '&clubs;', '&diams;']; // Spade, Heart, Club, Diamond
          for (var i = 0; i < pages; i++){
            var symbol = cardSymbols[i % cardSymbols.length];
            var $dot = $('<button>').addClass('dot' + (i === 0 ? ' active' : '')).html(symbol);
            (function(p){ $dot.on('click', function(){ goTo(p * visible); }); })(i);
            $dots.append($dot);
          }
        }
  
        function updateDots(){
          var page = Math.floor(index / visible);
          $dots.find('.dot').each(function(i){ $(this).toggleClass('active', i === page); });
        }
  
        function updateButtons(){
          // Keep buttons always enabled and visible - no visual changes
          $prev.prop('disabled', false);
          $next.prop('disabled', false);
        }
  
        function goTo(i){
          index = Math.max(0, Math.min(i, Math.max(0, $cards.length - visible)));
          $track.css('transform', 'translateX(' + (-index * cardWidth) + 'px)');
          updateDots();
          updateButtons();
        }

        $prev.on('click', function(){ 
          if (index > 0) goTo(index - visible); 
        });
        $next.on('click', function(){ 
          if (index < Math.max(0, $cards.length - visible)) goTo(index + visible); 
        });
  
        createDots();
        updateButtons();
        updateDots();
  
        // Recalc on resize
        $(w).on('resize', rafThrottle(function(){
          var oldVisible = visible;
          var newWidth = $cards.first().outerWidth();
          if (newWidth) cardWidth = newWidth + gap;
          visible = Math.max(1, Math.floor($track.width() / cardWidth));
          if (visible !== oldVisible){
            createDots();
            goTo(Math.min(index, Math.max(0, $cards.length - visible)));
          } else {
            goTo(index); // keep transform in sync
          }
        }));
      }
  
      // ===============================
      // ELITE COACHES CAROUSEL (same DOM as above but richer nav)
      // 
      // ===============================
      function initEliteCoachesCarousel(){
        var $track = $('#carouselTrack');
        if (!$track.length) return;
        if ($track.data('coaches-carousel-init')) return; // prevent double-binding
        $track.data('coaches-carousel-init', true);
  
        var $prev = $('#prevBtn');
        var $next = $('#nextBtn');
        var $dots = $('#carouselDots');
        var $cards = $track.find('.coach-card');
        var index = 0;
  
        function cardsPerView(){
          var wv = w.innerWidth;
          if (wv <= 480) return 1;
          if (wv <= 768) return 2;
          if (wv <= 1024) return 3;
          return 3;
        }
        var perView = cardsPerView();
        var maxIndex = Math.max(0, $cards.length - perView);
  
        function createDots(){
          $dots.empty();
          var pages = Math.ceil($cards.length / perView);
          var cardSymbols = ['&spades;', '&hearts;', '&clubs;', '&diams;']; // Spade, Heart, Club, Diamond
          for (var i = 0; i < pages; i++){
            var symbol = cardSymbols[i % cardSymbols.length];
            var $dot = $('<button>').addClass('dot' + (i === 0 ? ' active' : '')).html(symbol);
            (function(p){ $dot.on('click', function(){ goToPage(p); }); })(i);
            $dots.append($dot);
          }
        }
  
        function goToPage(p){
          index = Math.min(p * perView, maxIndex);
          update();
        }
  
        function update(){
          var cw = $cards.first().outerWidth() || 320;
          var gap = 24;
          var tx = -(index * (cw + gap));
          $track.css('transform', 'translateX(' + tx + 'px)');
          var page = Math.floor(index / perView);
          $dots.find('.dot').each(function(i){ $(this).toggleClass('active', i === page); });
          // Keep buttons always enabled and visible - no visual changes
          $prev.prop('disabled', false);
          $next.prop('disabled', false);
        }
  
        function next(){
          if (index < maxIndex) index = Math.min(index + 1, maxIndex);
          else index = 0;
          update();
        }
        function prev(){
          if (index > 0) index = Math.max(index - 1, 0);
          else index = maxIndex;
          update();
        }
  
        $next.on('click', next);
        $prev.on('click', prev);
  
        // Keyboard nav
        $(d).on('keydown', function(e){
          if (e.key === 'ArrowRight') next();
          if (e.key === 'ArrowLeft') prev();
        });
  
        // Touch nav with auto-pause functionality
        var startX = 0;
        var autoPlayInterval;
        var isUserInteracting = false;
        
        // Start auto-play
        function startAutoPlay() {
          autoPlayInterval = setInterval(function(){
            if (!isUserInteracting && index >= maxIndex) index = 0;
            else if (!isUserInteracting) next();
          }, 20000);
        }
        
        // Stop auto-play
        function stopAutoPlay() {
          if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
          }
        }
        
        // Resume auto-play after user interaction
        function resumeAutoPlay() {
          isUserInteracting = true;
          stopAutoPlay();
          setTimeout(function(){
            isUserInteracting = false;
            startAutoPlay();
          }, 15000); // Resume after 15 seconds of no interaction
        }
        
        $track.on('touchstart', function(e){ 
          startX = e.originalEvent.touches[0].clientX; 
          resumeAutoPlay();
        }, { passive: true });
        
        $track.on('touchend', function(e){
          var endX = e.originalEvent.changedTouches[0].clientX;
          var diff = startX - endX;
          if (Math.abs(diff) > 50) {
            diff > 0 ? next() : prev();
            resumeAutoPlay();
          }
        });
        
        // Start auto-play initially
        startAutoPlay();
  
        createDots();
        update();
      }
  
      // ===============================
      // SMOOTH SCROLLING
      // ===============================
      function initSmoothScrolling(){
        $(d).on('click', 'a[href^="#"]', function(e){
          var $t = $($(this).attr('href'));
          if ($t.length){
            e.preventDefault();
            $t[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
  
      // ===============================
      // GLOBAL SCROLL HELPERS
      // ===============================
      w.scrollToPricing = function(){
        var $s = $('.pricing-section');
        if ($s.length) $s[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      w.scrollToJoinNow = function(){
        var $s = $('#join-now');
        if ($s.length){
          var $cta = $('#mobile-sticky-cta');
          if ($cta.length){
            $cta.css('opacity','0.7');
            setTimeout(function(){ $cta.css('opacity','1'); }, 300);
          }
          $s[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
      w.scrollToSection = function(selector){
        var $sec = $(selector);
        if ($sec.length){
          var offset = 60;
          var pos = $sec.offset().top - offset;
          $('html, body').animate({ scrollTop: pos }, 600);
        }
      };
      w.scrollToTop = function(){
        $('html, body').animate({ scrollTop: 0 }, 600);
      };
  
      // ===============================
      // FEATURE SECTION TOOLTIPS
      // ===============================
      function initFeatureTooltips(){
        // Target the feature section .feature-card elements that include a tooltip
        var $cards = $('.features-grid .feature-card');
        if (!$cards.length) return;

        $cards.each(function(){
          var $card = $(this);
          var $tooltip = $card.find('.tooltip');
          if ($tooltip.length === 0) return;

          // Make it interactive
          if (!$card.hasClass('tooltip-toggle')) $card.addClass('tooltip-toggle');
          if (!$card.attr('tabindex')) $card.attr('tabindex', '0');

          // Desktop hover behavior
          if (!('ontouchstart' in window)) {
            $card.on('mouseenter', function(){ $(this).addClass('active'); });
            $card.on('mouseleave', function(){ $(this).removeClass('active'); });
          }

          // Mobile click behavior
          $card.on('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            
            var $this = $(this);
            var isCurrentlyActive = $this.hasClass('active');
            
            // Close all other tooltips first
            $('.feature-card.active').not($this).removeClass('active');
            
            // Toggle this tooltip
            $this.toggleClass('active');
          });
        });

        // Close tooltips when clicking outside
        $(d).on('click', function(e){
          if (!$(e.target).closest('.feature-card').length){
            $('.feature-card.active').removeClass('active');
          }
        });

        // Close tooltips on escape key
        $(d).on('keydown', function(e){
          if (e.key === 'Escape') {
            $('.feature-card.active').removeClass('active');
          }
        });

        // Debug
        console.log('Feature tooltips initialized. Found:', $('.features-grid .feature-card.tooltip-toggle').length);
      }
  
      // ===============================
      // PRICING FEATURES TOOLTIPS
      // ===============================
      function initPricingTooltips(){
        // Target the pricing features list items that include a tooltip inside .feature-text
        var $items = $('.pricing-features-list .feature-text');
        if (!$items.length) return;

        $items.each(function(){
          var $t = $(this);
          var $tooltip = $t.find('.tooltip');
          if ($tooltip.length === 0) return;

          // Make it interactive like other tooltip areas
          if (!$t.hasClass('tooltip-toggle')) $t.addClass('tooltip-toggle');
          if (!$t.attr('tabindex')) $t.attr('tabindex', '0');

          // Desktop hover mirrors behavior used for feature screenshots
          if (!('ontouchstart' in window)) {
            $t.on('mouseenter', function(){ $(this).addClass('active'); });
            $t.on('mouseleave', function(){ $(this).removeClass('active'); });
          }
        });

        // Debug
        console.log('Pricing tooltips initialized. Found:', $('.pricing-features-list .feature-text.tooltip-toggle').length);
      }

      // ===============================
      // MOBILE STICKY CTA
      // ===============================
      function initMobileStickyCTA(){
        var $cta = $('#mobile-sticky-cta');
        var $hero = $('#top-hero');
        if (!$cta.length || !$hero.length) return;
  
        function show(){ $cta.addClass('visible'); }
        function hide(){ $cta.removeClass('visible'); }
  
        function checkScroll(){
          if (w.innerWidth <= 768){
            var heroBottom = $hero.offset().top + $hero.outerHeight();
            var scrollTop = $(w).scrollTop();
            
            if (scrollTop > heroBottom){
              show();
            } else {
              hide();
            }
          } else {
            hide();
          }
        }
  
        $(w).on('resize', rafThrottle(checkScroll));
        $(w).on('scroll', rafThrottle(checkScroll), { passive: true });
        checkScroll(); // Initial check
      }
  
      // ===============================
      // EXPANDABLE SECTIONS
      // ===============================
      w.toggleExpandable = function(contentId, button){
        var $c = $('#' + contentId);
        var isExp = $c.hasClass('expanded');
        if (isExp){
          $c.removeClass('expanded');
          $(button).removeClass('expanded').find('.expand-text').text('Expand to see all lessons');
          $(button).find('.expand-icon').text('+');
        } else {
          $c.addClass('expanded');
          $(button).addClass('expanded').find('.expand-text').text('Collapse lessons');
          $(button).find('.expand-icon').text('×');
        }
      };
      function initExpandable(){
        $('.UMA__path-expandable-content').removeClass('expanded');
      }
  
      // ===============================
      // SWIPE GESTURES (close tooltips on big vertical swipe)
      // ===============================
      function initSwipeGestures(){
        if (!('ontouchstart' in w)) return;
        var startY = 0;
        $(d).on('touchstart', function(e){ startY = e.originalEvent.touches[0].clientY; }, { passive: true });
        $(d).on('touchmove', function(e){
          var currentY = e.originalEvent.touches[0].clientY;
          if (Math.abs(currentY - startY) > 50) $('.tooltip-toggle.active').removeClass('active');
        }, { passive: true });
      }
  
      // ===============================
      // INIT ALL
      // ===============================
      function initAll(){
        initFeatureTooltips();
        initPricingTooltips();
        initMobileStickyCTA();
        initExpandable();
        initSwipeGestures();
        initSmoothScrolling();
        initEliteCoachesCarousel();
        console.log('UMA header script ready');
      }
  
      // Run now, and also after window load as a safety
      initAll();
      $(w).on('load', function(){ setTimeout(initAll, 100); });
    });
  })(window, document);
  
