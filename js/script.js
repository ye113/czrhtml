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

  /* ===== Particles ===== */
  var canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var particles = [];
  var MAX = 30;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  function createP() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + 8,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.4 + 0.1,
      wind: Math.random() * 0.15 - 0.075,
      opacity: Math.random() * 0.2 + 0.03
    };
  }

  var rafId;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (particles.length < MAX && Math.random() < 0.1) {
      particles.push(createP());
    }

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.y -= p.speed;
      p.x += p.wind;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(150,150,180,' + p.opacity + ')';
      ctx.fill();

      if (p.y < -10) particles.splice(i, 1);
    }

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(rafId);
    else { resize(); rafId = requestAnimationFrame(draw); }
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });
});
