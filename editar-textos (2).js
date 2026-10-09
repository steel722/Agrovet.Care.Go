// ============================================================
//  MODO EDICIÓN COMPLETO — sin servidor
//  Tras iniciar sesión en admin.html, toda la web carga en modo
//  edición: toca cualquier texto para cambiarlo, toca 📷 sobre
//  cualquier foto para cambiarla, y 🗑 para borrar fotos de la
//  galería. Todo se guarda en el navegador de ese dispositivo.
// ============================================================
(function () {
  var PAGE = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var LS_TXT = "agrovet_textos";
  var LS_IMG = "agrovet_imgs";
  var YA = {};

  var SELECTOR = "h1, h2, h3, .lead, .section-sub, .gate-sub, .card p, .check p, .check strong, .contact-box p, .bird p, .bird .sci, .bird .price, .foto-body p, .foto-body h4, .intro-tag, .badges span";

  function leer(k) { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; } }
  function guardar(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }
  function esAdmin() { try { return localStorage.getItem("agrovet_admin") === "1"; } catch (e) { return false; } }

  function procesarImagen(file, cb, max) {
    var img = new Image();
    img.onload = function () {
      var MAX = max || 1400, w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      var c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(c.toDataURL("image/jpeg", 0.82));
    };
    img.src = URL.createObjectURL(file);
  }

  var inputImg = null, fotoKeyActual = null;
  function elegirImagen(key) {
    if (!inputImg) {
      inputImg = document.createElement("input");
      inputImg.type = "file"; inputImg.accept = "image/*"; inputImg.style.display = "none";
      document.body.appendChild(inputImg);
      inputImg.addEventListener("change", function () {
        var f = inputImg.files[0]; inputImg.value = "";
        if (!f || !fotoKeyActual) return;
        procesarImagen(f, function (dataUrl) {
          var m = leer(LS_IMG); m[fotoKeyActual] = dataUrl; guardar(LS_IMG, m);
          document.querySelectorAll('img[data-foto="' + fotoKeyActual + '"]').forEach(function (im) { im.src = dataUrl; });
        });
      });
    }
    fotoKeyActual = key; inputImg.click();
  }

  function initImagenes(admin) {
    var imgs = leer(LS_IMG);
    document.querySelectorAll("img[data-foto]").forEach(function (img) {
      var k = img.getAttribute("data-foto");
      if (imgs[k] && img.src !== imgs[k]) img.src = imgs[k];
      if (!admin || img.dataset.imgEd) return;
      img.dataset.imgEd = "1";
      var wrap = document.createElement("div");
      wrap.className = "ed-img-wrap";
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      var btn = document.createElement("button");
      btn.className = "btn-foto";
      btn.textContent = "📷";
      btn.title = "Cambiar imagen";
      btn.type = "button";
      btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); elegirImagen(k); });
      wrap.appendChild(btn);
    });
  }

  function initTextos(admin) {
    var textos = leer(LS_TXT), vistos = {};
    document.querySelectorAll(SELECTOR).forEach(function (el) {
      if (el.closest("#intro")) return;
      if (el.querySelector("a,button,summary,input,select,textarea")) return;
      if (!admin && el.closest("a")) return;
      var base = PAGE + "|" + el.tagName + "|" + el.textContent.trim().replace(/\s+/g, " ").slice(0, 40);
      var n = vistos[base] || 0;
      vistos[base] = n + 1;
      var k = base + "|" + n;
      if (YA[k]) return;
      YA[k] = true;
      if (textos[k] != null && textos[k] !== el.innerHTML) el.innerHTML = textos[k];
      if (!admin) return;
      el.setAttribute("data-ed", "");
      el.contentEditable = "true";
      el.spellcheck = false;
      el.addEventListener("blur", function () {
        var t = leer(LS_TXT); t[k] = el.innerHTML; guardar(LS_TXT, t);
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); el.blur(); }
      });
      el.addEventListener("paste", function (e) {
        e.preventDefault();
        var txt = (e.clipboardData || window.clipboardData).getData("text/plain");
        document.execCommand("insertText", false, txt);
      });
    });
  }

  function initBarra(admin) {
    if (!admin || document.getElementById("ed-toolbar")) return;
    // en modo edición los enlaces no navegan (estás editando, no visitando)
    document.querySelectorAll("a").forEach(function (a) {
      if (a.dataset.edlink) return; a.dataset.edlink = "1";
      a.addEventListener("click", function (e) { e.preventDefault(); }, true);
    });
    var css = document.createElement("style");
    css.textContent =
      "[data-ed]{outline:2px dashed #B99B5F;outline-offset:4px;cursor:text}" +
      "[data-ed]:focus{outline-style:solid;outline-color:#7A8B6F}" +
      ".ed-img-wrap{position:relative;display:block}" +
      ".btn-del-foto{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;border:none;background:rgba(179,38,30,.92);color:#fff;font-size:1.1rem;cursor:pointer;z-index:5}" +
      "#ed-toolbar{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#102E1E;color:#fff;display:flex;justify-content:space-between;align-items:center;padding:10px 18px;font-size:.9rem;box-shadow:0 -4px 18px rgba(0,0,0,.25)}" +
      "#ed-salir{background:#B99B5F;border:none;color:#102E1E;font-weight:700;padding:8px 20px;border-radius:20px;cursor:pointer;font-family:inherit}" +
      "body{padding-bottom:58px}";
    document.head.appendChild(css);
    var bar = document.createElement("div");
    bar.id = "ed-toolbar";
    bar.innerHTML = "<span>✏️ <b>Modo edición</b> — toca textos y fotos para cambiarlos</span>";
    var salir = document.createElement("button");
    salir.id = "ed-salir";
    salir.textContent = "Cerrar sesión";
    salir.addEventListener("click", function () {
      try { localStorage.removeItem("agrovet_admin"); } catch (e) {}
      location.reload();
    });
    bar.appendChild(salir);
    document.body.appendChild(bar);
  }

  function init() {
    var admin = esAdmin();
    initImagenes(admin);
    initTextos(admin);
    initBarra(admin);
  }

  window.initEdicionTextos = init;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
