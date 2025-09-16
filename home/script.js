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

// função para mostrar o botao de criar curso caso o usuario seja professor


  async function verificarPermissao() {
    const token = localStorage.getItem("token");
    const btnCriar = document.getElementById("btnCriarCurso");

    if (!token) {
      // Se não estiver logado, já esconde o botão
      if (btnCriar) btnCriar.style.display = "none";
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/perfil", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        if (btnCriar) btnCriar.style.display = "none";
        return;
      }

      const user = await res.json();

      if (user.tipo_usuario !== "professor") {
        if (btnCriar) btnCriar.style.display = "none";
      }
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      if (btnCriar) btnCriar.style.display = "none";
    }
  }

  verificarPermissao();

