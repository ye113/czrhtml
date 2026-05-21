document.addEventListener('DOMContentLoaded', function () {
  /* ===== Hero Random Anime Image ===== */
  var heroImg = document.getElementById('hero-img');
  if (heroImg) {
    var fallbackBg = 'url(./assets/images/header-bg.jpg)';

    fetch('https://t.alcy.cc/json?pc')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.data && data.data.link) {
          var imgUrl = data.data.link;
          var img = new Image();
          img.onload = function () {
            heroImg.style.backgroundImage = 'url(' + imgUrl + ')';
            heroImg.classList.add('loaded');
          };
          img.onerror = function () {
            heroImg.style.backgroundImage = fallbackBg;
          };
          img.src = imgUrl;
        } else {
          heroImg.style.backgroundImage = fallbackBg;
        }
      })
      .catch(function () {
        heroImg.style.backgroundImage = fallbackBg;
      });
  }

  /* ===== Music ===== */
  var bgMusic = document.getElementById('bg-music');
  var musicBtn = document.getElementById('music-btn');
  var musicLabel = document.getElementById('music-label');

  if (bgMusic && musicBtn) {
    var isPlaying = false;
    var hasInteracted = false;

    function startMusic() {
      hasInteracted = true;
      bgMusic.play().then(function () {
        isPlaying = true;
        musicBtn.classList.add('playing');
        if (musicLabel) musicLabel.textContent = '正在播放';
      }).catch(function () {});
    }

    function toggleMusic() {
      hasInteracted = true;
      if (bgMusic.paused) {
        startMusic();
      } else {
        bgMusic.pause();
        isPlaying = false;
        musicBtn.classList.remove('playing');
        if (musicLabel) musicLabel.textContent = '播放音乐';
      }
    }

    musicBtn.addEventListener('click', toggleMusic);

    document.addEventListener('click', function () {
      if (!hasInteracted) startMusic();
    });
  }

  /* ===== Modals ===== */
  var joinBtn = document.getElementById('join-btn');
  var aboutBtn = document.getElementById('about-btn');
  var recruitMoreBtn = document.getElementById('recruit-more-btn');

  function openModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.add('show');
  }

  var triggers = [
    { btn: joinBtn, id: 'sponsor-modal' },
    { btn: aboutBtn, id: 'about-modal' },
    { btn: recruitMoreBtn, id: 'sponsor-modal' }
  ];

  triggers.forEach(function (t) {
    if (!t.btn) return;
    t.btn.addEventListener('click', function (e) {
      e.preventDefault();
      var m = document.getElementById(t.id);
      if (m) m.classList.add('show');
    });
  });

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var m = document.getElementById(btn.getAttribute('data-close'));
      if (m) m.classList.remove('show');
    });
  });

  document.querySelectorAll('.modal').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.classList.contains('modal-overlay')) {
        modal.classList.remove('show');
      }
    });
  });

  /* ===== Effect 1: Mouse Glow (desktop only) ===== */
  var glow = document.getElementById('mouseGlow');

  if (glow) {
    var glowX = -50, glowY = -50;
    var targetX = -50, targetY = -50;

    // Colors to cycle between (R,G,B values)
    var glowColors = [
      { r: 15, g: 139, b: 141 },   // teal
      { r: 255, g: 107, b: 107 },  // coral
      { r: 108, g: 92, b: 231 },   // purple
      { r: 253, g: 203, b: 110 }   // gold
    ];
    var currentIdx = 0;
    var nextIdx = 1;
    var blend = 0; // 0 = current color, 1 = next color
    var blendSpeed = 0.004; // how fast to blend (takes ~4s for full cycle at 60fps)

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      glow.style.opacity = '1';
    });

    document.addEventListener('mouseleave', function () {
      glow.style.opacity = '0';
    });

    document.addEventListener('touchstart', function () {
      glow.style.display = 'none';
    }, { once: true });

    function lerp(a, b, t) { return a + (b - a) * t; }

    function updateGlowColor() {
      var from = glowColors[currentIdx];
      var to = glowColors[nextIdx];
      var r = Math.round(lerp(from.r, to.r, blend));
      var g = Math.round(lerp(from.g, to.g, blend));
      var b = Math.round(lerp(from.b, to.b, blend));
      glow.style.background = 'radial-gradient(circle, rgba(' + r + ',' + g + ',' + b + ',0.2), rgba(' + r + ',' + g + ',' + b + ',0) 70%)';
    }

    function animateGlow() {
      glowX += (targetX - glowX) * 0.12;
      glowY += (targetY - glowY) * 0.12;
      glow.style.transform = 'translate(' + (glowX - 50) + 'px, ' + (glowY - 50) + 'px)';

      // Smooth color blend
      blend += blendSpeed;
      if (blend >= 1) {
        blend = 0;
        currentIdx = nextIdx;
        nextIdx = (nextIdx + 1) % glowColors.length;
      }
      updateGlowColor();

      requestAnimationFrame(animateGlow);
    }

    updateGlowColor();
    animateGlow();
  }

  /* ===== Effect 2: Click Ripple (desktop + mobile) ===== */
  var rippleColors = [
    { ring: 'rgba(15,139,141,0.35)', dot: 'rgba(15,139,141,0.5)' },
    { ring: 'rgba(255,107,107,0.3)', dot: 'rgba(255,107,107,0.45)' },
    { ring: 'rgba(108,92,231,0.3)',  dot: 'rgba(108,92,231,0.45)' },
    { ring: 'rgba(253,203,110,0.35)', dot: 'rgba(253,203,110,0.5)' }
  ];

  function createRipple(x, y) {
    var c = rippleColors[Math.floor(Math.random() * rippleColors.length)];

    // Ring
    var ring = document.createElement('div');
    ring.className = 'ripple-ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.border = '2px solid ' + c.ring;
    document.body.appendChild(ring);
    setTimeout(function () { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 900);

    // Center dot burst
    for (var d = 0; d < 4; d++) {
      var dot = document.createElement('div');
      dot.className = 'ripple-ring';
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      dot.style.border = 'none';
      dot.style.borderRadius = '50%';
      dot.style.background = c.dot;
      dot.style.animation = 'rippleDotAnim 0.6s ease-out forwards';
      dot.style.animationDelay = (d * 0.06) + 's';
      document.body.appendChild(dot);
      setTimeout(function () { if (dot.parentNode) dot.parentNode.removeChild(dot); }, 1000);
    }
  }

  document.addEventListener('click', function (e) { createRipple(e.clientX, e.clientY); });
  document.addEventListener('touchstart', function (e) {
    var touch = e.touches[0];
    if (touch) createRipple(touch.clientX, touch.clientY);
  });

  /* ===== Effect 3: Floating Star Particles ===== */
  var canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var particles = [];
  var MAX = 45;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  function createStar() {
    var colors = ['rgba(15,139,141,', 'rgba(255,107,107,', 'rgba(108,92,231,', 'rgba(253,203,110,'];
    var color = colors[Math.floor(Math.random() * colors.length)];
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      r: Math.random() * 2.2 + 0.8,
      speed: Math.random() * 0.5 + 0.15,
      wind: Math.random() * 0.2 - 0.1,
      color: color,
      opacity: Math.random() * 0.35 + 0.1,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2
    };
  }

  var rafId;

  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var time = Date.now();

    if (particles.length < MAX && Math.random() < 0.15) {
      particles.push(createStar());
    }

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.y -= p.speed;
      p.x += p.wind;

      // Twinkle
      var twinkle = 0.6 + 0.4 * Math.sin(time * p.twinkleSpeed + p.twinklePhase);
      var alpha = p.opacity * twinkle;

      // Glow halo
      var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0, p.color + alpha * 0.4 + ')');
      grad.addColorStop(1, p.color + '0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();

      if (p.y < -10) particles.splice(i, 1);
    }

    rafId = requestAnimationFrame(drawStars);
  }

  rafId = requestAnimationFrame(drawStars);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(rafId);
    else { resize(); rafId = requestAnimationFrame(drawStars); }
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });
});
