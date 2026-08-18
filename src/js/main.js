/* =========================================================
   Lara Café Advocacia — comportamento do site
   JavaScript puro, sem dependências.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. Entrada suave das seções ---------- */

  function iniciarRevelacao() {
    var alvos = document.querySelectorAll('[data-revelar]');
    if (!alvos.length) return;

    // Sem IntersectionObserver (navegador antigo), mostra tudo de uma vez.
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < alvos.length; i++) alvos[i].classList.add('visivel');
      return;
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visivel');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    alvos.forEach(function (el) { observador.observe(el); });

    // O que já está visível no primeiro quadro entra imediatamente,
    // sem esperar o usuário rolar.
    requestAnimationFrame(function () {
      alvos.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
          el.classList.add('visivel');
        }
      });
    });

    // Rede de segurança: se algo impedir o observador de disparar,
    // o conteúdo nunca fica invisível para sempre.
    setTimeout(function () {
      alvos.forEach(function (el) { el.classList.add('visivel'); });
    }, 4000);
  }

  /* ---------- 2. Menu do celular ---------- */

  function iniciarMenu() {
    var botao = document.querySelector('[data-menu-botao]');
    var menu = document.querySelector('[data-menu]');
    if (!botao || !menu) return;

    function fechar() {
      menu.setAttribute('data-aberto', 'false');
      botao.setAttribute('aria-expanded', 'false');
    }
    function alternar() {
      var aberto = botao.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('data-aberto', aberto ? 'false' : 'true');
      botao.setAttribute('aria-expanded', aberto ? 'false' : 'true');
    }

    botao.addEventListener('click', alternar);

    // Fecha ao escolher um item
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) fechar();
    });

    // Fecha com Esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fechar();
    });

    // Fecha ao clicar fora
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && !botao.contains(e.target)) fechar();
    });

    // Ao voltar para desktop, garante estado limpo
    window.addEventListener('resize', function () {
      if (window.innerWidth > 880) fechar();
    });
  }

  /* ---------- 3. Filtro de categorias do blog ---------- */

  function iniciarFiltros() {
    var filtros = document.querySelectorAll('[data-filtro]');
    var artigos = document.querySelectorAll('[data-categoria]');
    var vazio = document.querySelector('[data-sem-resultados]');
    if (!filtros.length || !artigos.length) return;

    function aplicar(categoria) {
      var visiveis = 0;
      artigos.forEach(function (artigo) {
        var combina = categoria === 'Todos' || artigo.getAttribute('data-categoria') === categoria;
        artigo.hidden = !combina;
        if (combina) visiveis++;
      });
      filtros.forEach(function (f) {
        f.setAttribute('aria-pressed', String(f.getAttribute('data-filtro') === categoria));
      });
      if (vazio) vazio.hidden = visiveis > 0;

      // Mantém a categoria escolhida na URL, para poder compartilhar o link.
      var url = new URL(window.location.href);
      if (categoria === 'Todos') url.searchParams.delete('categoria');
      else url.searchParams.set('categoria', categoria);
      history.replaceState(null, '', url);
    }

    filtros.forEach(function (f) {
      f.addEventListener('click', function () {
        aplicar(f.getAttribute('data-filtro'));
      });
    });

    // Respeita ?categoria=... ao abrir a página
    var inicial = new URL(window.location.href).searchParams.get('categoria');
    var valida = Array.prototype.some.call(filtros, function (f) {
      return f.getAttribute('data-filtro') === inicial;
    });
    if (inicial && valida) aplicar(inicial);
  }

  /* ---------- 4. Sombra do cabeçalho ao rolar ---------- */

  function iniciarCabecalho() {
    var cabecalho = document.querySelector('[data-cabecalho]');
    if (!cabecalho) return;

    function aoRolar() {
      cabecalho.setAttribute('data-rolado', String(window.scrollY > 24));
    }
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
  }

  /* ---------- 5. Ano corrente no rodapé ---------- */

  function iniciarAno() {
    var ano = String(new Date().getFullYear());
    document.querySelectorAll('[data-ano]').forEach(function (el) { el.textContent = ano; });
  }

  /* ---------- Partida ---------- */

  function iniciar() {
    iniciarRevelacao();
    iniciarMenu();
    iniciarFiltros();
    iniciarCabecalho();
    iniciarAno();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
