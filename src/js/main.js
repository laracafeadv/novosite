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

  /* ---------- 4. Formulário de contato ---------- */

  function iniciarFormulario() {
    var form = document.querySelector('[data-formulario-contato]');
    if (!form) return;

    var retorno = form.querySelector('[data-retorno]');
    var botao = form.querySelector('button[type="submit"]');
    var textoOriginal = botao ? botao.textContent : '';

    function avisar(mensagem, tipo) {
      if (!retorno) return;
      retorno.textContent = mensagem;
      retorno.className = 'retorno retorno--' + tipo;
      retorno.hidden = false;
    }

    // Monta a mensagem que segue para o WhatsApp quando o site
    // não está num host que processa formulários.
    function montarMensagem(dados) {
      return (
        'Olá, Lara! Vim pelo site.\n\n' +
        'Nome: ' + (dados.get('nome') || '') + '\n' +
        'Contato: ' + (dados.get('contato') || '') + '\n\n' +
        (dados.get('mensagem') || '')
      );
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Armadilha anti-spam: se estiver preenchida, foi um robô.
      // Fingimos sucesso e não enviamos nada.
      if (form.querySelector('[name="empresa"]') && form.querySelector('[name="empresa"]').value) {
        avisar('Mensagem enviada. Obrigada!', 'ok');
        return;
      }

      var dados = new FormData(form);
      var zap = form.getAttribute('data-whatsapp');

      if (botao) { botao.disabled = true; botao.textContent = 'Enviando…'; }

      function liberarBotao() {
        if (botao) { botao.disabled = false; botao.textContent = textoOriginal; }
      }

      // Caminho de reserva: abre o WhatsApp com a mensagem pronta.
      function irParaWhatsApp() {
        liberarBotao();
        if (zap) {
          window.open(zap + '?text=' + encodeURIComponent(montarMensagem(dados)), '_blank', 'noopener');
          avisar('Abrimos o WhatsApp com a sua mensagem pronta — é só tocar em enviar.', 'ok');
        } else {
          avisar('Não foi possível enviar agora. Por favor, fale pelo WhatsApp ou e-mail acima.', 'erro');
        }
      }

      // Só tentamos enviar ao servidor onde isso de fato existe.
      // Num host que serve apenas arquivos, um POST pode responder 200
      // sem processar nada — e o site diria "enviado" sem ter enviado.
      if (form.getAttribute('data-envio') !== 'servidor') {
        irParaWhatsApp();
        return;
      }

      fetch(form.getAttribute('action') || '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(dados).toString()
      })
        .then(function (resposta) {
          if (!resposta.ok) throw new Error('host não processou o formulário');
          liberarBotao();
          form.reset();
          avisar('Mensagem enviada. Obrigada — em breve entrarei em contato.', 'ok');
        })
        .catch(irParaWhatsApp);
    });
  }

  /* ---------- 5. Sombra do cabeçalho ao rolar ---------- */

  function iniciarCabecalho() {
    var cabecalho = document.querySelector('[data-cabecalho]');
    if (!cabecalho) return;

    function aoRolar() {
      cabecalho.setAttribute('data-rolado', String(window.scrollY > 24));
    }
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
  }

  /* ---------- 6. Ano corrente no rodapé ---------- */

  function iniciarAno() {
    var ano = String(new Date().getFullYear());
    document.querySelectorAll('[data-ano]').forEach(function (el) { el.textContent = ano; });
  }

  /* ---------- Partida ---------- */

  function iniciar() {
    iniciarRevelacao();
    iniciarMenu();
    iniciarFiltros();
    iniciarFormulario();
    iniciarCabecalho();
    iniciarAno();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
