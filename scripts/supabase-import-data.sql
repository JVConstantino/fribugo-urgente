-- Supabase Data Import SQL
-- Generated for migration from Appwrite

BEGIN;

-- articles: 7 records
INSERT INTO articles ("id", "authorId", "categoryId", "content", "coverImageId", "excerpt", "isBreaking", "isPublished", "publishedAt", "slug", "tags", "title", "views", "created_at") VALUES
('69e0ddf800198f777a8d', '69e00d2d3cf3832359a5', 'cidade', '<p>A Prefeitura de Nova Friburgo deu inicio a segunda fase das obras de revitalizacao do centro historico da cidade nesta segunda-feira. O projeto, que conta com investimento de R$ 8,5 milhoes do governo estadual, preve a reforma de calcadas, iluminacao publica em LED e restauracao de fachadas de predios tombados pelo patrimonio historico.</p>
<p>O secretario municipal de Obras, engenheiro Carlos Mendes, explicou que os trabalhos serao divididos em tres etapas. "A primeira etapa contempla a Rua General Osorio e a Praca Getulio Vargas. Em seguida, passaremos para a Rua Monsenhor Miranda e, por fim, faremos a revitalizacao completa da orla do Rio Bengalas", detalhou.</p>
<p>Os moradores e comerciantes da regiao foram notificados com antecedencia sobre os desvios de trafego que serao necessarios durante as obras. A expectativa e que o fluxo de turistas aumente em ate 40% apos a conclusao dos trabalhos, segundo dados da Secretaria de Turismo.</p>
<p>O projeto foi elaborado em parceria com o Instituto do Patrimonio Historico e Artistico Nacional (IPHAN), garantindo que todas as intervencoes respeitem as caracteristicas arquitetonicas do seculo XIX que fazem de Nova Friburgo uma das cidades mais charmosas da Serra Fluminense.</p>', '69e0f22e001ba8b41df5', 'A Prefeitura de Nova Friburgo deu inicio a segunda fase das obras de revitalizacao do centro historico da cidade, com previsao de conclusao para o segundo semestre deste ano.', false, true, '2026-04-15T16:02:00.000+00:00', 'obras-revitalizacao-centro-historico-nova-friburgo', '{"obras","centro historico","revitalizacao","patrimonio"}', 'Obras de revitalizacao do centro historico de Nova Friburgo sao retomadas', 0, '2026-05-03T23:56:48.723+00:00'),
('69e0ddfe000673b58d07', '69e00d2d3cf3832359a5', 'saude', '<p>O Hospital Municipal Raul Serta, principal unidade de saude publica de Nova Friburgo, recebeu nesta semana uma remessa de novos equipamentos para a Unidade de Terapia Intensiva adulto. O investimento total de R$ 2,3 milhoes e proveniente de emenda parlamentar do deputado estadual Marcio Ribeiro e de recursos proprios do municipio.</p>
<p>Entre os equipamentos adquiridos estao 12 novos respiradores mecanicos, 8 monitores multiparametricos, bombas de infusao e um ultrassom portatil. Com os novos equipamentos, a capacidade da UTI passara de 16 para 24 leitos ativos, representando um aumento de 50% na capacidade instalada.</p>
<p>A diretora do hospital, Dra. Fernanda Costa, ressaltou a importancia dos novos equipamentos para o atendimento da populacao serrana. "Nova Friburgo e referencia em saude para mais de 20 municipios da regiao. Com essa ampliacao, poderemos atender com mais rapidez e seguranca os casos de maior gravidade", explicou.</p>
<p>A previsao e que os novos leitos de UTI entrem em funcionamento ate o final deste mes, apos a instalacao dos equipamentos e a capacitacao da equipe de enfermagem para operacao dos novos dispositivos.</p>', '69e0f28300214e8e4598', 'Investimento de R$ 2,3 milhoes permitira ampliar o numero de leitos de UTI no principal hospital publico de Nova Friburgo, reduzindo o tempo de espera por atendimento de alta complexidade.', false, true, '2026-04-12T16:02:00.000+00:00', 'hospital-raul-serta-novos-equipamentos-uti', '{"saude","hospital","UTI","investimento"}', 'Hospital Municipal Raul Serta recebe novos equipamentos para UTI adulto', 0, '2026-05-03T23:56:49.790+00:00'),
('69e0ddff0029bb2163c7', '69e00d2d3cf3832359a5', 'educacao', '<p>O Centro Federal de Educacao Tecnologica Celso Suckow da Fonseca (CEFET-RJ) inaugurou nesta quinta-feira seu novo campus em Nova Friburgo. A unidade, localizada no bairro Campo do Coelho, representa um investimento federal de R$ 45 milhoes e atendera exclusivamente a area de tecnologia e engenharia.</p>
<p>Os cursos oferecidos na nova unidade sao: Engenharia de Software (bacharelado, 4 anos), Automacao Industrial (bacharelado, 4 anos) e Tecnico em Informatica (integrado ao ensino medio, 3 anos). No primeiro semestre letivo serao abertas 280 vagas, com previsao de ampliar para 800 alunos matriculados ate 2027.</p>
<p>A cerimonia de inauguracao contou com a presenca do reitor do CEFET-RJ, Prof. Dr. Marcio Silveira, e do prefeito de Nova Friburgo, que destacou a importancia do campus para o desenvolvimento regional. "Estamos formando os profissionais que vao impulsionar nossa economia nas proximas decadas", afirmou o prefeito.</p>
<p>As inscricoes para o processo seletivo do segundo semestre de 2025 serao abertas em julho, pelo Sistema de Selecao Unificada (SISU) e pelo processo seletivo proprio da instituicao.</p>', NULL, 'A nova unidade do Centro Federal de Educacao Tecnologica oferecera cursos de Engenharia de Software, Automacao Industrial e Tecnico em Informatica, com capacidade para 800 alunos.', false, true, '2026-04-11T13:02:48.390+00:00', 'cefet-rj-inaugura-campus-nova-friburgo-tecnologia', '{"educacao","CEFET","tecnologia","campus"}', 'CEFET-RJ inaugura novo campus em Nova Friburgo com foco em tecnologia', 0, '2026-05-03T23:56:50.027+00:00'),
('69e0de01000d5e6d21b1', '69e00d2d3cf3832359a5', 'meio-ambiente', '<p>Um ambicioso projeto de reflorestamento esta recuperando areas degradadas na Serra dos Orgaos, nos arredores de Nova Friburgo. A iniciativa, coordenada pela ONG Mata Atlantica Viva em parceria com a Prefeitura Municipal e o Instituto Estadual do Ambiente (INEA), ja restaurou 500 hectares de floresta nativa desde o inicio das atividades, em 2023.</p>
<p>Ao longo dos dois anos de projeto, foram plantadas mais de 80 mil mudas de especies nativas da Mata Atlantica, como jequitiba-rosa, ipe-amarelo, cedro e imbuia. A taxa de sobrevivencia das mudas e de 78%, acima da media nacional para projetos similares, segundo os coordenadores.</p>
<p>Alem da recuperacao ambiental, o projeto gerou 45 empregos diretos para moradores da regiao, que trabalham como viveiristas e plantadores. "Estamos provando que e possivel conciliar geracao de renda com preservacao ambiental na Serra Fluminense", afirmou Beatriz Nunes, coordenadora geral da ONG.</p>
<p>A meta e recuperar mais 300 hectares ate o final de 2025, priorizando areas que foram devastadas pelas enchentes de 2011. O projeto conta com financiamento do Fundo Nacional de Meio Ambiente e doacoes de empresas locais.</p>', NULL, 'A iniciativa, liderada pela ONG Mata Atlantica Viva em parceria com a Prefeitura de Nova Friburgo, ja plantou mais de 80 mil mudas de especies nativas nos ultimos dois anos.', false, true, '2026-04-10T13:02:48.390+00:00', 'projeto-reflorestamento-recupera-500-hectares-serra', '{"meio ambiente","reflorestamento","Mata Atlantica","sustentabilidade"}', 'Projeto de reflorestamento recupera 500 hectares na regiao serrana', 0, '2026-05-03T23:56:50.281+00:00'),
('69e0de0c000990596ccc', '69e00d2d3cf3832359a5', 'economia', '<p>O setor de moda intima de Nova Friburgo encerrou 2024 com exportacoes recordes, totalizando R$ 52 milhoes em vendas para mercados externos. O resultado representa crescimento de 22% em relacao a 2023 e consolida a cidade como o maior polo produtor de lingerie e moda intima do Brasil, segundo dados do Sindicato da Industria de Fiacao e Tecelagem (SINDITEXTIL-RJ).</p>
<p>Os principais destinos das exportacoes friburguenses foram Argentina, Chile, Colombia, Portugal e Estados Unidos. O crescimento no mercado americano foi o mais expressivo, com aumento de 45% nas vendas, impulsionado pelo cambio favoravel e pela qualidade reconhecida internacionalmente dos produtos da cidade.</p>
<p>O polo conta atualmente com 412 empresas ativas no setor textil, sendo 180 delas voltadas exclusivamente para moda intima. Juntas, empregam diretamente 12.800 trabalhadores no municipio. A Feira Textil de Nova Friburgo, realizada em setembro, atraiu em 2024 mais de 8.000 compradores de 42 paises.</p>
<p>Para 2025, as perspectivas sao ainda mais otimistas. A abertura de novos mercados no Oriente Medio e a participacao em feiras internacionais na Europa devem impulsionar as exportacoes para a marca de R$ 62 milhoes, segundo projecoes da ACINF.</p>', NULL, 'Nova Friburgo consolidou sua posicao como maior polo de moda intima do Brasil, com exportacoes para 35 paises e perspectiva de crescimento de 18% para 2025.', false, true, '2026-04-05T13:02:48.390+00:00', 'setor-moda-intima-nova-friburgo-exporta-52-milhoes-2024', '{"moda intima","exportacao","textil","economia"}', 'Setor de moda intima de Nova Friburgo exporta R$ 52 milhoes em 2024', 0, '2026-05-03T23:56:52.270+00:00'),
('69e0de0e00080a257783', '69e00d2d3cf3832359a5', 'saude', '<p>A campanha de vacinacao contra a dengue em Nova Friburgo superou a meta estabelecida pelo Ministerio da Saude, imunizando 12.340 pessoas em apenas tres semanas de acao. A Secretaria Municipal de Saude havia se comprometido com a imunizacao de 10.000 habitantes na faixa etaria prioritaria (10 a 14 anos).</p>
<p>A vacinacao com a vacina QDENGA esta sendo realizada em todas as 18 Unidades Basicas de Saude do municipio, alem de pontos volantes instalados em escolas, pracas e no shopping center da cidade. A cobertura vacinal atingiu 87% na faixa etaria-alvo, bem acima da meta nacional de 80%.</p>
<p>A secretaria de Saude, Dra. Mariana Figueiredo, destacou o trabalho dos Agentes Comunitarios de Saude para mobilizar a populacao. "Fizemos um trabalho de busca ativa muito intenso, principalmente nas comunidades de dificil acesso na zona rural. O resultado e motivo de muito orgulho para toda a equipe", afirmou.</p>
<p>Nova Friburgo registrou 234 casos confirmados de dengue neste ano, numero 60% inferior ao do mesmo periodo de 2024. A cidade tambem intensificou as acoes de combate ao Aedes aegypti, com mutiroes de limpeza realizados em 8 bairros com maior concentracao de focos do mosquito.</p>', NULL, 'A Secretaria Municipal de Saude superou a meta de vacinacao estabelecida pelo Ministerio da Saude para Nova Friburgo, com destaque para a cobertura nas comunidades mais vulneraveis.', false, true, '2026-04-04T13:02:48.390+00:00', 'campanha-vacinacao-dengue-imuniza-12-mil-nova-friburgo', '{"dengue","vacinacao","saude publica","saude"}', 'Campanha de vacinacao contra dengue imuniza mais de 12 mil em Nova Friburgo', 0, '2026-05-03T23:56:52.507+00:00'),
('69e0de11000893b89f18', '69e00d2d3cf3832359a5', 'cidade', '<p>A Defesa Civil de Nova Friburgo ativou nesta quarta-feira o nivel de alerta laranja apos o acumulo de 180 milimetros de chuva nas ultimas 48 horas na regiao serrana. O volume supera em 60% a media historica para o periodo e acende o sinal de atencao para moradores de areas de encosta e margens de rios.</p>
<p>O coordenador da Defesa Civil municipal, Rodrigo Azevedo, orientou a populacao a ficar atenta aos sinais de risco: rachaduras em paredes, portas e janelas que nao fecham mais, agua ou lama brotando do chao e inclinacao de arvores. "Ao menor sinal de risco, o morador deve abandonar o imovel e acionar o numero 199", orientou.</p>
<p>As areas com maior nivel de atencao sao os bairros Mury, Alto, Conego, Sao Geraldo e partes do Olaria. Equipes da Defesa Civil e do Corpo de Bombeiros estao posicionadas em pontos estrategicos da cidade para atuacao imediata em casos de emergencia. O Ginasio Municipal esta sendo preparado para funcionar como abrigo temporario, com capacidade para 400 pessoas.</p>
<p>O prefeito decretou situacao de emergencia em carater preventivo, o que permite ao municipio acessar recursos estaduais e federais para acoes de resposta. A previsao meteorologica indica que as chuvas devem continuar nas proximas 24 horas, antes de uma melhora no tempo.</p>', '69f811850013129d3d29', 'Com acumulado de 180mm em 48 horas, a Defesa Civil de Nova Friburgo ativou o nivel de alerta laranja e recomenda que moradores de areas de encosta fiquem em estado de atencao.', true, true, '2026-04-16T19:02:00.000+00:00', 'defesa-civil-alerta-deslizamentos-chuvas-serra-friburgo', '{"defesa civil","chuvas","deslizamento","emergencia","alerta"}', 'Defesa Civil alerta para risco de deslizamentos apos chuvas intensas na serra', 31, '2026-05-03T23:56:52.742+00:00')
ON CONFLICT (id) DO NOTHING;

-- categories: 10 records
INSERT INTO categories ("id", "color", "icon", "name", "slug", "sortOrder") VALUES
('cidade', '#dc2626', '🏛️', 'Cidade', 'cidade', 1),
('economia', '#059669', '💰', 'Economia', 'economia', 4),
('esportes', '#ea580c', '⚽', 'Esportes', 'esportes', 5),
('cultura', '#db2777', '🎉', 'Cultura', 'cultura', 8),
('tecnologia', '#4f46e5', '📺', 'Tecnologia', 'tecnologia', 9),
('meio-ambiente', '#65a30d', '🍀', 'Meio Ambiente', 'meio-ambiente', 10),
('politica', '#1d4ed8', '🏤', 'Política', 'politica', 2),
('seguranca', '#7c3aed', '🚨', 'Segurança', 'seguranca', 3),
('saude', '#0891b2', '🏥', 'Saúde', 'saude', 6),
('educacao', '#ca8a04', '🎓', 'Educação', 'educacao', 7)
ON CONFLICT (id) DO NOTHING;

-- ads: 2 records
INSERT INTO ads ("id", "clicks", "endsAt", "format", "imageId", "impressions", "isActive", "linkUrl", "pages", "startsAt", "title") VALUES
('69e0c9a00006e991cf90', 0, '2026-05-16T11:34:00.000+00:00', 'sidebar', '69f813c9002d7f28ebd1', 95, true, 'google.com', '{"home","all","category","article"}', '2026-04-03T11:34:00.000+00:00', 'Teste 2'),
('69e0ca580020abd3dbeb', 0, '2026-05-23T11:38:00.000+00:00', 'banner', '69f81381001a46042013', 119, true, 'google.com', '{"home","all","category","article"}', '2026-04-02T11:38:00.000+00:00', 'Teste 3')
ON CONFLICT (id) DO NOTHING;

-- whatsapp_groups: 1 records
INSERT INTO whatsapp_groups ("id", "category", "description", "imageId", "isActive", "link", "sortOrder", "title") VALUES
('69e0bcf30000a2c71333', 'Noticias', 'Grupo de noticias 01', '69e0bce5000a7013fc94', true, 'https://lexical.dev/docs/api/', 0, 'Friburgo Noticias 01')
ON CONFLICT (id) DO NOTHING;

-- user_news: no data

-- newsletter: no data

-- ai_config: no data

-- system_settings: 1 records
INSERT INTO system_settings ("id", "key", "value") VALUES
('69f8c5650007406f4d7c', 'n8n_webhook_url', 'https://friburgourgente-n8n.veuxld.easypanel.host/webhook-test/2aad6702-108c-4ed5-9a3b-a57bc6698a29')
ON CONFLICT (id) DO NOTHING;

-- popups: no data

COMMIT;
