document.addEventListener('DOMContentLoaded', function() {
  const sponsorBtn = document.getElementById('sponsor-btn');
  const usageBtn = document.getElementById('usage-btn');
  const aboutBtn = document.getElementById('about-btn');
  const closeBtns = document.querySelectorAll('.close-btn');
  const qqBtn = document.querySelector('.qq-btn');

  sponsorBtn.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('sponsor-modal').classList.add('show');
  });

  usageBtn.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('usage-modal').classList.add('show');
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
});
