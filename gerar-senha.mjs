/* =========================================================
   Gerar a senha do painel
   ---------------------------------------------------------
   Uso:  node gerar-senha.mjs

   Pede uma senha e devolve a versão embaralhada para colar
   na Vercel. A senha em si não é gravada em lugar nenhum —
   nem neste computador, nem no repositório.
   ========================================================= */

import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

/** Pergunta escondendo o que é digitado. */
function perguntarSenha(rotulo) {
  return new Promise((resolver) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });

    // Esconde os caracteres enquanto a pessoa digita
    const escrever = stdout.write.bind(stdout);
    let escondendo = false;
    stdout.write = (texto, ...resto) =>
      escondendo && typeof texto === 'string' && !texto.includes('\n')
        ? true
        : escrever(texto, ...resto);

    rl.question(rotulo, (resposta) => {
      escondendo = false;
      stdout.write = escrever;
      stdout.write('\n');
      rl.close();
      resolver(resposta);
    });

    escondendo = true;
  });
}

console.log('\n  Senha do painel — Lara Café Advocacia\n');
console.log('  A senha não será exibida enquanto você digita.\n');

const senha = await perguntarSenha('  Senha: ');

if (senha.length < 10) {
  console.log('\n  Muito curta. Use pelo menos 10 caracteres.\n');
  process.exit(1);
}

const repetida = await perguntarSenha('  Repita: ');

if (senha !== repetida) {
  console.log('\n  As senhas não conferem. Rode de novo.\n');
  process.exit(1);
}

const sal = randomBytes(16);
const hash = scryptSync(senha, sal, 64).toString('hex');
const valor = `${sal.toString('hex')}:${hash}`;

console.log(`
  Pronto. Na Vercel, em Settings → Environment Variables,
  crie a variável abaixo (marque os três ambientes):

  Nome:   PAINEL_SENHA_HASH
  Valor:  ${valor}

  Guarde a senha original com você — daqui não dá para
  recuperá-la, só gerar outra.
`);
