const toggleBtn = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');

toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('expanded');
});

window.onload = async () => {
  const container = document.querySelector('.cursos');
  const res = await fetch('http://localhost:3000/api/cursos');
  const cursos = await res.json();

  container.innerHTML = '';
  cursos.forEach(curso => {
    container.innerHTML += `
      <div class="curso">
        <img class="curso__img" src="${curso.imagem}" alt="">
        <div class="curso__conteudo">
          <h4 class="curso__titulo">${curso.nome}</h4>
          <p class="curso__descr">${curso.descricao}</p>
          <a href="${curso.link}"><button>Ver curso</button></a>
        </div>
      </div>
    `;
  });
};
