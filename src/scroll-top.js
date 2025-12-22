// Scroll Buttons functionality
(function() {
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  const scrollBottomBtn = document.getElementById('scroll-bottom-btn');

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  if (scrollBottomBtn) {
    scrollBottomBtn.addEventListener('click', () => {
      const footer = document.querySelector('.site-footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        window.scrollTo({
          top: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
          behavior: 'smooth'
        });
      }
    });
  }
})();
