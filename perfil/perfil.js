const user = {
    nome: "Nome",
    papel: "Aluno",
    cidade: "Cidade",
    email: "Email",
    telefone: "(00) 00000-0000",
    cursosFavoritos: ["Nenhum curso"],
  };

  const nameDisplay = document.getElementById('nameDisplay');
  const nameInput = document.getElementById('nameInput');
  const roleDisplay = document.getElementById('roleDisplay');
  const roleInput = document.getElementById('roleInput');
  const locationDisplay = document.getElementById('locationDisplay');
  const locationInput = document.getElementById('locationInput');
  const emailDisplay = document.getElementById('emailDisplay');
  const emailInput = document.getElementById('emailInput');
  const phoneDisplay = document.getElementById('phoneDisplay');
  const phoneInput = document.getElementById('phoneInput');
  const courseList = document.getElementById('courseList');
  const courseInput = document.getElementById('courseInput');
  const saveBtn = document.getElementById('saveBtn');
  const favBtn = document.getElementById('favBtn');
  const tooltipFav = document.getElementById('tooltipFav');
  const closeTooltip = document.getElementById('closeTooltip');

  function mostrarDados() {
    nameDisplay.textContent = user.nome;
    nameInput.value = user.nome;

    roleDisplay.textContent = user.papel;
    roleInput.value = user.papel;

    locationDisplay.textContent = user.cidade;
    locationInput.value = user.cidade;

    emailDisplay.textContent = user.email;
    emailInput.value = user.email;

    phoneDisplay.textContent = user.telefone;
    phoneInput.value = user.telefone;

    roleDisplay.textContent = user.tipo_usuario;
    roleInput.value = user.tipo_usuario;

    courseList.innerHTML = "";
    user.cursosFavoritos.forEach((curso) => {
      const li = document.createElement("li");
      li.textContent = curso;
      courseList.appendChild(li);
    });

    courseInput.value = user.cursosFavoritos.join("\n");
  }

  function atualizarUserNoFrontend(userData) {
    user.nome = userData.nome || user.nome;
    user.email = userData.email || user.email;
    user.telefone = userData.telefone || user.telefone;
    user.tipo_usuario = userData.tipo_usuario || user.tipo_usuario;
    user.cidade = userData.cidade || user.cidade;
    user.cursosFavoritos = userData.cursosFavoritos || user.cursosFavoritos;

    mostrarDados();
  }

  // 🟡 Sempre tenta carregar perfil (com token, se houver)
  const token = localStorage.getItem('token');

  if (token) {
    fetch('http://localhost:3000/api/perfil', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error("Token inválido ou dados não encontrados");
      return res.json();
    })
    .then(userData => {
      atualizarUserNoFrontend(userData);
    })
    .catch(err => {
      console.warn("Carregando perfil genérico (erro:", err.message, ")");
      mostrarDados();
    });
  } else {
    // Sem token: mostra dados genéricos
    mostrarDados();
  }

  function toggleEdit() {
    const fields = ["name", "role", "location", "email", "phone"];

    fields.forEach((field) => {
      document.getElementById(field + "Display").style.display = "none";
      document.getElementById(field + "Input").style.display = "inline-block";
    });

    courseList.style.display = "none";
    courseInput.style.display = "block";
    saveBtn.style.display = "inline-block";

    saveBtn.onclick = function () {
      fields.forEach((field) => {
        const input = document.getElementById(field + "Input");
        const display = document.getElementById(field + "Display");
        const newValue = input.value.trim() || user[field];
        user[field === "role" ? "tipo_usuario" : field === "location" ? "cidade" : field] = newValue;
        display.textContent = newValue;
        input.style.display = "none";
        display.style.display = "inline";
      });

      const novosCursos = courseInput.value.split("\n").map(c => c.trim()).filter(c => c);
      user.cursosFavoritos = novosCursos;

      courseList.innerHTML = "";
      novosCursos.forEach((curso) => {
        const li = document.createElement("li");
        li.textContent = curso;
        courseList.appendChild(li);
      });

      courseInput.style.display = "none";
      courseList.style.display = "block";
      saveBtn.style.display = "none";
      tooltipFav.classList.remove("show");
    };
  }

  favBtn.addEventListener("click", () => {
    tooltipFav.classList.toggle("show");
  });

  closeTooltip.addEventListener("click", () => {
    tooltipFav.classList.remove("show");
  });

  document.addEventListener("click", (event) => {
    if (!tooltipFav.contains(event.target) && event.target !== favBtn) {
      tooltipFav.classList.remove("show");
    }
  });

  const toggleBtn = document.getElementById('toggleBtn');
  const sidebar = document.getElementById('sidebar');
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('expanded');
  });
