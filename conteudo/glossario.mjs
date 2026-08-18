/* =========================================================
   Glossário jurídico
   ---------------------------------------------------------
   Cada termo vira uma página própria em /glossario/<slug>.html
   e uma linha no índice em /glossario.html.

   Para acrescentar um termo, copie um bloco e rode node build.mjs.
   ========================================================= */

export const termosDoGlossario = [
  {
    "slug": "uniao-estavel",
    "termo": "União Estável",
    "definicao": "Relação reconhecida quando duas pessoas convivem de forma pública, contínua e duradoura, com o objetivo de constituir família — independentemente de contrato formal.",
    "paragrafos": [
      "A união estável não exige casamento civil para existir: basta a convivência pública, contínua e duradoura entre duas pessoas com o objetivo de constituir família.",
      "Ainda assim, ela gera efeitos jurídicos relevantes — entre eles, o regime de bens equivalente ao da comunhão parcial (salvo contrato de convivência em sentido diferente) e direitos sucessórios entre os companheiros.",
      "A união estável também pode ser convertida em casamento a qualquer momento, mediante requerimento ao cartório."
    ]
  },
  {
    "slug": "contrato-de-convivencia",
    "termo": "Contrato de Convivência",
    "definicao": "Documento que define as regras patrimoniais entre companheiros em união estável, podendo alterar o regime de bens padrão previsto em lei.",
    "paragrafos": [
      "Por padrão, a união estável segue o regime da comunhão parcial de bens. O contrato de convivência permite ao casal escolher outro regime — como separação total de bens — antes que qualquer patrimônio comum se forme.",
      "Também é possível usar o contrato de convivência para deixar claras outras regras da relação, reduzindo disputas futuras sobre o que foi ou não acordado.",
      "Formalizar esse contrato é uma medida preventiva: evita conflitos patrimoniais caso a relação termine ou em caso de falecimento de um dos companheiros."
    ]
  },
  {
    "slug": "pacto-antenupcial",
    "termo": "Pacto Antenupcial",
    "definicao": "Documento que define o regime de bens do casal antes do casamento civil, permitindo escolher uma regra diferente da comunhão parcial prevista por padrão em lei.",
    "paragrafos": [
      "O pacto antenupcial é celebrado antes do casamento, por escritura pública em cartório, e define como o patrimônio do casal será tratado durante e após a relação.",
      "Sem esse documento, o casamento segue automaticamente o regime da comunhão parcial de bens. Com o pacto, é possível optar por separação total, comunhão universal ou participação final nos aquestos — cada um com efeitos diferentes sobre o patrimônio de cada cônjuge.",
      "É especialmente relevante quando um dos nubentes já possui patrimônio formado antes do casamento, ou quando há interesse em proteger bens familiares ou empresariais."
    ]
  },
  {
    "slug": "divorcio-consensual",
    "termo": "Divórcio Consensual",
    "definicao": "Modalidade de divórcio em que o casal está de acordo sobre todos os termos da separação — pode ser feito em cartório (extrajudicial) ou por via judicial.",
    "paragrafos": [
      "No divórcio consensual, as partes concordam sobre a separação e seus termos: partilha de bens, uso do nome e, quando houver, guarda e pensão de filhos.",
      "Quando não há filhos menores ou incapazes e há consenso total, o divórcio pode ser feito diretamente em cartório — via extrajudicial —, o que costuma ser mais rápido e menos custoso que o processo judicial.",
      "Mesmo sendo consensual, a assistência de advogado é obrigatória em qualquer modalidade de divórcio no Brasil."
    ]
  },
  {
    "slug": "inventario-extrajudicial",
    "termo": "Inventário Extrajudicial",
    "definicao": "Procedimento de partilha de bens após um falecimento, feito diretamente em cartório, quando há consenso entre todos os herdeiros maiores e capazes.",
    "paragrafos": [
      "O inventário extrajudicial pode ser feito em cartório — sem processo judicial — quando todos os herdeiros são maiores de idade, capazes, e estão de acordo sobre a partilha dos bens.",
      "Essa via costuma ser mais rápida e econômica que o inventário judicial, reduzindo o tempo entre o falecimento e a efetiva divisão do patrimônio entre os herdeiros.",
      "A presença de um advogado é obrigatória em qualquer inventário, extrajudicial ou judicial, para assessorar as partes durante o procedimento."
    ]
  },
  {
    "slug": "testamento",
    "termo": "Testamento",
    "definicao": "Documento pelo qual uma pessoa determina, em vida, como deseja que seu patrimônio seja distribuído após sua morte, dentro dos limites previstos em lei.",
    "paragrafos": [
      "O testamento permite planejar a sucessão em vida, direcionando bens para pessoas ou causas específicas — respeitando a parte da herança reservada por lei aos herdeiros necessários (a legítima).",
      "Existem diferentes modalidades de testamento previstas em lei, cada uma com requisitos formais próprios (como o testamento público, feito em cartório, e o particular).",
      "Além de reduzir conflitos entre herdeiros, um testamento bem elaborado tende a agilizar o processo de inventário, por deixar claras as intenções do falecido."
    ]
  },
  {
    "slug": "partilha-de-bens",
    "termo": "Partilha de Bens",
    "definicao": "Divisão do patrimônio entre o casal (em divórcio) ou entre os herdeiros (em inventário), seguindo o regime de bens ou a ordem legal de sucessão.",
    "paragrafos": [
      "Em um divórcio, a partilha de bens segue o regime adotado pelo casal — comunhão parcial, separação total, comunhão universal ou participação final nos aquestos — definindo o que é dividido e em que proporção.",
      "Em um inventário, a partilha segue a ordem de sucessão prevista em lei, respeitando testamento (se houver) e a parte reservada aos herdeiros necessários.",
      "Uma partilha bem construída, com clareza sobre os critérios aplicáveis, é o que evita que desacordos patrimoniais se transformem em disputas judiciais longas."
    ]
  }
];
