document.addEventListener('DOMContentLoaded', function() {
  const joinBtn = document.getElementById('join-btn');
  const usageBtn = document.getElementById('usage-btn');
  const aboutBtn = document.getElementById('about-btn');
  const closeBtns = document.querySelectorAll('.close-btn');
  const qqBtn = document.querySelector('.qq-btn');
  const bgMusic = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-btn');
  const musicPlayer = document.getElementById('music-player');
  const vinylRecord = document.querySelector('.vinyl-record');

  let isPlaying = false;
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

  function playMusic() {
    bgMusic.play().then(function() {
      isPlaying = true;
      musicBtn.classList.add('playing');
      animate();
    }).catch(function(error) {
      console.log('自动播放被阻止，需要用户交互');
    });
  }

  function toggleMusic() {
    if (bgMusic.paused) {
      bgMusic.play();
      isPlaying = true;
      musicBtn.classList.add('playing');
      animate();
    } else {
      bgMusic.pause();
      isPlaying = false;
      musicBtn.classList.remove('playing');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }
  }

  playMusic();

  musicBtn.addEventListener('click', toggleMusic);

  joinBtn.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('sponsor-modal').classList.add('show');
  });

  aboutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('about-modal').classList.add('show');
  });

  closeBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const modalId = btn.getAttribute('data-close');
      document.getElementById(modalId).classList.remove('show');
    });
  });

  document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  qqBtn.addEventListener('click', function() {
    window.open('https://qm.qq.com/q/ghRdG8iRgW', '_blank');
  });

  function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.innerHTML = '❄';
    
    const size = Math.random() * 10 + 8;
    const left = Math.random() * 100;
    const duration = Math.random() * 5 + 5;
    const delay = Math.random() * 2;
    
    snowflake.style.fontSize = size + 'px';
    snowflake.style.left = left + '%';
    snowflake.style.animationDuration = duration + 's';
    snowflake.style.animationDelay = delay + 's';
    
    document.body.appendChild(snowflake);
    
    setTimeout(function() {
      snowflake.remove();
    }, (duration + delay) * 1000);
  }

  setInterval(createSnowflake, 200);
});
