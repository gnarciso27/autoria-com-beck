document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const sidebar = document.getElementById('sidebar');

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('expanded');
  });

  // Carregar cursos do backend
  const container = document.getElementById('cursosContainer');
  try {
    const res = await fetch('http://localhost:3000/api/cursos');
    const cursos = await res.json();

    container.innerHTML = '';
    cursos.forEach(curso => {
      container.innerHTML += `
        <div class="curso card m-3" style="width: 18rem;">
          <img src="${curso.imagem}" class="card-img-top curso__img" alt="Imagem do Curso">
          <div class="card-body curso__conteudo">
            <h5 class="card-title curso__titulo">${curso.nome}</h5>
            <p class="card-text curso__descr">${curso.descricao}</p>
            <a href="${curso.link}" class="botao btn btn-roxo">Ver curso</a>
          </div>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p>Erro ao carregar cursos.</p>`;
    console.error(err);
  }
});
