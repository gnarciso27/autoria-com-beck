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

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById('cursosContainer');
  let ehProfessor = false;
  const token = localStorage.getItem("token");

  if (token) {
    try {
      const res = await fetch("http://localhost:3000/api/perfil", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        ehProfessor = user.tipo_usuario === "professor";
      }
    } catch (err) {
      console.error("Erro ao verificar perfil:", err);
    }
  }

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
            ${ehProfessor ? `<button class="btn btn-danger mt-2" onclick="removerCurso('${curso.slug}')">Remover</button>` : ""}
          </div>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p>Erro ao carregar cursos.</p>`;
    console.error(err);
  }
});

// função para remover curso
async function removerCurso(slug) {
  if (!confirm("Tem certeza que deseja remover este curso?")) return;

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado!");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/cursos/${slug}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (res.ok) {
      alert("Curso removido com sucesso!");
      location.reload();
    } else {
      alert("Erro ao remover curso: " + (data.erro || "Erro desconhecido"));
    }
  } catch (error) {
    console.error("Erro ao remover curso:", error);
    alert("Erro ao remover curso.");
  }
}

async function removerCurso(slug) {
  if (!confirm("Tem certeza que deseja remover este curso?")) return;

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado!");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/cursos/${slug}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      alert("Curso removido com sucesso!");
      location.reload();
    } else {
      alert("Erro ao remover curso: " + (data.erro || "Erro desconhecido"));
    }
  } catch (error) {
    console.error("Erro na requisição de remoção:", error);
    alert("Erro ao remover curso.");
  }
}


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

