/* =========================================================
   Gerador do site — Lara Café Advocacia
   ---------------------------------------------------------
   Lê:   dados.json  +  conteudo/artigos/*.md  +  src/
   Gera: site/  (HTML puro, pronto para publicar)

   Uso:  node build.mjs
   ========================================================= */

import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { paraHtml, lerCabecalho, paraTextoSimples } from './lib/markdown.mjs';
import { gruposDeAtuacao } from './conteudo/atuacao.mjs';
import { termosDoGlossario } from './conteudo/glossario.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, 'src');
const SAIDA = join(AQUI, 'site');
const ARTIGOS = join(AQUI, 'conteudo', 'artigos');

const avisos = [];

/* ---------------------------------------------------------
   1. Dados
   --------------------------------------------------------- */

const dados = JSON.parse(readFileSync(join(AQUI, 'dados.json'), 'utf8'));

/** Um valor só conta como preenchido se não começar com PREENCHER. */
function ok(valor) {
  return typeof valor === 'string' && valor.trim() !== '' && !valor.trim().startsWith('PREENCHER');
}

const urlSite = ok(dados.site.url) ? dados.site.url.replace(/\/+$/, '') : '';
const temWhatsapp = ok(dados.contato.whatsapp);
const zapBase = temWhatsapp ? 'https://wa.me/' + dados.contato.whatsapp.replace(/\D/g, '') : '';

if (!urlSite) avisos.push('site.url não preenchido — canonical, Open Graph e sitemap.xml ficaram de fora.');
if (!temWhatsapp) avisos.push('contato.whatsapp não preenchido — os botões apontam para o formulário.');
if (!ok(dados.contato.email)) avisos.push('contato.email não preenchido.');

const ANO = String(new Date().getFullYear());

/* ---------------------------------------------------------
   2. Artigos
   --------------------------------------------------------- */

function carregarArtigos() {
  if (!existsSync(ARTIGOS)) return [];

  return readdirSync(ARTIGOS)
    .filter((n) => n.endsWith('.md'))
    .map((nome) => {
      const bruto = readFileSync(join(ARTIGOS, nome), 'utf8');
      const { dados: meta, corpo } = lerCabecalho(bruto);
      const slug = nome.replace(/\.md$/, '');

      const publicado = /^(sim|true|yes|1)$/i.test(meta.publicado || '');
      // "data" era o nome antigo; colidia com uma chave interna do painel.
      const dataArtigo = meta.data_publicacao || meta.data || '';
      const texto = corpo.trim();

      // O primeiro parágrafo vira a abertura em itálico; o resto, o corpo.
      const blocos = texto.replace(/<!--[\s\S]*?-->/g, '').trim().split(/\n\s*\n/);
      const abertura = blocos.length && !blocos[0].startsWith('#') ? blocos.shift().trim() : '';
      const restante = blocos.join('\n\n');

      if (publicado && !abertura) {
        avisos.push(`Artigo "${slug}" está publicado mas não tem parágrafo de abertura.`);
      }

      return {
        slug,
        titulo: meta.titulo || slug,
        categoria: meta.categoria || 'Geral',
        etiqueta: (meta.categoria || 'Geral').toUpperCase(),
        resumo: meta.resumo || '',
        data: dataArtigo,
        dataExibicao: formatarData(dataArtigo),
        leitura: meta.leitura || '',
        imagem: normalizarImagem(meta.imagem),
        publicado,
        abertura,
        corpoHtml: paraHtml(restante),
        textoSimples: paraTextoSimples(texto),
      };
    })
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
}

/**
 * Aceita tanto "capa.jpg" (escrito à mão) quanto "/assets/capa.jpg"
 * (como o painel /admin grava) e devolve sempre só o nome do arquivo.
 */
function normalizarImagem(valor) {
  if (!ok(valor)) return '';
  return valor.trim()
    .replace(/^\/+/, '')
    .replace(/^(src\/)?assets\//, '');
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatarData(iso) {
  const m = /^(\d{4})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  return `${MESES[Number(m[2]) - 1]} de ${m[1]}`;
}

const artigos = carregarArtigos();
const publicados = artigos.filter((a) => a.publicado);

/* ---------------------------------------------------------
   3. Montagem de HTML
   --------------------------------------------------------- */

function escapar(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Substitui todos os {{ marcadores }} de um modelo. */
function preencher(modelo, valores) {
  return modelo.replace(/\{\{\s*([\w]+)\s*\}\}/g, (inteiro, chave) =>
    Object.prototype.hasOwnProperty.call(valores, chave) ? valores[chave] : inteiro
  );
}

function lerModelo(...caminho) {
  return readFileSync(join(SRC, ...caminho), 'utf8');
}

/** Contexto de caminhos e links de uma página. */
function contexto({ subpasta = false, mensagem = 'home', paginaBlog = false, paginaInterna = false } = {}) {
  const raiz = subpasta ? '../' : '';
  const ehHome = !subpasta && !paginaBlog && !paginaInterna;
  const texto = dados.mensagensWhatsapp[mensagem] || dados.mensagensWhatsapp.home;

  return {
    raiz,
    inicio: ehHome ? '#home' : raiz + 'index.html',
    ancora: ehHome ? '' : raiz + 'index.html',
    blogAtual: paginaBlog ? ' aria-current="page"' : '',
    zap: temWhatsapp ? zapBase + '?text=' + encodeURIComponent(texto) : (ehHome ? '' : raiz + 'index.html') + '#contato',
    zapAlvo: temWhatsapp ? ' target="_blank" rel="noopener"' : '',
    zapBase,
    ano: ANO,
    nome: escapar(dados.site.nome),
    advogada: escapar(dados.site.advogada),
    oabRodape: ok(dados.contato.oab) ? ' · ' + escapar(dados.contato.oab) : '',
    zapFlutuante: '', // preenchido logo abaixo, precisa do zap já montado
  };
}

const ICONE_ZAP_GRANDE = '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16.004 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.258.594 4.428 1.72 6.352L3.2 28.8l6.61-1.686a12.74 12.74 0 0 0 6.194 1.586h.006c7.07 0 12.8-5.73 12.8-12.8s-5.73-12.7-12.806-12.7Zm0 23.36a10.5 10.5 0 0 1-5.362-1.47l-.384-.228-3.92 1.002 1.048-3.822-.25-.394a10.478 10.478 0 0 1-1.612-5.646c0-5.804 4.722-10.526 10.53-10.526 2.812 0 5.456 1.098 7.444 3.088a10.457 10.457 0 0 1 3.082 7.446c0 5.804-4.722 10.55-10.576 10.55Zm5.77-7.892c-.316-.158-1.87-.922-2.16-1.028-.29-.106-.502-.158-.714.158-.21.316-.818 1.028-1.004 1.24-.184.21-.37.238-.686.08-.316-.158-1.334-.492-2.542-1.57-.94-.838-1.574-1.872-1.758-2.188-.184-.316-.02-.487.138-.644.142-.14.316-.37.474-.554.158-.184.21-.316.316-.526.106-.21.052-.396-.026-.554-.078-.158-.714-1.72-.978-2.356-.258-.618-.52-.534-.714-.544l-.608-.01c-.21 0-.554.078-.844.396-.29.316-1.106 1.08-1.106 2.634 0 1.554 1.132 3.056 1.29 3.266.158.21 2.228 3.402 5.398 4.77.754.326 1.342.52 1.802.664.758.242 1.446.208 1.992.126.608-.09 1.87-.764 2.134-1.502.264-.738.264-1.37.184-1.502-.078-.132-.29-.21-.606-.368Z"/></svg>';

function botaoFlutuante(ctx) {
  return `<a class="zap-flutuante" href="${ctx.zap}"${ctx.zapAlvo} aria-label="Conversar no WhatsApp">
  ${ICONE_ZAP_GRANDE}
</a>`;
}

/** Capa padrão para artigo que ainda não tem imagem própria. */
const CAPA_PADRAO = 'capa-padrao.jpg';

function imagem(arquivo, alt, ctx, extra = '') {
  const nome = ok(arquivo) ? arquivo : CAPA_PADRAO;
  return `<img src="${ctx.raiz}assets/${nome}" alt="${escapar(alt)}"${extra} />`;
}

/** Cartão de artigo — vira link só quando o artigo tem conteúdo. */
function cartao(artigo, ctx) {
  const destino = `${ctx.raiz}artigos/${artigo.slug}.html`;
  const capa = imagem(artigo.imagem, artigo.titulo, ctx, ' loading="lazy" width="1100" height="1400"');

  const miolo = `
            <div class="cartao__veu" aria-hidden="true"></div>
            <span class="cartao__categoria">${escapar(artigo.etiqueta)}</span>`;

  const corpo = `
          <div class="cartao__corpo">
            <h3>${escapar(artigo.titulo)}</h3>
            <p class="cartao__resumo">${escapar(artigo.resumo)}</p>
            <p class="cartao__meta">${escapar(artigo.dataExibicao)}${artigo.leitura ? ' · ' + escapar(artigo.leitura) : ''}</p>
            ${artigo.publicado
              ? '<span class="link-risco cartao__ler">Leia mais</span>'
              : '<span class="etiqueta-em-breve">Em breve</span>'}
          </div>`;

  return artigo.publicado
    ? `        <a class="cartao" href="${destino}" data-categoria="${escapar(artigo.categoria)}">
          <span class="cartao__capa">${capa}${miolo}
          </span>${corpo}
        </a>`
    : `        <article class="cartao cartao--em-breve" data-categoria="${escapar(artigo.categoria)}" aria-label="${escapar(artigo.titulo)} — em breve">
          <span class="cartao__capa">${capa}${miolo}
          </span>${corpo}
        </article>`;
}

/** Índice de áreas de atuação — cada linha abre o WhatsApp já escrito. */
function gerarIndiceAtuacao(ctx) {
  let n = 0;

  return gruposDeAtuacao.map((grupo) => {
    const itens = grupo.itens.map((item) => {
      n += 1;
      const numero = String(n).padStart(2, '0');
      const mensagem = `Olá, Lara! Gostaria de falar sobre ${item.titulo.toLowerCase()}.`;
      const destino = temWhatsapp
        ? `${zapBase}?text=${encodeURIComponent(mensagem)}`
        : `${ctx.ancora}#contato`;

      return `              <li>
                <a href="${destino}"${ctx.zapAlvo}>
                  <span class="indice__esquerda">
                    <span class="indice__numero" aria-hidden="true">${numero}</span>
                    <span>
                      <span class="indice__titulo">${escapar(item.titulo)}</span>
                      <span class="indice__descricao">${escapar(item.descricao)}</span>
                    </span>
                  </span>
                  <svg class="indice__seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7M9 7h8v8"/></svg>
                </a>
              </li>`;
    }).join('\n');

    const descricao = grupo.descricao
      ? `\n            <p class="grupo-atuacao__descricao">${escapar(grupo.descricao)}</p>`
      : '';

    return `          <div class="grupo-atuacao">
            <p class="grupo-atuacao__rotulo">${escapar(grupo.rotulo)}</p>${descricao}
            <ul class="indice">
${itens}
            </ul>
          </div>`;
  }).join('\n');
}

/** Bloco <head>: título, descrição, redes sociais, ícones e dados estruturados. */
function cabecaMeta({ titulo, descricao, caminho = '', ctx, artigo = null }) {
  const partes = [];
  const desc = escapar(descricao.slice(0, 300));
  const enderecoCompleto = urlSite ? urlSite + '/' + caminho : '';

  partes.push(`<title>${escapar(titulo)}</title>`);
  partes.push(`<meta name="description" content="${desc}">`);
  partes.push(`<meta name="author" content="${escapar(dados.site.advogada)}">`);
  partes.push(`<meta name="robots" content="index, follow">`);
  partes.push(`<meta name="theme-color" content="#3b1f0e">`);

  if (enderecoCompleto) partes.push(`<link rel="canonical" href="${enderecoCompleto}">`);

  partes.push(`<link rel="icon" href="${ctx.raiz}favicon.svg" type="image/svg+xml">`);
  partes.push(`<link rel="icon" href="${ctx.raiz}assets/favicon-monograma.png" sizes="512x512">`);
  partes.push(`<link rel="apple-touch-icon" href="${ctx.raiz}assets/favicon-monograma.png">`);

  // Redes sociais
  partes.push(`<meta property="og:type" content="${artigo ? 'article' : 'website'}">`);
  partes.push(`<meta property="og:locale" content="pt_BR">`);
  partes.push(`<meta property="og:site_name" content="${escapar(dados.site.nome)}">`);
  partes.push(`<meta property="og:title" content="${escapar(titulo)}">`);
  partes.push(`<meta property="og:description" content="${desc}">`);
  if (enderecoCompleto) partes.push(`<meta property="og:url" content="${enderecoCompleto}">`);

  const temCartao = existsSync(join(SRC, 'assets', 'og.jpg'));
  if (temCartao && urlSite) {
    partes.push(`<meta property="og:image" content="${urlSite}/assets/og.jpg">`);
    partes.push(`<meta property="og:image:width" content="1200">`);
    partes.push(`<meta property="og:image:height" content="630">`);
    partes.push(`<meta name="twitter:card" content="summary_large_image">`);
  } else {
    partes.push(`<meta name="twitter:card" content="summary">`);
  }
  partes.push(`<meta name="twitter:title" content="${escapar(titulo)}">`);
  partes.push(`<meta name="twitter:description" content="${desc}">`);

  if (artigo) {
    partes.push(`<meta property="article:published_time" content="${artigo.data}">`);
    partes.push(`<meta property="article:section" content="${escapar(artigo.categoria)}">`);
  }

  // Dados estruturados — ajuda o Google a entender que é um escritório
  const estrutura = artigo
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: artigo.titulo,
        description: artigo.resumo,
        datePublished: artigo.data,
        inLanguage: 'pt-BR',
        author: { '@type': 'Person', name: dados.site.advogada },
        publisher: { '@type': 'Organization', name: dados.site.nome },
        ...(enderecoCompleto ? { mainEntityOfPage: enderecoCompleto } : {}),
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'LegalService',
        name: dados.site.nome,
        description: dados.site.descricao,
        areaServed: { '@type': 'Country', name: 'Brasil' },
        availableLanguage: 'Portuguese',
        knowsAbout: ['Direito de Família', 'Direito das Sucessões', 'Planejamento sucessório', 'Pacto antenupcial'],
        founder: { '@type': 'Person', name: dados.site.advogada, jobTitle: 'Advogada' },
        ...(urlSite ? { url: urlSite } : {}),
        ...(ok(dados.contato.email) ? { email: dados.contato.email } : {}),
        ...(temWhatsapp ? { telephone: '+' + dados.contato.whatsapp.replace(/\D/g, '') } : {}),
        ...(ok(dados.contato.instagramUrl) ? { sameAs: [dados.contato.instagramUrl] } : {}),
      };

  partes.push(`<script type="application/ld+json">${JSON.stringify(estrutura)}</script>`);

  return partes.join('\n');
}

/* ---------------------------------------------------------
   4. Geração das páginas
   --------------------------------------------------------- */

const ICONE_ZAP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/></svg>';
const ICONE_EMAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="m4 7 8 6 8-6"/></svg>';

/** Cartões de contato da seção "Fale comigo". */
function gerarCanais() {
  const blocos = [];

  if (temWhatsapp) {
    blocos.push(`            <a class="canal" href="${zapBase}?text=${encodeURIComponent(dados.mensagensWhatsapp.home)}" target="_blank" rel="noopener">
              <span class="canal__icone">${ICONE_ZAP}</span>
              <span>
                <span class="canal__rotulo">WhatsApp</span>
                <span class="canal__valor">${escapar(dados.contato.whatsappExibicao)}</span>
              </span>
            </a>`);
  }

  if (ok(dados.contato.email)) {
    blocos.push(`            <a class="canal" href="mailto:${dados.contato.email}">
              <span class="canal__icone">${ICONE_EMAIL}</span>
              <span>
                <span class="canal__rotulo">E-mail</span>
                <span class="canal__valor">${escapar(dados.contato.email)}</span>
              </span>
            </a>`);
  }

  return blocos.join('\n');
}

/** Lista de contatos do rodapé. */
function gerarRodapeContato() {
  const linhas = [];

  if (temWhatsapp) {
    linhas.push(`          <li><a href="${zapBase}?text=${encodeURIComponent(dados.mensagensWhatsapp.home)}" target="_blank" rel="noopener">WhatsApp: ${escapar(dados.contato.whatsappExibicao)}</a></li>`);
  }
  if (ok(dados.contato.email)) {
    linhas.push(`          <li><a href="mailto:${dados.contato.email}">${escapar(dados.contato.email)}</a></li>`);
  }

  return linhas.join('\n');
}

/** Coluna de redes sociais — só aparece se houver ao menos uma preenchida. */
function gerarRodapeRedes() {
  const redes = [];

  if (ok(dados.contato.instagramUrl)) {
    redes.push(`          <a class="rede" href="${dados.contato.instagramUrl}" target="_blank" rel="noopener" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>`);
  }

  if (!redes.length) return '';

  return `      <div>
        <h3>Redes Sociais</h3>
        <div class="redes">
${redes.join('\n')}
        </div>
      </div>`;
}

/** Cabeçalho e rodapé já preenchidos para o contexto da página. */
function parciais(ctx) {
  const valoresRodape = {
    ...ctx,
    rodapeContato: gerarRodapeContato(),
    rodapeRedes: gerarRodapeRedes(),
  };
  return {
    cabecalho: preencher(modeloCabecalho, ctx),
    rodape: preencher(modeloRodape, valoresRodape),
  };
}

function gerarHome() {
  const ctx = contexto({ mensagem: 'home' });

  const valores = {
    ...ctx,
    ...parciais(ctx),
    meta: cabecaMeta({
      titulo: `${dados.site.nomeCurto} — Direito de Família e Sucessões`,
      descricao: dados.site.descricao,
      caminho: '',
      ctx,
    }),
    imagemHero: ok(dados.imagens.hero) ? dados.imagens.hero : 'hero-veu.jpg',
    imagemRetrato: ok(dados.imagens.retrato) ? dados.imagens.retrato : 'lara-foto.jpg',
    imagemRetratoAlt: escapar(dados.imagens.retratoAlt || dados.site.advogada),
    envioFormulario: (dados.site.hospedagem || '').toLowerCase() === 'netlify' ? 'servidor' : 'whatsapp',
    indiceAtuacao: gerarIndiceAtuacao(ctx),
    cartoesHome: artigos.slice(0, 3).map((a) => cartao(a, ctx)).join('\n'),
    canaisContato: gerarCanais(),
  };

  writeFileSync(join(SAIDA, 'index.html'), preencher(lerModelo('index.html'), valores));
}

function gerarBlog() {
  const ctx = contexto({ mensagem: 'blog', paginaBlog: true });

  const categorias = ['Todos', ...new Set(artigos.map((a) => a.categoria))];
  const filtros = categorias
    .map((c, i) =>
      `        <button class="filtro" type="button" data-filtro="${escapar(c)}" aria-pressed="${i === 0}">${escapar(c)}</button>`)
    .join('\n');

  const valores = {
    ...ctx,
    ...parciais(ctx),
    meta: cabecaMeta({
      titulo: `Blog — ${dados.site.nomeCurto}`,
      descricao: 'Orientações claras sobre Direito de Família e Sucessões, escritas para ajudar você a decidir com tranquilidade.',
      caminho: 'blog.html',
      ctx,
    }),
    filtros,
    cartoesBlog: artigos.map((a) => cartao(a, ctx)).join('\n'),
  };

  writeFileSync(join(SAIDA, 'blog.html'), preencher(lerModelo('blog.html'), valores));
}

function gerarPrivacidade() {
  const ctx = contexto({ mensagem: 'home', paginaInterna: true });

  const valores = {
    ...ctx,
    ...parciais(ctx),
    meta: cabecaMeta({
      titulo: `Política de Privacidade — ${dados.site.nomeCurto}`,
      descricao: 'Como os seus dados são tratados neste site, em conformidade com a LGPD.',
      caminho: 'politica-de-privacidade.html',
      ctx,
    }),
  };

  writeFileSync(join(SAIDA, 'politica-de-privacidade.html'),
    preencher(lerModelo('politica-de-privacidade.html'), valores));
}

function gerarGlossario() {
  const ctx = contexto({ mensagem: 'home', paginaInterna: true });

  const lista = termosDoGlossario.map((t) => `        <li class="glossario__item">
          <a href="${ctx.raiz}glossario/${t.slug}.html">
            <h2>${escapar(t.termo)}</h2>
            <p>${escapar(t.definicao)}</p>
            <span class="link-risco">Ler a explicação</span>
          </a>
        </li>`).join('\n');

  const valores = {
    ...ctx,
    ...parciais(ctx),
    zapFlutuante: botaoFlutuante(ctx),
    meta: cabecaMeta({
      titulo: `Glossário jurídico — ${dados.site.nomeCurto}`,
      descricao: 'Explicações diretas dos termos que aparecem em uma conversa sobre família, patrimônio e sucessão — sem juridiquês.',
      caminho: 'glossario.html',
      ctx,
    }),
    termosGlossario: lista,
  };

  writeFileSync(join(SAIDA, 'glossario.html'), preencher(lerModelo('glossario.html'), valores));
}

function gerarTermos() {
  if (!termosDoGlossario.length) return;
  mkdirSync(join(SAIDA, 'glossario'), { recursive: true });

  const modelo = lerModelo('parciais', 'termo.html');

  for (const t of termosDoGlossario) {
    const ctx = contexto({ subpasta: true, mensagem: 'home' });

    const valores = {
      ...ctx,
      ...parciais(ctx),
      zapFlutuante: botaoFlutuante(ctx),
      meta: cabecaMeta({
        titulo: `${t.termo} — o que é | ${dados.site.nomeCurto}`,
        descricao: t.definicao,
        caminho: `glossario/${t.slug}.html`,
        ctx,
      }),
      termo: escapar(t.termo),
      definicao: escapar(t.definicao),
      paragrafos: t.paragrafos.map((x) => `    <p>${escapar(x)}</p>`).join('\n'),
    };

    writeFileSync(join(SAIDA, 'glossario', `${t.slug}.html`), preencher(modelo, valores));
  }
}

function gerarArtigos() {
  if (!publicados.length) return;
  mkdirSync(join(SAIDA, 'artigos'), { recursive: true });

  const modelo = lerModelo('parciais', 'artigo.html');

  for (const artigo of publicados) {
    const ctx = contexto({ subpasta: true, mensagem: 'artigo' });

    const valores = {
      ...ctx,
      ...parciais(ctx),
      meta: cabecaMeta({
        titulo: `${artigo.titulo} — ${dados.site.nomeCurto}`,
        descricao: artigo.resumo || artigo.textoSimples.slice(0, 160),
        caminho: `artigos/${artigo.slug}.html`,
        ctx,
        artigo,
      }),
      etiqueta: escapar(artigo.etiqueta),
      titulo: escapar(artigo.titulo),
      dataExibicao: escapar(artigo.dataExibicao),
      leitura: escapar(artigo.leitura),
      abertura: escapar(artigo.abertura),
      corpo: artigo.corpoHtml.split('\n').map((l) => (l ? '    ' + l : l)).join('\n'),
      imagemCapa: imagem(artigo.imagem, artigo.imagemAlt || artigo.titulo, ctx,
                         ' width="1100" height="619"'),
    };

    writeFileSync(join(SAIDA, 'artigos', `${artigo.slug}.html`), preencher(modelo, valores));
  }
}

const modeloCabecalho = lerModelo('parciais', 'cabecalho.html');
const modeloRodape = lerModelo('parciais', 'rodape.html');

/* ---------------------------------------------------------
   5. Arquivos de apoio
   --------------------------------------------------------- */

/**
 * O config.yml do painel guarda repositório, ramo e endereço.
 * Vêm de dados.json para não haver dois lugares dizendo a mesma coisa.
 * Os marcadores usam __MAIUSCULAS__ para não colidir com o {{slug}}
 * que o próprio painel interpreta.
 */
function gerarConfigDoPainel() {
  const painel = dados.painel || {};
  const repositorio = ok(painel.repositorio) ? painel.repositorio.trim() : '';
  const ramo = ok(painel.ramo) ? painel.ramo.trim() : 'main';

  if (!repositorio) {
    avisos.push('painel.repositorio não preenchido — o login do /admin não vai funcionar.');
  }
  if (!urlSite) {
    avisos.push('site.url é obrigatório para o login do /admin (é onde vive a função de OAuth).');
  }

  const caminho = join(SAIDA, 'admin', 'config.yml');
  const texto = readFileSync(caminho, 'utf8')
    .replace('__REPOSITORIO__', repositorio || 'PREENCHA-EM-dados.json')
    .replace('__RAMO__', ramo)
    .replace('__URL_SITE__', urlSite || 'PREENCHA-site.url-EM-dados.json');

  writeFileSync(caminho, texto);
}

function gerarFavicon() {
  // Monograma desenhado em SVG: nítido em qualquer tamanho e com poucos bytes.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#3b1f0e"/>
  <text x="32" y="43" font-family="Georgia, 'Times New Roman', serif" font-size="30"
        font-weight="500" letter-spacing="1" fill="#f5efe6" text-anchor="middle">LC</text>
</svg>`;
  writeFileSync(join(SAIDA, 'favicon.svg'), svg);
}

function gerarRobots() {
  const linhas = ['User-agent: *', 'Allow: /', 'Disallow: /admin/', ''];
  if (urlSite) linhas.push(`Sitemap: ${urlSite}/sitemap.xml`, '');
  writeFileSync(join(SAIDA, 'robots.txt'), linhas.join('\n'));
}

function gerarSitemap() {
  if (!urlSite) return;

  const hoje = new Date().toISOString().slice(0, 10);
  const paginas = [
    { caminho: '', prioridade: '1.0' },
    { caminho: 'blog.html', prioridade: '0.8' },
    { caminho: 'politica-de-privacidade.html', prioridade: '0.3' },
    { caminho: 'glossario.html', prioridade: '0.7' },
    ...termosDoGlossario.map((t) => ({ caminho: `glossario/${t.slug}.html`, prioridade: '0.6' })),
    ...publicados.map((a) => ({ caminho: `artigos/${a.slug}.html`, prioridade: '0.7', data: a.data })),
  ];

  const corpo = paginas.map((p) => `  <url>
    <loc>${urlSite}/${p.caminho}</loc>
    <lastmod>${p.data || hoje}</lastmod>
    <priority>${p.prioridade}</priority>
  </url>`).join('\n');

  writeFileSync(join(SAIDA, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${corpo}\n</urlset>\n`);
}

function gerarConfigDeHospedagem() {
  // Netlify: cache longo para o que tem nome estável, curto para o HTML.
  writeFileSync(join(SAIDA, '_headers'),
`/assets/*
  Cache-Control: public, max-age=31536000, immutable
/css/*
  Cache-Control: public, max-age=31536000, immutable
/js/*
  Cache-Control: public, max-age=31536000, immutable
/*.html
  Cache-Control: public, max-age=0, must-revalidate
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
`);

  writeFileSync(join(AQUI, 'vercel.json'), JSON.stringify({
    $schema: 'https://openapi.vercel.sh/vercel.json',
    buildCommand: 'node build.mjs',
    outputDirectory: 'site',
    // Os links do site já apontam para .html. Com cleanUrls a Vercel
    // redirecionaria cada um deles — um salto a mais por clique, à toa.
    cleanUrls: false,
    trailingSlash: false,
    headers: [
      {
        source: '/(assets|css|js)/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/admin/vendor/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ],
  }, null, 2) + '\n');
}

/* ---------------------------------------------------------
   6. Execução
   --------------------------------------------------------- */

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

// Arquivos estáticos: CSS, JS, fontes e imagens
cpSync(join(SRC, 'css'), join(SAIDA, 'css'), { recursive: true });
cpSync(join(SRC, 'js'), join(SAIDA, 'js'), { recursive: true });
cpSync(join(SRC, 'assets'), join(SAIDA, 'assets'), { recursive: true });

// Painel de administração (/admin) — opcional: só copia se existir
const temPainel = existsSync(join(SRC, 'admin'));
if (temPainel) {
  cpSync(join(SRC, 'admin'), join(SAIDA, 'admin'), { recursive: true });
  gerarConfigDoPainel();
}

gerarHome();
gerarBlog();
gerarArtigos();
gerarPrivacidade();
gerarGlossario();
gerarTermos();
gerarFavicon();
gerarRobots();
gerarSitemap();
gerarConfigDeHospedagem();

/* ---------------------------------------------------------
   7. Relatório
   --------------------------------------------------------- */

const emBreve = artigos.length - publicados.length;

console.log('\n  Site gerado em  site/\n');
console.log(`  · index.html`);
console.log(`  · blog.html                 ${artigos.length} cartões`);
console.log(`  · artigos/                  ${publicados.length} publicado(s)${emBreve ? `, ${emBreve} em breve` : ''}`);
console.log(`  · politica-de-privacidade.html`);
console.log(`  · glossario.html            ${termosDoGlossario.length} termos`);
if (temPainel) console.log(`  · admin/                    painel de publicação`);
console.log(`  · sitemap, robots, favicon, cabeçalhos`);

if (avisos.length) {
  console.log('\n  Ainda falta preencher em dados.json:');
  for (const a of avisos) console.log('  ! ' + a);
}

const semImagem = artigos.filter((a) => !a.imagem).map((a) => a.slug);

if (semImagem.length) {
  console.log('\n  Artigos usando a capa padrão:');
  for (const i of semImagem) console.log('  · ' + i);
}

console.log('');
