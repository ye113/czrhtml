document.addEventListener('DOMContentLoaded', function() {
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (prefersDark) {
    document.documentElement.classList.add('dark-mode');
  }
  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (e.matches) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  });

  const sponsorBtn = document.getElementById('sponsor-btn');
  const modal = document.getElementById('sponsor-modal');
  const closeBtn = document.getElementById('close-modal');
  const qqBtn = document.querySelector('.qq-btn');

  sponsorBtn.addEventListener('click', function(e) {
    e.preventDefault();
    modal.classList.add('show');
  });

  closeBtn.addEventListener('click', function() {
    modal.classList.remove('show');
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });

  qqBtn.addEventListener('click', function() {
    window.open('https://qm.qq.com/q/ghRdG8iRgW', '_blank');
  });
});
