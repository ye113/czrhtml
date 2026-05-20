document.addEventListener('DOMContentLoaded', function() {
  const joinBtn = document.getElementById('join-btn');
  const aboutBtn = document.getElementById('about-btn');
  const closeBtns = document.querySelectorAll('.close-btn');
  const bgMusic = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-btn');
  const vinylRecord = document.querySelector('.vinyl-record');

  if (!bgMusic || !musicBtn || !vinylRecord) return;

  let isPlaying = false;
  let hasInteracted = false;
  let rotationAngle = 0;
  let animationFrameId = null;
  const rotationSpeed = 0.5;

  function animate() {
    if (isPlaying) {
      rotationAngle = (rotationAngle + rotationSpeed) % 360;
      vinylRecord.style.transform = `rotate(${rotationAngle}deg)`;
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  function startMusic() {
    hasInteracted = true;
    bgMusic.play().then(function() {
      isPlaying = true;
      musicBtn.classList.add('playing');
      animate();
    }).catch(function() {});
  }

  function toggleMusic() {
    hasInteracted = true;
    if (bgMusic.paused) {
      startMusic();
    } else {
      bgMusic.pause();
      isPlaying = false;
      musicBtn.classList.remove('playing');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }
  }

  musicBtn.addEventListener('click', toggleMusic);

  document.addEventListener('click', function() {
    if (!hasInteracted) startMusic();
  });

  if (joinBtn) {
    joinBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var modal = document.getElementById('sponsor-modal');
      if (modal) modal.classList.add('show');
    });
  }

  if (aboutBtn) {
    aboutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var modal = document.getElementById('about-modal');
      if (modal) modal.classList.add('show');
    });
  }

  closeBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var modal = document.getElementById(btn.getAttribute('data-close'));
      if (modal) modal.classList.remove('show');
    });
  });

  document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var ctx = canvas.getContext('2d');
  var flakes = [];
  var maxFlakes = 100;

  function createFlake() {
    return {
      x: Math.random() * canvas.width,
      y: -10,
      r: Math.random() * 3 + 1.5,
      speed: Math.random() * 1.5 + 0.3,
      wind: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.6 + 0.4
    };
  }

  function animateSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (flakes.length < maxFlakes && Math.random() < 0.3) {
      flakes.push(createFlake());
    }

    for (var i = flakes.length - 1; i >= 0; i--) {
      var f = flakes[i];
      f.y += f.speed;
      f.x += f.wind;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + f.opacity + ')';
      ctx.fill();

      if (f.y > canvas.height + 10) {
        flakes.splice(i, 1);
      }
    }

    requestAnimationFrame(animateSnow);
  }

  var snowRafId = requestAnimationFrame(animateSnow);

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      cancelAnimationFrame(snowRafId);
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      snowRafId = requestAnimationFrame(animateSnow);
    }
  });

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }, 200);
  });
});
