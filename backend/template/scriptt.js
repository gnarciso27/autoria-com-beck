const toggleBtn = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('expanded');
  });
const slug = window.location.pathname.split('/')[2];

document.getElementById('adicionarCapituloBtn').addEventListener('click', () => {
  const titulo = prompt("Digite o nome do novo capítulo:");
  if (!titulo) return;

  fetch(`http://localhost:3000/api/cursos/${slug}/adicionar-capitulo-exercicio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.mensagem || "Capítulo criado!");
      location.reload();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao criar capítulo");
    });
});

document.getElementById('adicionarCapituloVideoBtn').addEventListener('click', () => {
  const titulo = prompt("Digite o nome do novo capítulo de vídeo:");
  if (!titulo) return;

  fetch(`http://localhost:3000/api/cursos/${slug}/adicionar-capitulo-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.mensagem || "Capítulo de vídeo criado!");
      location.reload();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao criar capítulo de vídeo");
    });
});

document.addEventListener('submit', function (e) {
  if (e.target.classList.contains('upload-form')) {
    e.preventDefault();

    const form = e.target;
    const capituloIndex = form.dataset.capituloIndex;

    const formData = new FormData(form);

    fetch(`http://localhost:3000/api/cursos/${slug}/capitulo-exercicio/${capituloIndex}/upload`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        alert(data.mensagem || "Exercício enviado!");
        location.reload();
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao enviar exercício");
      });
  }
});

function carregarCapitulos() {
  fetch(`http://localhost:3000/api/cursos/${slug}`)
    .then(res => res.json())
    .then(curso => {
      const accordionEx = document.getElementById('accordionExercicios');
      accordionEx.innerHTML = '';

      curso.capitulosExercicios?.forEach((cap, i) => {
        accordionEx.innerHTML += `
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingEx${i}">
              <button class="accordion-button ${i !== 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse"
                data-bs-target="#collapseEx${i}" aria-expanded="${i === 0}" aria-controls="collapseEx${i}">
                ${cap.titulo}
              </button>
            </h2>
            <div id="collapseEx${i}" class="accordion-collapse collapse ${i === 0 ? 'show' : ''}" aria-labelledby="headingEx${i}" data-bs-parent="#accordionExercicios">
              <div class="accordion-body">
                <ul>
                  ${(cap.exercicios || []).map(e => `<li><a href="${e}" target="_blank">${e.split('/').pop()}</a></li>`).join('') || '<li>Nenhum exercício</li>'}
                </ul>
                <form class="upload-form" data-capitulo-index="${i}" enctype="multipart/form-data">
                  <input type="file" name="arquivo" accept="application/pdf" required />
                  <button type="submit" class="btn btn-roxo btn-sm mt-2">Enviar Exercício (PDF)</button>
                </form>
              </div>
            </div>
          </div>`;
      });

      const accordionVid = document.getElementById('accordionVideos');
      accordionVid.innerHTML = '';

      curso.capitulosVideos?.forEach((cap, i) => {
        const videosHTML = (cap.videos || []).map(v => {
          const videoId = v.includes('v=') ? v.split('v=')[1].split('&')[0] : v.split('/').pop();
          return `
            <div class="video-wrapper mb-3" data-video-id="${videoId}">
              <div class="video-title text-primary" style="cursor:pointer;">▶ Assistir vídeo</div>
              <div class="video-thumbnail" style="cursor:pointer;">
                <img src="https://img.youtube.com/vi/${videoId}/0.jpg" width="100%" />
              </div>
            </div>`;
        }).join('');

        accordionVid.innerHTML += `
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingVid${i}">
              <button class="accordion-button ${i !== 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse"
                data-bs-target="#collapseVid${i}" aria-expanded="${i === 0}" aria-controls="collapseVid${i}">
                ${cap.titulo}
              </button>
            </h2>
            <div id="collapseVid${i}" class="accordion-collapse collapse ${i === 0 ? 'show' : ''}" aria-labelledby="headingVid${i}" data-bs-parent="#accordionVideos">
              <div class="accordion-body">
                <div class="video-list">${videosHTML || '<p>Nenhum vídeo</p>'}</div>
                <button class="btn btn-roxo btn-sm mt-2 adicionar-video-btn" data-capitulo-index="${i}">Adicionar Vídeo</button>
              </div>
            </div>
          </div>`;
      });

      setTimeout(() => {
        document.querySelectorAll('.adicionar-video-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = btn.dataset.capituloIndex;
            const url = prompt("Cole o link do vídeo do YouTube:");

            if (!url || !url.includes("youtube.com")) {
              alert("URL inválida!");
              return;
            }

            fetch(`http://localhost:3000/api/cursos/${slug}/capitulo-video/${index}/adicionar-video`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url })
            })
              .then(res => res.json())
              .then(data => {
                alert(data.mensagem || "Vídeo adicionado!");
                location.reload();
              })
              .catch(err => {
                console.error(err);
                alert("Erro ao adicionar vídeo");
              });
          });
        });

        document.querySelectorAll('.video-wrapper').forEach(wrapper => {
          const videoId = wrapper.getAttribute('data-video-id');
          const title = wrapper.querySelector('.video-title');
          const thumb = wrapper.querySelector('.video-thumbnail');

          const loadVideo = () => {
            wrapper.innerHTML = `
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}?autoplay=1"
                frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
          };

          title.addEventListener('click', loadVideo);
          thumb.addEventListener('click', loadVideo);
        });

      }, 0);
    })
    .catch(err => {
      console.error("Erro ao carregar curso:", err);
    });
}

document.addEventListener('DOMContentLoaded', carregarCapitulos);