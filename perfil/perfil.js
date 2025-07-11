// afonso
const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/perfil', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(user => {
      document.getElementById('nameDisplay').innerText = user.nome;
      document.getElementById('emailDisplay').innerText = user.email;
      document.getElementById('phoneDisplay').innerText = user.telefone;
      document.getElementById('roleDisplay').innerText = user.tipo_usuario;
    })
    .catch(err => console.error("Falha ao carregar perfil:", err));

    const user = {
      nome: "",
      papel: "",
      cidade: "",
      email: "",
      telefone: "",
      cursosFavoritos: ["Front-End Web", "Lógica de Programação", "Python Básico"],
    };
    
    function atualizarUserNoFrontend(userData) {
      user.nome = userData.nome || "";
      user.email = userData.email || "";
      user.telefone = userData.telefone || "";
      user.papel = userData.tipo_usuario || "";
      user.cidade = userData.cidade || "";
      user.cursosFavoritos = userData.cursosFavoritos || user.cursosFavoritos;
    
      mostrarDados();  // Atualiza a UI com o objeto user atualizado
    }
    
    if (token) {
      fetch('http://localhost:3000/api/perfil', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Falha na autenticação');
        return res.json();
      })
      .then(userData => {
        atualizarUserNoFrontend(userData);
      })
      .catch(err => {
        console.error("Falha ao carregar perfil:", err);
        mostrarDados();  // mostra dados padrão
      });
    } else {
      // Sem token, mostra dados padrão
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
        user[field === "role" ? "papel" : field === "location" ? "cidade" : field] = input.value;
        display.textContent = input.value;
        input.style.display = "none";
        display.style.display = "inline";
      });
  
      const novosCursos = courseInput.value.split("\n").map((c) => c.trim()).filter((c) => c);
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



  