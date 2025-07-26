// Ativar o modo escuro salvo no navegador
if (localStorage.getItem('modo') === 'escuro') {
    document.body.classList.add('dark-mode');
    document.querySelector('.dark-toggle').textContent = '☀️';
  }
  
  // Alternar entre modo escuro e claro
  // ON CLICK
  function toggleDarkMode() {
    const body = document.body;
    const button = document.querySelector('.dark-toggle');
  
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
  
    button.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('modo', isDark ? 'escuro' : 'claro');
  }
  