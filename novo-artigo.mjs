/* =========================================================
   Criar um artigo novo
   ---------------------------------------------------------
   Uso:  node novo-artigo.mjs

   Faz algumas perguntas e cria o arquivo já pronto em
   conteudo/artigos/. Depois é só escrever o texto e rodar
   node build.mjs.
   ========================================================= */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PASTA = join(AQUI, 'conteudo', 'artigos');

/** "Pacto antenupcial: o que é?" → "pacto-antenupcial-o-que-e" */
function paraSlug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // tira acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

/** Categorias já usadas, para sugerir em vez de inventar novas. */
function categoriasExistentes() {
  if (!existsSync(PASTA)) return [];
  const achadas = new Set();
  for (const nome of readdirSync(PASTA).filter((n) => n.endsWith('.md'))) {
    const cabecalho = readFileSync(join(PASTA, nome), 'utf8').split('---')[1] || '';
    const m = /^categoria:\s*(.+)$/m.exec(cabecalho);
    if (m) achadas.add(m[1].trim());
  }
  return [...achadas];
}

const rl = createInterface({ input: stdin, output: stdout });

let entradaFechada = false;
rl.on('close', () => { entradaFechada = true; });

async function perguntar(rotulo, padrao = '') {
  if (entradaFechada) return padrao;

  const dica = padrao ? ` (${padrao})` : '';
  let resposta = '';
  try {
    // Se a entrada acabar (Ctrl+D ou execução automatizada),
    // seguimos com o valor padrão em vez de travar.
    resposta = await Promise.race([
      rl.question(`  ${rotulo}${dica}: `),
      new Promise((resolver) => rl.once('close', () => resolver(''))),
    ]);
  } catch {
    resposta = '';
  }
  return String(resposta).trim() || padrao;
}

console.log('\n  Novo artigo — Lara Café Advocacia\n');

const titulo = await perguntar('Título');
if (!titulo) {
  console.log('\n  Sem título, sem artigo. Nada foi criado.\n');
  rl.close();
  process.exit(0);
}

const conhecidas = categoriasExistentes();
if (conhecidas.length) console.log(`  Categorias já usadas: ${conhecidas.join(', ')}`);

const categoria = await perguntar('Categoria', conhecidas[0] || 'Família');
const resumo = await perguntar('Resumo (1 ou 2 linhas, aparece no cartão do blog)');
const leitura = await perguntar('Tempo de leitura', '4 min de leitura');
const hoje = new Date().toISOString().slice(0, 10);
const data = await perguntar('Data', hoje);

let slug = paraSlug(await perguntar('Endereço da página', paraSlug(titulo)));

rl.close();

mkdirSync(PASTA, { recursive: true });

let destino = join(PASTA, `${slug}.md`);
let n = 2;
while (existsSync(destino)) {
  destino = join(PASTA, `${slug}-${n}.md`);
  n++;
}

/**
 * Põe aspas quando o valor tem dois-pontos ou outro caractere que
 * confunde a leitura em YAML — é o que o painel /admin usa.
 * Sem isto, um título como "Inventário: como fazer" apaga a linha lá.
 */
function comAspas(valor) {
  const v = String(valor).trim();
  if (!v) return '';
  const arriscado = v.includes(': ') || v.endsWith(':') || v.includes(' #') ||
                    '[]{}&*!|>%@`,'.includes(v[0]);
  return arriscado ? `"${v.replace(/"/g, '\\"')}"` : v;
}

const modelo = `---
titulo: ${comAspas(titulo)}
categoria: ${comAspas(categoria)}
resumo: ${comAspas(resumo)}
data_publicacao: ${data}
leitura: ${comAspas(leitura)}
imagem:
publicado: nao
---

Escreva aqui o parágrafo de abertura — ele aparece em destaque, em itálico, logo abaixo do título.

## Primeiro subtítulo

Texto do artigo. Um parágrafo por bloco, separados por uma linha em branco.

> Uma frase de destaque, se fizer sentido.

## Segundo subtítulo

Mais texto. Para listas, use hífen:

- Primeiro ponto.
- Segundo ponto.
- Terceiro ponto.

## Conclusão

Fecha a ideia e convida a conversar.
`;

writeFileSync(destino, modelo);

console.log(`
  Pronto.

  1. Escreva o texto em:
     conteudo/artigos/${destino.split('/').pop()}

  2. Quando terminar, troque no topo do arquivo:
     publicado: nao   →   publicado: sim

  3. Se tiver imagem de capa, coloque o arquivo em src/assets/
     e escreva o nome na linha "imagem:".

  4. Gere o site:
     node build.mjs
`);
