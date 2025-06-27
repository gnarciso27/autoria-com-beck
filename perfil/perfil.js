const user = {
    nome: "Lucas Almeida",
    papel: "Aluno",
    cidade: "Fortaleza, CE",
    email: "lucas.almeida@email.com",
    telefone: "(85) 98888-7777",
    cursosFavoritos: ["Front-End Web", "Lógica de Programação", "Python Básico"],
  };
  
  const saveBtn = document.getElementById("saveBtn");
  const favBtn = document.getElementById("favBtn");
  const tooltipFav = document.getElementById("tooltipFav");
  const courseList = document.getElementById("courseList");
  const courseInput = document.getElementById("courseInput");
  const closeTooltip = document.getElementById("closeTooltip");
  
  function mostrarDados() {
    document.getElementById("nameDisplay").textContent = user.nome;
    document.getElementById("roleDisplay").textContent = user.papel;
    document.getElementById("locationDisplay").textContent = user.cidade;
    document.getElementById("emailDisplay").textContent = user.email;
    document.getElementById("phoneDisplay").textContent = user.telefone;
  
    document.getElementById("nameInput").value = user.nome;
    document.getElementById("roleInput").value = user.papel;
    document.getElementById("locationInput").value = user.cidade;
    document.getElementById("emailInput").value = user.email;
    document.getElementById("phoneInput").value = user.telefone;
  
    courseList.innerHTML = "";
    courseInput.value = user.cursosFavoritos.join("\n");
  
    user.cursosFavoritos.forEach((curso) => {
      const li = document.createElement("li");
      li.textContent = curso;
      courseList.appendChild(li);
    });
  }
  
  mostrarDados();
  
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
  