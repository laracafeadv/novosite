/* =========================================================
   Conversor de Markdown → HTML
   ---------------------------------------------------------
   Propositalmente pequeno: cobre só o que os artigos usam.

     ## Título          → <h2>
     ### Subtítulo      → <h3>
     texto solto        → <p>
     - item             → <ul><li>
     > citação          → <blockquote>
     **negrito**        → <strong>
     *itálico*          → <em>
     [texto](endereço)  → <a>

   Sem dependências: nada a instalar, nada que quebre depois.
   ========================================================= */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function escapar(texto) {
  return texto.replace(/[&<>"]/g, (c) => ESCAPES[c]);
}

/* Formatação dentro de uma linha (negrito, itálico, links). */
function inline(texto) {
  let saida = escapar(texto);

  // [texto](endereço) — links externos ganham target e rel por segurança
  saida = saida.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, rotulo, destino) => {
    const externo = /^https?:\/\//i.test(destino);
    const extra = externo ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${destino}"${extra}>${rotulo}</a>`;
  });

  saida = saida.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  saida = saida.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  // Aspas retas viram aspas tipográficas — combina com a fonte serifada
  saida = saida.replace(/"([^"]+)"/g, '“$1”');

  return saida;
}

/**
 * Converte um texto Markdown em HTML.
 * @param {string} md
 * @returns {string}
 */
export function paraHtml(md) {
  // Remove comentários HTML (as anotações dos arquivos-modelo)
  const limpo = md.replace(/<!--[\s\S]*?-->/g, '');
  const linhas = limpo.split(/\r?\n/);

  const partes = [];
  let lista = null;      // itens de <ul> em acumulação
  let citacao = null;    // linhas de <blockquote> em acumulação
  let paragrafo = null;  // linhas de <p> em acumulação

  function fecharLista() {
    if (!lista) return;
    partes.push('<ul>\n' + lista.map((i) => `  <li>${inline(i)}</li>`).join('\n') + '\n</ul>');
    lista = null;
  }
  function fecharCitacao() {
    if (!citacao) return;
    partes.push(`<blockquote>\n  <p>${inline(citacao.join(' '))}</p>\n</blockquote>`);
    citacao = null;
  }
  function fecharParagrafo() {
    if (!paragrafo) return;
    partes.push(`<p>${inline(paragrafo.join(' '))}</p>`);
    paragrafo = null;
  }
  function fecharTudo() {
    fecharLista();
    fecharCitacao();
    fecharParagrafo();
  }

  for (const linha of linhas) {
    const t = linha.trim();

    if (!t) { fecharTudo(); continue; }

    const titulo = /^(#{2,4})\s+(.*)$/.exec(t);
    if (titulo) {
      fecharTudo();
      const nivel = titulo[1].length; // ## → h2, ### → h3
      partes.push(`<h${nivel}>${inline(titulo[2])}</h${nivel}>`);
      continue;
    }

    const item = /^[-*]\s+(.*)$/.exec(t);
    if (item) {
      fecharCitacao();
      fecharParagrafo();
      (lista ||= []).push(item[1]);
      continue;
    }

    const cit = /^>\s?(.*)$/.exec(t);
    if (cit) {
      fecharLista();
      fecharParagrafo();
      (citacao ||= []).push(cit[1]);
      continue;
    }

    fecharLista();
    fecharCitacao();
    (paragrafo ||= []).push(t);
  }

  fecharTudo();
  return partes.join('\n\n');
}

/**
 * Separa o cabeçalho (entre ---) do corpo do arquivo.
 * @param {string} arquivo
 * @returns {{dados: Record<string,string>, corpo: string}}
 */
export function lerCabecalho(arquivo) {
  const texto = arquivo.replace(/^﻿/, '');
  const casamento = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(texto);
  if (!casamento) return { dados: {}, corpo: texto };

  const dados = {};
  let ultimaChave = null;

  for (const linha of casamento[1].split(/\r?\n/)) {
    if (!linha.trim() || linha.trimStart().startsWith('#')) continue;

    // Uma linha indentada sem "chave:" é continuação da anterior.
    // O painel /admin quebra valores longos assim, e sem isto o
    // texto ficaria cortado no meio.
    const inicioDeChave = /^([A-Za-z_][\w-]*)\s*:/.exec(linha);
    if (!inicioDeChave) {
      if (ultimaChave && /^\s/.test(linha)) {
        dados[ultimaChave] = (dados[ultimaChave] + ' ' + linha.trim()).trim();
      }
      continue;
    }

    // Só o primeiro ":" separa — títulos podem conter dois-pontos.
    const chave = inicioDeChave[1];
    let valor = linha.slice(inicioDeChave[0].length).trim();
    valor = valor.replace(/^["'](.*)["']$/, '$1');

    // ">-" e "|" anunciam texto nas linhas seguintes.
    if (/^[>|][-+]?$/.test(valor)) valor = '';

    dados[chave] = valor;
    ultimaChave = chave;
  }

  // Tira aspas que só apareceram depois de juntar as linhas
  for (const chave of Object.keys(dados)) {
    dados[chave] = dados[chave].replace(/^["'](.*)["']$/, '$1');
  }

  return { dados, corpo: casamento[2] };
}

/** Texto puro (sem marcação), usado em meta description e resumos. */
export function paraTextoSimples(md) {
  return md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[->*]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
