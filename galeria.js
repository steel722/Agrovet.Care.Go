// ============================================================
//  Galería pública — lee las fotos que el cliente sube en admin.html
//  (guardadas en el navegador de ese dispositivo)
//  Uso: <div id="galeria-grid" data-categoria="ave,exotico"></div>
//       <p id="galeria-msg"></p>
//  En modo edición (admin) permite borrar fotos con 🗑.
// ============================================================
(function () {
  var grid = document.getElementById("galeria-grid");
  var msg = document.getElementById("galeria-msg");
  if (!grid) return;

  var filtro = grid.dataset.categoria ? grid.dataset.categoria.split(",") : null;
  var ES_ADMIN = false;
  try { ES_ADMIN = localStorage.getItem("agrovet_admin") === "1"; } catch (e) {}

  function esc(t) {
    return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function leer() {
    try { return JSON.parse(localStorage.getItem("agrovet_fotos") || "[]"); }
    catch (e) { return []; }
  }

  function pintar() {
    var fotos = leer().filter(function (f) {
      return !filtro || filtro.indexOf(f.categoria) !== -1;
    }).sort(function (a, b) { return b.fecha - a.fecha; }).slice(0, 30);

    if (!fotos.length) {
      if (msg) { msg.style.display = "block"; msg.textContent = "Aún no hay fotos. ¡Vuelve pronto!"; }
      grid.innerHTML = "";
      return;
    }
    if (msg) msg.style.display = "none";
    grid.innerHTML = fotos.map(function (f) {
      return (
        '<div class="foto-card" data-id="' + f.id + '">' +
          '<img src="' + f.url + '" alt="' + esc(f.nombre || "Animal") + '" loading="lazy">' +
          '<div class="foto-body"><h4>' + esc(f.nombre || "Sin nombre") + "</h4>" +
          (f.descripcion ? "<p>" + esc(f.descripcion) + "</p>" : "") +
          "</div></div>"
      );
    }).join("");

    if (ES_ADMIN) {
      grid.querySelectorAll(".foto-card").forEach(function (card) {
        var id = +card.dataset.id;
        card.style.position = "relative";
        var b = document.createElement("button");
        b.className = "btn-del-foto";
        b.textContent = "×";
        b.title = "Eliminar foto";
        b.type = "button";
        b.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          if (!confirm("¿Eliminar esta foto?")) return;
          try {
            localStorage.setItem("agrovet_fotos", JSON.stringify(leer().filter(function (x) { return x.id !== id; })));
          } catch (e) {}
          pintar();
        });
        card.appendChild(b);
      });
    }
  }

  pintar();
})();
