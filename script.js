// 简单的暗色模式支持（根据系统偏好）
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.body.style.background = '#1a1a1a';
  document.querySelector('.container').style.background = '#252525';
  document.body.style.color = '#e0e0e0';
  document.querySelectorAll('h1, h2, .role, .bio').forEach(el => {
    el.style.color = '#f0f0f0';
  });
  document.querySelectorAll('a').forEach(el => {
    el.style.color = '#66b3ff';
  });
}