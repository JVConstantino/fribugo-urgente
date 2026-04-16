/**
 * Insere 15 artigos de exemplo sobre Nova Friburgo, RJ.
 * Uso: node scripts/seed-articles.mjs
 */

import * as sdk from "node-appwrite";

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("\nUsage: node scripts/seed-articles.mjs <API_KEY>\n");
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint("https://constantino-database.m2lqbf.easypanel.host/v1")
  .setProject("69e00a02003c93871d98")
  .setKey(API_KEY);

const databases = new sdk.Databases(client);
const DB = "friburgourgente";
const COL = "articles";
const AUTHOR_ID = "69e00d2d3cf3832359a5";

const now = new Date();
function daysAgo(n) {
  return new Date(now.getTime() - n * 86400000).toISOString();
}

const articles = [
  {
    title: "Obras de revitalização do centro histórico de Nova Friburgo são retomadas",
    slug: "obras-revitalizacao-centro-historico-nova-friburgo",
    excerpt: "A Prefeitura de Nova Friburgo deu início à segunda fase das obras de revitalização do centro histórico da cidade, com previsão de conclusão para o segundo semestre deste ano.",
    content: `<p>A Prefeitura de Nova Friburgo deu início à segunda fase das obras de revitalização do centro histórico da cidade nesta segunda-feira. O projeto, que conta com investimento de R$ 8,5 milhões do governo estadual, prevê a reforma de calçadas, iluminação pública em LED e restauração de fachadas de prédios tombados pelo patrimônio histórico.</p>
<p>O secretário municipal de Obras, engenheiro Carlos Mendes, explicou que os trabalhos serão divididos em três etapas. "A primeira etapa contempla a Rua General Osório e a Praça Getúlio Vargas. Em seguida, passaremos para a Rua Monsenhor Miranda e, por fim, faremos a revitalização completa da orla do Rio Bengalas", detalhou.</p>
<p>Os moradores e comerciantes da região foram notificados com antecedência sobre os desvios de tráfego que serão necessários durante as obras. A expectativa é que o fluxo de turistas aumente em até 40% após a conclusão dos trabalhos, segundo dados da Secretaria de Turismo.</p>
<p>O projeto foi elaborado em parceria com o Instituto do Patrimônio Histórico e Artístico Nacional (IPHAN), garantindo que todas as intervenções respeitem as características arquitetônicas do século XIX que fazem de Nova Friburgo uma das cidades mais charmosas da Serra Fluminense.</p>`,
    categoryId: "cidade",
    tags: ["obras", "centro histórico", "revitalização", "patrimônio"],
    isBreaking: false,
    publishedAt: daysAgo(1),
  },
  {
    title: "Câmara Municipal aprova orçamento de R$ 120 milhões para 2025",
    slug: "camara-municipal-aprova-orcamento-120-milhoes-2025",
    excerpt: "Por 13 votos a 2, os vereadores de Nova Friburgo aprovaram o projeto de Lei Orçamentária Anual para o exercício de 2025, com destaque para investimentos em saúde e educação.",
    content: `<p>Por 13 votos a 2, a Câmara Municipal de Nova Friburgo aprovou na última sessão ordinária o projeto de Lei Orçamentária Anual (LOA) para o exercício de 2025. O orçamento totaliza R$ 120 milhões, representando um aumento de 8,3% em relação ao ano anterior.</p>
<p>Segundo o projeto aprovado, a maior fatia do orçamento — cerca de 34% — será destinada à área da saúde, incluindo a conclusão da reforma do Hospital Municipal Raul Sertã e a implantação de duas novas Unidades Básicas de Saúde nos bairros Conselheiro Paulino e Cascatinha.</p>
<p>A educação receberá 25% dos recursos, com destaque para a construção de uma nova escola municipal na Zona Sul da cidade e a aquisição de equipamentos para as unidades de ensino existentes. "Este é um orçamento equilibrado e comprometido com as necessidades reais da nossa população", afirmou o presidente da Câmara, vereador Roberto Alvarenga.</p>
<p>Os dois votos contrários foram do vereador Francisco Neto e da vereadora Patrícia Lemos, que apresentaram emendas solicitando maior alocação para habitação e assistência social, mas não obtiveram apoio suficiente para aprovação.</p>`,
    categoryId: "politica",
    tags: ["câmara municipal", "orçamento", "LOA", "política"],
    isBreaking: false,
    publishedAt: daysAgo(2),
  },
  {
    title: "Polo industrial de Nova Friburgo registra crescimento de 12% no primeiro trimestre",
    slug: "polo-industrial-nova-friburgo-crescimento-12-porcento",
    excerpt: "Dados divulgados pela Associação Comercial e Industrial de Nova Friburgo (ACINF) apontam crescimento expressivo nas exportações e na geração de empregos no setor industrial.",
    content: `<p>O polo industrial de Nova Friburgo encerrou o primeiro trimestre de 2025 com crescimento de 12% em relação ao mesmo período do ano anterior, segundo dados divulgados pela Associação Comercial e Industrial de Nova Friburgo (ACINF). O resultado supera as previsões iniciais, que estimavam expansão de 7%.</p>
<p>O setor de moda íntima e lingerie, principal atividade industrial do município, liderou o crescimento com alta de 15%. Segundo o presidente da ACINF, Luís Fernandes, a retomada das exportações para países da América Latina e Europa foi determinante para o bom desempenho. "Superamos a marca de 200 empresas exportadoras ativas no município, um recorde histórico para Nova Friburgo", destacou.</p>
<p>O segmento de tecelagem também apresentou resultados positivos, com aumento de 9% na produção. A geração de empregos formais no setor industrial cresceu 6,5%, com a criação de aproximadamente 820 novos postos de trabalho nos três primeiros meses do ano.</p>
<p>Para o segundo trimestre, a expectativa é de manutenção do ritmo de crescimento, impulsionada pela realização da Feira Têxtil de Nova Friburgo, principal evento do setor na região Sudeste do Brasil.</p>`,
    categoryId: "economia",
    tags: ["indústria", "economia", "emprego", "ACINF"],
    isBreaking: false,
    publishedAt: daysAgo(3),
  },
  {
    title: "Hospital Municipal Raul Sertã recebe novos equipamentos para UTI adulto",
    slug: "hospital-raul-serta-novos-equipamentos-uti",
    excerpt: "Investimento de R$ 2,3 milhões permitirá ampliar o número de leitos de UTI no principal hospital público de Nova Friburgo, reduzindo o tempo de espera por atendimento de alta complexidade.",
    content: `<p>O Hospital Municipal Raul Sertã, principal unidade de saúde pública de Nova Friburgo, recebeu nesta semana uma remessa de novos equipamentos para a Unidade de Terapia Intensiva adulto. O investimento total de R$ 2,3 milhões é proveniente de emenda parlamentar do deputado estadual Márcio Ribeiro e de recursos próprios do município.</p>
<p>Entre os equipamentos adquiridos estão 12 novos respiradores mecânicos, 8 monitores multiparamétricos, bombas de infusão e um ultrassom portátil. Com os novos equipamentos, a capacidade da UTI passará de 16 para 24 leitos ativos, representando um aumento de 50% na capacidade instalada.</p>
<p>A diretora do hospital, Dra. Fernanda Costa, ressaltou a importância dos novos equipamentos para o atendimento da população serrana. "Nova Friburgo é referência em saúde para mais de 20 municípios da região. Com essa ampliação, poderemos atender com mais rapidez e segurança os casos de maior gravidade", explicou.</p>
<p>A previsão é que os novos leitos de UTI entrem em funcionamento até o final deste mês, após a instalação dos equipamentos e a capacitação da equipe de enfermagem para operação dos novos dispositivos.</p>`,
    categoryId: "saude",
    tags: ["saúde", "hospital", "UTI", "investimento"],
    isBreaking: false,
    publishedAt: daysAgo(4),
  },
  {
    title: "CEFET-RJ inaugura novo campus em Nova Friburgo com foco em tecnologia",
    slug: "cefet-rj-inaugura-campus-nova-friburgo-tecnologia",
    excerpt: "A nova unidade do Centro Federal de Educação Tecnológica oferecerá cursos de Engenharia de Software, Automação Industrial e Técnico em Informática, com capacidade para 800 alunos.",
    content: `<p>O Centro Federal de Educação Tecnológica Celso Suckow da Fonseca (CEFET-RJ) inaugurou nesta quinta-feira seu novo campus em Nova Friburgo. A unidade, localizada no bairro Campo do Coelho, representa um investimento federal de R$ 45 milhões e atenderá exclusivamente a área de tecnologia e engenharia.</p>
<p>Os cursos oferecidos na nova unidade são: Engenharia de Software (bacharelado, 4 anos), Automação Industrial (bacharelado, 4 anos) e Técnico em Informática (integrado ao ensino médio, 3 anos). No primeiro semestre letivo serão abertas 280 vagas, com previsão de ampliar para 800 alunos matriculados até 2027.</p>
<p>A cerimônia de inauguração contou com a presença do reitor do CEFET-RJ, Prof. Dr. Márcio Silveira, e do prefeito de Nova Friburgo, que destacou a importância do campus para o desenvolvimento regional. "Estamos formando os profissionais que vão impulsionar nossa economia nas próximas décadas", afirmou o prefeito.</p>
<p>As inscrições para o processo seletivo do segundo semestre de 2025 serão abertas em julho, pelo Sistema de Seleção Unificada (SISU) e pelo processo seletivo próprio da instituição.</p>`,
    categoryId: "educacao",
    tags: ["educação", "CEFET", "tecnologia", "campus"],
    isBreaking: false,
    publishedAt: daysAgo(5),
  },
  {
    title: "Projeto de reflorestamento recupera 500 hectares na região serrana",
    slug: "projeto-reflorestamento-recupera-500-hectares-serra",
    excerpt: "A iniciativa, liderada pela ONG Mata Atlântica Viva em parceria com a Prefeitura de Nova Friburgo, já plantou mais de 80 mil mudas de espécies nativas nos últimos dois anos.",
    content: `<p>Um ambicioso projeto de reflorestamento está recuperando áreas degradadas na Serra dos Órgãos, nos arredores de Nova Friburgo. A iniciativa, coordenada pela ONG Mata Atlântica Viva em parceria com a Prefeitura Municipal e o Instituto Estadual do Ambiente (INEA), já restaurou 500 hectares de floresta nativa desde o início das atividades, em 2023.</p>
<p>Ao longo dos dois anos de projeto, foram plantadas mais de 80 mil mudas de espécies nativas da Mata Atlântica, como jequitibá-rosa, ipê-amarelo, cedro e imbuia. A taxa de sobrevivência das mudas é de 78%, acima da média nacional para projetos similares, segundo os coordenadores.</p>
<p>Além da recuperação ambiental, o projeto gerou 45 empregos diretos para moradores da região, que trabalham como viveiristas e plantadores. "Estamos provando que é possível conciliar geração de renda com preservação ambiental na Serra Fluminense", afirmou Beatriz Nunes, coordenadora geral da ONG.</p>
<p>A meta é recuperar mais 300 hectares até o final de 2025, priorizando áreas que foram devastadas pelas enchentes de 2011. O projeto conta com financiamento do Fundo Nacional de Meio Ambiente e doações de empresas locais.</p>`,
    categoryId: "meio-ambiente",
    tags: ["meio ambiente", "reflorestamento", "Mata Atlântica", "sustentabilidade"],
    isBreaking: false,
    publishedAt: daysAgo(6),
  },
  {
    title: "Operação da PM reduz em 35% os roubos no centro de Nova Friburgo",
    slug: "operacao-pm-reduz-roubos-centro-nova-friburgo",
    excerpt: "Após dois meses de operação ostensiva com policiamento reforçado, os índices de criminalidade no centro comercial da cidade apresentaram queda expressiva, segundo dados do ISP.",
    content: `<p>A operação de policiamento ostensivo implementada pelo 11º Batalhão da Polícia Militar nos dois últimos meses resultou em redução de 35% nos índices de roubo e furto no centro de Nova Friburgo. Os dados são do Instituto de Segurança Pública (ISP) e foram divulgados nesta semana.</p>
<p>A operação envolveu o reforço do efetivo policial na área central, com policiamento a pé, de moto e via câmeras de videomonitoramento. Segundo o comandante do 11º BPM, Tenente-Coronel André Vieira, a integração entre as forças de segurança foi fundamental para o resultado. "Trabalhamos em conjunto com a Guarda Municipal e com informações de moradores e comerciantes", explicou.</p>
<p>Durante a operação, foram realizadas 127 prisões e apreensões, com recuperação de 43 veículos furtados e desmanche de dois pontos de comércio ilegal de produtos roubados. A Delegacia de Nova Friburgo instaurou 89 inquéritos relacionados aos crimes identificados.</p>
<p>Comerciantes da região comemoraram os resultados. "Antes eu tinha medo de deixar o estabelecimento durante o almoço. Agora me sinto muito mais seguro", disse João Albino, dono de uma loja de roupas na Rua Monsenhor Miranda. A operação deve ser mantida indefinidamente, segundo a Secretaria de Segurança do Estado do Rio de Janeiro.</p>`,
    categoryId: "seguranca",
    tags: ["segurança", "polícia militar", "criminalidade", "centro"],
    isBreaking: false,
    publishedAt: daysAgo(7),
  },
  {
    title: "Nova Friburgo FC avança para semifinal do Campeonato Carioca da Série B",
    slug: "nova-friburgo-fc-semifinal-campeonato-carioca-serie-b",
    excerpt: "Com vitória por 2 a 1 sobre o Bonsucesso no último domingo, o time friburguense garantiu vaga entre os quatro melhores do estadual e sonha com o acesso à elite do futebol fluminense.",
    content: `<p>O Nova Friburgo FC garantiu sua vaga na semifinal do Campeonato Carioca da Série B ao vencer o Bonsucesso por 2 a 1 no último domingo, no Estádio Municipal Oscar Araripe. Com o resultado, o time friburguense terminou a fase de grupos na segunda posição, com 19 pontos em 9 jogos.</p>
<p>Os gols do Nova Friburgo foram marcados pelo centroavante Leandro, aos 23 minutos do primeiro tempo, e pelo meia Rafael Sousa, em cobrança de falta no segundo tempo. O Bonsucesso descontou com gol de pênalti nos acréscimos, mas não conseguiu buscar o empate.</p>
<p>O técnico Maurício Santos destacou o desempenho coletivo da equipe. "Este grupo merece cada conquista. Trabalhamos muito durante toda a semana e a entrega em campo foi total. Agora é manter o foco para a semifinal", declarou o treinador.</p>
<p>O adversário na semifinal será o Americano FC, de Campos dos Goytacazes. O jogo de ida está marcado para o próximo fim de semana, no Estádio Municipal Oscar Araripe. Uma eventual vitória no torneio garantiria ao Nova Friburgo FC o acesso à Série A do Campeonato Carioca de 2026.</p>`,
    categoryId: "esportes",
    tags: ["futebol", "Nova Friburgo FC", "campeonato carioca", "esportes"],
    isBreaking: false,
    publishedAt: daysAgo(8),
  },
  {
    title: "Festival de Inverno de Nova Friburgo anuncia programação para julho",
    slug: "festival-inverno-nova-friburgo-programacao-julho",
    excerpt: "O evento, que este ano chega à sua 28ª edição, promete 10 dias de música, gastronomia, artesanato e espetáculos culturais com atrações nacionais e regionais.",
    content: `<p>A organização do Festival de Inverno de Nova Friburgo anunciou nesta semana a programação completa da 28ª edição do evento, prevista para acontecer entre os dias 11 e 20 de julho de 2025. Com o tema "Serra em Festa", a programação inclui mais de 60 apresentações artísticas gratuitas e pagas distribuídas pelos principais espaços culturais da cidade.</p>
<p>As atrações nacionais confirmadas incluem shows de MPB, samba, jazz e música clássica. O Festival também contará com uma robusta programação de teatro, com peças adultas e infantis no Teatro Municipal Carlos Gomes, e uma mostra de cinema com filmes brasileiros inéditos.</p>
<p>A gastronomia ganha destaque especial nesta edição, com um espaço dedicado de 5.000 m² reunindo 40 restaurantes e produtores locais. "Queremos mostrar que Nova Friburgo tem uma das culinárias mais diversificadas da Serra Fluminense, com forte influência suíça e alemã", explicou Carla Monteiro, secretária de Cultura e Turismo.</p>
<p>O Festival de Inverno movimenta cerca de R$ 18 milhões na economia local a cada edição e atrai em média 120 mil visitantes ao longo dos 10 dias. As vendas antecipadas de ingressos para os shows pagos já estão disponíveis no site oficial do evento.</p>`,
    categoryId: "cultura",
    tags: ["festival", "cultura", "turismo", "inverno", "eventos"],
    isBreaking: false,
    publishedAt: daysAgo(9),
  },
  {
    title: "Prefeitura abre inscrições para programa habitacional no Conselheiro Paulino",
    slug: "prefeitura-inscricoes-programa-habitacional-conselheiro-paulino",
    excerpt: "O programa 'Minha Casa Friburguense' vai construir 240 unidades habitacionais para famílias de baixa renda no bairro Conselheiro Paulino, zona norte da cidade.",
    content: `<p>A Prefeitura de Nova Friburgo abriu nesta segunda-feira as inscrições para o programa habitacional "Minha Casa Friburguense", que vai construir 240 unidades habitacionais no bairro Conselheiro Paulino. As inscrições podem ser feitas até o dia 30 de maio, na sede da Secretaria de Habitação, situada na Rua Fenner, 111, Centro.</p>
<p>Podem se inscrever famílias com renda mensal de até R$ 3.500, que não possuam imóvel registrado em nome de nenhum dos membros e que residam em Nova Friburgo há pelo menos três anos. Famílias chefiadas por mulheres, pessoas com deficiência e idosos terão prioridade na seleção.</p>
<p>As unidades habitacionais terão área de 52 m², com dois quartos, sala, cozinha, banheiro e área de serviço. O empreendimento contará ainda com área verde, playground, salão de reuniões e câmeras de segurança. O financiamento é feito pelo programa federal Minha Casa Minha Vida, com parcelas que podem chegar a R$ 280 mensais para a faixa de menor renda.</p>
<p>O secretário de Habitação, José Correia, informou que as obras deverão ter início em agosto de 2025, com previsão de entrega das chaves para dezembro de 2026. "Este é o maior programa habitacional da história recente de Nova Friburgo", afirmou.</p>`,
    categoryId: "cidade",
    tags: ["habitação", "moradia", "Conselheiro Paulino", "programa social"],
    isBreaking: false,
    publishedAt: daysAgo(10),
  },
  {
    title: "Setor de moda íntima de Nova Friburgo exporta R$ 52 milhões em 2024",
    slug: "setor-moda-intima-nova-friburgo-exporta-52-milhoes-2024",
    excerpt: "Nova Friburgo consolidou sua posição como maior polo de moda íntima do Brasil, com exportações para 35 países e perspectiva de crescimento de 18% para 2025.",
    content: `<p>O setor de moda íntima de Nova Friburgo encerrou 2024 com exportações recordes, totalizando R$ 52 milhões em vendas para mercados externos. O resultado representa crescimento de 22% em relação a 2023 e consolida a cidade como o maior polo produtor de lingerie e moda íntima do Brasil, segundo dados do Sindicato da Indústria de Fiação e Tecelagem (SINDITÊXTIL-RJ).</p>
<p>Os principais destinos das exportações friburguenses foram Argentina, Chile, Colômbia, Portugal e Estados Unidos. O crescimento no mercado americano foi o mais expressivo, com aumento de 45% nas vendas, impulsionado pelo câmbio favorável e pela qualidade reconhecida internacionalmente dos produtos da cidade.</p>
<p>O polo conta atualmente com 412 empresas ativas no setor têxtil, sendo 180 delas voltadas exclusivamente para moda íntima. Juntas, empregam diretamente 12.800 trabalhadores no município. A Feira Têxtil de Nova Friburgo, realizada em setembro, atraiu em 2024 mais de 8.000 compradores de 42 países.</p>
<p>Para 2025, as perspectivas são ainda mais otimistas. A abertura de novos mercados no Oriente Médio e a participação em feiras internacionais na Europa devem impulsionar as exportações para a marca de R$ 62 milhões, segundo projeções da ACINF.</p>`,
    categoryId: "economia",
    tags: ["moda íntima", "exportação", "têxtil", "economia"],
    isBreaking: false,
    publishedAt: daysAgo(11),
  },
  {
    title: "Campanha de vacinação contra dengue imuniza mais de 12 mil em Nova Friburgo",
    slug: "campanha-vacinacao-dengue-imuniza-12-mil-nova-friburgo",
    excerpt: "A Secretaria Municipal de Saúde superou a meta de vacinação estabelecida pelo Ministério da Saúde para Nova Friburgo, com destaque para a cobertura nas comunidades mais vulneráveis.",
    content: `<p>A campanha de vacinação contra a dengue em Nova Friburgo superou a meta estabelecida pelo Ministério da Saúde, imunizando 12.340 pessoas em apenas três semanas de ação. A Secretaria Municipal de Saúde havia se comprometido com a imunização de 10.000 habitantes na faixa etária prioritária (10 a 14 anos).</p>
<p>A vacinação com a vacina QDENGA está sendo realizada em todas as 18 Unidades Básicas de Saúde do município, além de pontos volantes instalados em escolas, praças e no shopping center da cidade. A cobertura vacinal atingiu 87% na faixa etária-alvo, bem acima da meta nacional de 80%.</p>
<p>A secretária de Saúde, Dra. Mariana Figueiredo, destacou o trabalho dos Agentes Comunitários de Saúde para mobilizar a população. "Fizemos um trabalho de busca ativa muito intenso, principalmente nas comunidades de difícil acesso na zona rural. O resultado é motivo de muito orgulho para toda a equipe", afirmou.</p>
<p>Nova Friburgo registrou 234 casos confirmados de dengue neste ano, número 60% inferior ao do mesmo período de 2024. A cidade também intensificou as ações de combate ao Aedes aegypti, com mutirões de limpeza realizados em 8 bairros com maior concentração de focos do mosquito.</p>`,
    categoryId: "saude",
    tags: ["dengue", "vacinação", "saúde pública", "saúde"],
    isBreaking: false,
    publishedAt: daysAgo(12),
  },
  {
    title: "Defesa Civil alerta para risco de deslizamentos após chuvas intensas na serra",
    slug: "defesa-civil-alerta-deslizamentos-chuvas-serra-friburgo",
    excerpt: "Com acumulado de 180mm em 48 horas, a Defesa Civil de Nova Friburgo ativou o nível de alerta laranja e recomenda que moradores de áreas de encosta fiquem em estado de atenção.",
    content: `<p>A Defesa Civil de Nova Friburgo ativou nesta quarta-feira o nível de alerta laranja após o acúmulo de 180 milímetros de chuva nas últimas 48 horas na região serrana. O volume supera em 60% a média histórica para o período e acende o sinal de atenção para moradores de áreas de encosta e margens de rios.</p>
<p>O coordenador da Defesa Civil municipal, Rodrigo Azevedo, orientou a população a ficar atenta aos sinais de risco: rachaduras em paredes, portas e janelas que não fecham mais, água ou lama brotando do chão e inclinação de árvores. "Ao menor sinal de risco, o morador deve abandonar o imóvel e acionar o número 199", orientou.</p>
<p>As áreas com maior nível de atenção são os bairros Mury, Alto, Cônego, São Geraldo e partes do Olaria. Equipes da Defesa Civil e do Corpo de Bombeiros estão posicionadas em pontos estratégicos da cidade para atuação imediata em casos de emergência. O Ginásio Municipal está sendo preparado para funcionar como abrigo temporário, com capacidade para 400 pessoas.</p>
<p>O prefeito decretou situação de emergência em caráter preventivo, o que permite ao município acessar recursos estaduais e federais para ações de resposta. A previsão meteorológica indica que as chuvas devem continuar nas próximas 24 horas, antes de uma melhora no tempo.</p>`,
    categoryId: "cidade",
    tags: ["defesa civil", "chuvas", "deslizamento", "emergência", "alerta"],
    isBreaking: true,
    publishedAt: daysAgo(0),
  },
  {
    title: "Escolas municipais de Nova Friburgo recebem kits de robótica educacional",
    slug: "escolas-municipais-nova-friburgo-kits-robotica-educacional",
    excerpt: "Parceria entre a Prefeitura e o SESI vai beneficiar 22 escolas da rede pública com laboratórios de robótica, beneficiando cerca de 4.500 alunos do ensino fundamental.",
    content: `<p>Vinte e duas escolas da rede municipal de ensino de Nova Friburgo receberam nesta semana kits de robótica educacional como parte da parceria firmada entre a Prefeitura e o Serviço Social da Indústria (SESI-RJ). O programa "Robótica na Escola" vai beneficiar aproximadamente 4.500 alunos do 4º ao 9º ano do ensino fundamental.</p>
<p>Cada kit é composto por um conjunto LEGO Education Spike Prime, que permite construir e programar robôs utilizando linguagem de blocos visual e Python. As atividades serão integradas às aulas de Ciências, Matemática e Tecnologia, seguindo a Base Nacional Comum Curricular (BNCC).</p>
<p>Os professores já passaram por uma capacitação de 40 horas antes do início das atividades. A professora Sônia Lima, da Escola Municipal Nossa Senhora das Graças, foi uma das participantes do treinamento e está animada com a novidade. "Meus alunos já estão criando projetos incríveis. A robótica desperta uma curiosidade que outros recursos não conseguem", relatou.</p>
<p>O investimento total no programa foi de R$ 1,2 milhão, sendo 60% custeado pelo SESI e 40% pela Prefeitura. A expectativa é expandir o programa para as escolas estaduais do município ao longo de 2026, com apoio do governo do Estado do Rio de Janeiro.</p>`,
    categoryId: "educacao",
    tags: ["educação", "robótica", "tecnologia", "escolas"],
    isBreaking: false,
    publishedAt: daysAgo(13),
  },
  {
    title: "Nova Friburgo recebe prêmio de melhor destino de turismo de montanha do RJ",
    slug: "nova-friburgo-premio-melhor-destino-turismo-montanha-rj",
    excerpt: "A cidade conquistou o título pelo terceiro ano consecutivo na premiação do Sebrae-RJ e da Federação de Turismo do Estado, reconhecendo os investimentos em infraestrutura e atrativos turísticos.",
    content: `<p>Nova Friburgo foi reconhecida pelo terceiro ano consecutivo como o melhor destino de turismo de montanha do Estado do Rio de Janeiro. O prêmio, concedido pelo Sebrae-RJ e pela Federação de Turismo do Estado do Rio (FTR), foi entregue em cerimônia realizada no Rio de Janeiro, com presença do prefeito e da secretária de Turismo da cidade.</p>
<p>A premiação leva em conta critérios como infraestrutura turística, atendimento ao visitante, diversidade de atrativos, sustentabilidade e crescimento no número de turistas. Nova Friburgo pontuou de forma expressiva em todos os quesitos, com destaque especial para a diversidade de atrativos naturais e culturais.</p>
<p>Com altitude média de 900 metros e temperatura média de 18°C, a "Suíça Brasileira" — como é carinhosamente chamada — recebeu 1,2 milhão de turistas em 2024, gerando uma receita de R$ 340 milhões para a economia local. Os principais atrativos são o Parque das Corredeiras, o Pico da Caledônia, a Rota do Chocolate Suíço e o centro histórico da cidade.</p>
<p>A secretária de Turismo, Carla Monteiro, anunciou que os investimentos em infraestrutura turística continuarão em 2025, com a abertura de dois novos centros de atendimento ao turista e a sinalização de 15 novos roteiros de ecoturismo na região serrana.</p>`,
    categoryId: "cidade",
    tags: ["turismo", "prêmio", "montanha", "destino turístico"],
    isBreaking: false,
    publishedAt: daysAgo(14),
  },
];

async function createArticle(data) {
  const doc = await databases.createDocument(DB, COL, sdk.ID.unique(), {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    categoryId: data.categoryId,
    authorId: AUTHOR_ID,
    tags: data.tags,
    isPublished: true,
    isBreaking: data.isBreaking,
    coverImageId: null,
    views: 0,
    publishedAt: data.publishedAt,
  });
  return doc;
}

async function main() {
  console.log(`\nCriando ${articles.length} artigos sobre Nova Friburgo...\n`);
  let ok = 0;
  let fail = 0;

  for (const article of articles) {
    try {
      const doc = await createArticle(article);
      console.log(`  ✓ [${doc.$id}] ${article.title.slice(0, 60)}...`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${article.slug}: ${e.message}`);
      fail++;
    }
    // Small delay to avoid rate-limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Concluído: ${ok} criados, ${fail} falhas.\n`);
}

main();
