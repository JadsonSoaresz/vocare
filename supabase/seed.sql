-- ============================================================
-- VOCARE — Seed Data
-- seed.sql · Profissões/cursos para o MVP — Piauí / Brasil 2025
-- Cobre a diversidade de cursos ofertados por UFPI, UESPI, IFPI
-- e faculdades privadas (Uninovafapi, FACID Wyden, Estácio etc.)
-- ============================================================

-- ── Limpar dados existentes ───────────────────────────────────
DELETE FROM career_recommendations;
DELETE FROM career_plans;
DELETE FROM professions;

-- ── Inserir 45 profissões/cursos ─────────────────────────────────────
INSERT INTO professions (name, area, description, education_required, salary_range, market_outlook, tags, vlog_url) VALUES

-- 1. Engenheiro(a) de Software
(
  'Engenheiro(a) de Software',
  'Tecnologia',
  'O engenheiro de software cria os sistemas, aplicativos e plataformas digitais que movem o mundo moderno — de aplicativos de delivery até sistemas bancários. Em Teresina, startups e empresas de tecnologia estão contratando cada vez mais, e a maioria das vagas permite trabalho remoto para qualquer lugar do Brasil e do mundo. Para entrar nessa carreira, você precisa aprender lógica de programação e linguagens como Python, JavaScript ou Java — e hoje existem cursos gratuitos de altíssima qualidade na internet. É uma das profissões com maior crescimento e melhor remuneração do mercado brasileiro, e você pode começar a aprender ainda no ensino médio.',
  'bachelors',
  '{"min": 4000, "max": 18000}',
  'growing',
  ARRAY['programação', 'resolução de problemas', 'lógica computacional', 'trabalho em equipe', 'aprendizado contínuo'],
  'https://www.youtube.com/watch?v=N1OgAYjTTkA'
),

-- 2. Cientista de Dados
(
  'Cientista de Dados',
  'Tecnologia',
  'O cientista de dados analisa enormes volumes de informação para descobrir padrões escondidos e ajudar empresas e governos a tomar decisões mais inteligentes. No Piauí, essa habilidade pode ser usada para melhorar políticas públicas, otimizar a produção agrícola no MATOPIBA ou prever riscos de saúde no interior do estado. A profissão exige uma combinação rara de estatística, programação em Python ou R e visão de negócios — por isso é uma das mais bem pagas da área de tecnologia. O mercado brasileiro está com enorme escassez de profissionais qualificados, o que significa ótimas oportunidades para quem começar a se preparar agora.',
  'bachelors',
  '{"min": 5000, "max": 20000}',
  'growing',
  ARRAY['análise de dados', 'programação Python', 'estatística', 'machine learning', 'visualização de dados'],
  'https://www.youtube.com/watch?v=zkPJfqzc0hU'
),

-- 3. Designer UX/UI
(
  'Designer UX/UI',
  'Tecnologia',
  'O designer de UX/UI é o profissional que pensa em como as pessoas vão usar um aplicativo ou site, tornando a experiência intuitiva, bonita e funcional. Ele une criatividade artística com empatia pelo usuário e ferramentas digitais como Figma e Adobe XD. É uma das profissões que mais cresce em startups e agências digitais brasileiras, com muitas vagas remotas acessíveis de qualquer cidade do Piauí. Se você gosta de design, gosta de resolver problemas visuais e quer trabalhar com tecnologia sem precisar programar muito, essa pode ser a sua área ideal.',
  'bachelors',
  '{"min": 3500, "max": 14000}',
  'growing',
  ARRAY['design de interfaces', 'empatia com o usuário', 'prototipagem', 'Figma', 'pensamento criativo'],
  'https://www.youtube.com/watch?v=XnDTLaNlNj8'
),

-- 4. Analista de Cibersegurança
(
  'Analista de Cibersegurança',
  'Tecnologia',
  'O analista de cibersegurança é o profissional que protege sistemas, redes e dados de empresas e governos contra ataques hackers e vazamentos de informações. Com o avanço da digitalização de serviços públicos no Piauí e em todo o Brasil, a demanda por esses especialistas cresceu de forma explosiva nos últimos anos. O profissional realiza testes de invasão (pentest), monitora ameaças e cria políticas de segurança — e pode trabalhar de forma remota para empresas do mundo inteiro. É uma das áreas com maior escassez de talentos no Brasil, com salários que superam a média da área de TI já nos primeiros anos de carreira.',
  'bachelors',
  '{"min": 5000, "max": 22000}',
  'growing',
  ARRAY['segurança da informação', 'hacking ético', 'análise de vulnerabilidades', 'redes de computadores', 'pensamento analítico'],
  'https://www.youtube.com/watch?v=hhF2MjMJBV8'
),

-- 5. Médico(a)
(
  'Médico(a)',
  'Saúde',
  'O médico é o profissional responsável por diagnosticar doenças, indicar tratamentos e promover a saúde da população — uma das carreiras mais respeitadas e essenciais da sociedade brasileira. No Piauí, existe grande necessidade de médicos tanto em Teresina quanto nos municípios do interior, com vagas no SUS, em concursos estaduais e em clínicas privadas. A formação é longa — seis anos de graduação mais residência médica —, mas a remuneração e o impacto social são excepcionais. Especialidades como medicina de família, pediatria e clínica geral têm altíssima demanda no interior piauiense.',
  'bachelors',
  '{"min": 8000, "max": 35000}',
  'stable',
  ARRAY['ciências biológicas', 'raciocínio clínico', 'empatia', 'responsabilidade', 'trabalho sob pressão'],
  'https://www.youtube.com/watch?v=9Hottb2i4d4'
),

-- 6. Enfermeiro(a)
(
  'Enfermeiro(a)',
  'Saúde',
  'O enfermeiro é peça fundamental no sistema de saúde brasileiro, atuando diretamente no cuidado de pacientes em hospitais, Unidades Básicas de Saúde, UTIs e programas de saúde da família. No Piauí, o SUS absorve muitos profissionais de enfermagem por meio de concursos públicos municipais e estaduais, garantindo estabilidade e bons benefícios. O curso de graduação dura quatro anos e pode ser feito em diversas universidades públicas e privadas de Teresina. É uma carreira de grande impacto humano, ideal para quem tem vocação para cuidar e quer fazer diferença na vida das pessoas.',
  'bachelors',
  '{"min": 3000, "max": 9000}',
  'growing',
  ARRAY['cuidados com pacientes', 'procedimentos clínicos', 'saúde pública', 'empatia', 'trabalho em equipe'],
  'https://www.youtube.com/watch?v=bnWu9MKrgAQ'
),

-- 7. Psicólogo(a)
(
  'Psicólogo(a)',
  'Saúde',
  'O psicólogo estuda o comportamento humano e oferece suporte emocional, psicoterapia e orientação para indivíduos, famílias e organizações. Com o aumento da conscientização sobre saúde mental no Brasil, a demanda pela profissão cresceu muito nos últimos anos — especialmente entre jovens e adolescentes. Em Teresina, psicólogos atuam em clínicas particulares, no CAPS (Centro de Atenção Psicossocial), em escolas públicas e em empresas. A psicologia digital e os atendimentos online também abriram um novo mercado, permitindo que profissionais do Piauí atendam clientes de todo o Brasil.',
  'bachelors',
  '{"min": 2500, "max": 12000}',
  'growing',
  ARRAY['escuta ativa', 'saúde mental', 'psicoterapia', 'avaliação psicológica', 'empatia'],
  'https://www.youtube.com/watch?v=oUCyTOhKBbU'
),

-- 8. Professor(a) do Ensino Médio
(
  'Professor(a) do Ensino Médio',
  'Educação',
  'O professor é o profissional que transforma vidas ao transmitir conhecimento, desenvolver o pensamento crítico e preparar jovens para o futuro — exatamente o que você está vivendo agora. No Piauí, concursos para a rede estadual de ensino são realizados com frequência, garantindo estabilidade, férias, FGTS e benefícios públicos aos aprovados. A carreira docente oferece liberdade para escolher a disciplina de paixão — matemática, biologia, história, inglês — e atuar em escolas do interior ou na capital. Com o PISO nacional do magistério, a remuneração tem melhorado, e professores com pós-graduação e cursos de especialização ganham mais.',
  'bachelors',
  '{"min": 2500, "max": 8000}',
  'stable',
  ARRAY['didática', 'comunicação clara', 'planejamento de aulas', 'liderança', 'paixão por ensinar'],
  'https://www.youtube.com/watch?v=Y9tNU4Uf6iw'
),

-- 9. Pedagogo(a)
(
  'Pedagogo(a)',
  'Educação',
  'O pedagogo coordena processos educativos, orienta professores, desenvolve projetos pedagógicos e trabalha para melhorar a qualidade do ensino nas escolas. Além das escolas, esse profissional atua cada vez mais em empresas na área de Treinamento e Desenvolvimento (T&D), ajudando equipes a aprender e crescer. No Piauí, concursos para pedagogos nas redes municipais e estadual abrem regularmente, oferecendo boa estabilidade profissional. É uma carreira ideal para quem ama educação mas prefere atuar na gestão e organização pedagógica do que diretamente em sala de aula.',
  'bachelors',
  '{"min": 2200, "max": 7000}',
  'stable',
  ARRAY['coordenação pedagógica', 'gestão educacional', 'elaboração de projetos', 'orientação de professores', 'avaliação escolar'],
  'https://www.youtube.com/watch?v=KzW0a6HJHOo'
),

-- 10. Engenheiro(a) Civil
(
  'Engenheiro(a) Civil',
  'Engenharia',
  'O engenheiro civil projeta e supervisiona a construção de edifícios, pontes, estradas, barragens e toda a infraestrutura que sustenta uma cidade moderna. Em Teresina e no interior do Piauí, obras de saneamento básico, habitação popular e infraestrutura rodoviária geram demanda contínua por esses profissionais. O curso dura cinco anos e combina física, matemática, resistência de materiais e gestão de obras. Com registro no CREA, o engenheiro civil pode abrir sua própria construtora ou prestar serviços como autônomo, além de atuar em concursos públicos de prefeituras e do governo estadual.',
  'bachelors',
  '{"min": 4500, "max": 16000}',
  'stable',
  ARRAY['projetos estruturais', 'gestão de obras', 'cálculo e física', 'AutoCAD', 'planejamento urbano'],
  'https://www.youtube.com/watch?v=LOYDDVzRm60'
),

-- 11. Engenheiro(a) Elétrico(a)
(
  'Engenheiro(a) Elétrico(a)',
  'Engenharia',
  'O engenheiro elétrico projeta sistemas de geração, transmissão e distribuição de energia, além de trabalhar com automação industrial, telecomunicações e energia renovável. O Piauí tem um dos maiores potenciais de energia solar e eólica do Brasil, e projetos de parques de energia limpa no estado estão gerando centenas de vagas para esses profissionais. A transição energética global torna essa uma das engenharias com maior crescimento nos próximos 20 anos. Quem se formar em engenharia elétrica com foco em energias renováveis tem perspectivas excelentes tanto no mercado nacional quanto internacional.',
  'bachelors',
  '{"min": 5000, "max": 18000}',
  'growing',
  ARRAY['sistemas elétricos', 'energia renovável', 'automação industrial', 'eletrônica', 'cálculo aplicado'],
  'https://www.youtube.com/watch?v=swnn4mgceyQ'
),

-- 12. Advogado(a)
(
  'Advogado(a)',
  'Direito',
  'O advogado defende direitos e interesses de pessoas físicas e jurídicas, presta assessoria jurídica e atua em processos nas mais diversas áreas — trabalhista, civil, penal, tributária e muito mais. No Piauí, além da advocacia privada, o direito abre portas para concursos altamente disputados como Defensoria Pública, Ministério Público, Magistratura e Procuradorias estaduais. O curso de direito dura cinco anos e exige aprovação no Exame da OAB para exercer a profissão — uma prova rigorosa que demanda dedicação. Quem se especializa em áreas em alta, como direito digital, ambiental ou tributário, se destaca no mercado competitivo.',
  'bachelors',
  '{"min": 3000, "max": 20000}',
  'stable',
  ARRAY['argumentação jurídica', 'interpretação de leis', 'escrita formal', 'negociação', 'ética profissional'],
  'https://www.youtube.com/watch?v=wzCc3SZWQEU'
),

-- 13. Jornalista
(
  'Jornalista',
  'Comunicação',
  'O jornalista investiga, apura e comunica informações de interesse público, sendo essencial para a democracia e para manter a sociedade bem informada. No Piauí, emissoras de TV, rádios, portais de notícias e assessorias de comunicação do governo estadual e de prefeituras empregam jornalistas em Teresina e no interior. A transformação digital criou novas oportunidades em podcasts, canais no YouTube, newsletters e redes sociais — permitindo que jornalistas construam audiências próprias. É uma carreira para quem tem curiosidade insaciável, gosta de escrever e quer impactar a sociedade com informação de qualidade.',
  'bachelors',
  '{"min": 2000, "max": 8000}',
  'stable',
  ARRAY['apuração jornalística', 'escrita criativa', 'comunicação oral', 'investigação', 'mídias digitais'],
  'https://www.youtube.com/results?search_query=jornalismo+jornalista+comunicacao+carreira+brasil'
),

-- 14. Publicitário(a) / Marketing Digital
(
  'Publicitário(a) / Marketing Digital',
  'Comunicação',
  'O publicitário cria campanhas que conectam marcas às pessoas, combinando criatividade, estratégia e cada vez mais o uso de dados digitais. Com o crescimento do comércio eletrônico e das redes sociais, o marketing digital explodiu no Brasil — e agências de Teresina já atendem clientes de todo o país. O profissional de marketing digital domina ferramentas como Google Ads, Meta Ads, SEO e análise de métricas para gerar resultados mensuráveis para os negócios. É uma área onde é possível construir uma carreira freelancer de alto rendimento trabalhando de qualquer cidade do Piauí com acesso à internet.',
  'bachelors',
  '{"min": 2500, "max": 12000}',
  'growing',
  ARRAY['marketing digital', 'criação de conteúdo', 'gestão de redes sociais', 'tráfego pago', 'análise de métricas'],
  'https://www.youtube.com/watch?v=mfrOIRj7gT8'
),

-- 15. Administrador(a) de Empresas
(
  'Administrador(a) de Empresas',
  'Administração',
  'O administrador gerencia recursos humanos, financeiros e operacionais de organizações públicas e privadas, garantindo eficiência e crescimento sustentável. É uma das graduações mais versáteis do Brasil — formandos em administração atuam em finanças, recursos humanos, marketing, logística, comércio exterior e muito mais. Em Teresina, empresas do setor de serviços, comércio e indústria alimentícia absorvem muitos administradores. Concursos públicos para cargos administrativos em prefeituras, governo do Piauí e autarquias estaduais também são uma excelente opção de carreira estável.',
  'bachelors',
  '{"min": 2500, "max": 12000}',
  'stable',
  ARRAY['gestão empresarial', 'liderança de equipes', 'planejamento estratégico', 'análise financeira', 'tomada de decisão'],
  'https://www.youtube.com/watch?v=GYKBrgFK7tg'
),

-- 16. Empreendedor(a) Social
(
  'Empreendedor(a) Social',
  'Administração',
  'O empreendedor social cria negócios que geram impacto positivo na comunidade enquanto também são financeiramente sustentáveis — unindo lucro e propósito. No Piauí, há espaço enorme para negócios que resolvam problemas reais: acesso à educação no interior, geração de renda no campo, soluções de saúde para populações vulneráveis e muito mais. Não existe um caminho único de formação — o que importa é identificar um problema, testar soluções e aprender rápido com os erros. Programas como Sebrae Jovem, Enactus e aceleradoras sociais ajudam jovens empreendedores piauienses a transformar boas ideias em negócios reais.',
  'high_school',
  '{"min": 0, "max": 50000}',
  'growing',
  ARRAY['identificação de oportunidades', 'inovação social', 'liderança', 'gestão de projetos', 'resiliência'],
  'https://www.youtube.com/results?search_query=empreendedorismo+jovem+startup+brasil'
),

-- 17. Engenheiro(a) Agrônomo(a)
(
  'Engenheiro(a) Agrônomo(a)',
  'Agronegócio',
  'O engenheiro agrônomo desenvolve tecnologias e técnicas para aumentar a produção de alimentos de forma eficiente e sustentável, sendo peça-chave do agronegócio brasileiro. O Piauí está no coração do MATOPIBA — a mais nova fronteira agrícola do Brasil, que engloba Maranhão, Tocantins, Piauí e Bahia —, gerando altíssima demanda por agrônomos na região sul do estado. O profissional atua em lavouras de soja, milho, algodão e mandioca, além de trabalhar com irrigação, solos, pragas e defesa agropecuária. É uma carreira com excelente empregabilidade no estado e possibilidade de atuar em empresas de insumos, cooperativas e órgãos como Embrapa e Adapi.',
  'bachelors',
  '{"min": 3500, "max": 14000}',
  'growing',
  ARRAY['manejo de solo e culturas', 'tecnologias agrícolas', 'sustentabilidade', 'ciências biológicas', 'gestão rural'],
  'https://www.youtube.com/watch?v=AulS7GiJ8Bw'
),

-- 18. Músico(a) / Produtor(a) Musical
(
  'Músico(a) / Produtor(a) Musical',
  'Artes',
  'O músico e produtor musical cria, interpreta e registra obras sonoras — podendo atuar como artista solo, compositor, produtor de estúdio, professor de música ou técnico de som em eventos. O Piauí tem uma cena cultural rica, com forró eletrônico, música de raiz, bandas de rock e artistas independentes que constroem carreiras usando plataformas como Spotify, YouTube e TikTok. Com um computador e um software de produção como o FL Studio ou Ableton, é possível produzir músicas de qualidade profissional de qualquer cidade do estado. A carreira exige disciplina e reinvenção constante, mas a era do streaming democratizou o acesso ao mercado musical de forma inédita.',
  'technical',
  '{"min": 1500, "max": 15000}',
  'stable',
  ARRAY['teoria musical', 'produção de áudio', 'instrumento musical', 'composição', 'marketing artístico'],
  'https://www.youtube.com/watch?v=-w2vzDmBPlM'
),

-- 19. Biólogo(a)
(
  'Biólogo(a)',
  'Ciências',
  'O biólogo estuda os seres vivos — animais, plantas, microrganismos e ecossistemas — e aplica esse conhecimento na pesquisa científica, saúde pública, educação e preservação ambiental. O Piauí abriga biomas únicos como o Cerrado e a Caatinga, além de parques nacionais como a Serra da Capivara, criando oportunidades para biólogos que trabalham com pesquisa e ecoturismo. A biotecnologia e a bioinformática são novas fronteiras da biologia que estão gerando empregos bem remunerados no Brasil. Biólogos também atuam em licenciamentos ambientais de obras, no controle de vetores de doenças e em laboratórios clínicos e de análises ambientais.',
  'bachelors',
  '{"min": 2500, "max": 9000}',
  'stable',
  ARRAY['ecologia e meio ambiente', 'pesquisa científica', 'análise laboratorial', 'zoologia e botânica', 'educação ambiental'],
  'https://www.youtube.com/watch?v=PdHGEV8C2mQ'
),

-- 20. Agente de Segurança Pública
(
  'Agente de Segurança Pública',
  'Segurança',
  'O agente de segurança pública — policial civil, policial militar, bombeiro ou agente penitenciário — garante a ordem, protege cidadãos e atua na prevenção e investigação de crimes. No Piauí, a Polícia Militar, a Polícia Civil e o Corpo de Bombeiros realizam concursos com regularidade, oferecendo salários iniciais competitivos, estabilidade, plano de carreira e aposentadoria. A carreira exige preparo físico, psicológico e intelectual, pois o candidato passa por rigorosas fases de seleção incluindo prova escrita, teste físico e investigação social. Para jovens que valorizam servir à comunidade, têm disciplina e buscam estabilidade financeira, é uma excelente porta de entrada no serviço público.',
  'high_school',
  '{"min": 3500, "max": 9000}',
  'stable',
  ARRAY['preparo físico', 'legislação penal', 'trabalho em equipe', 'tomada de decisão sob pressão', 'ética e disciplina'],
  'https://www.youtube.com/watch?v=4isANtPQcbk'
),

-- 21. Odontologia
(
  'Odontologia',
  'Saúde',
  'O cirurgião-dentista cuida da saúde bucal, realizando desde limpezas e restaurações até cirurgias e tratamentos estéticos como próteses e alinhamento dental. A UFPI forma dentistas em Teresina há décadas, e o Piauí conta com Centros de Especialidades Odontológicas (CEO) do SUS em vários municípios, além de um mercado privado aquecido pela busca por harmonização facial e ortodontia. É uma carreira que combina habilidade manual, ciência e atendimento humano, com possibilidade de abrir consultório próprio ou se especializar em áreas como implantodontia e odontopediatria.',
  'bachelors',
  '{"min": 3500, "max": 16000}',
  'growing',
  ARRAY['saúde bucal', 'habilidade manual', 'anatomia', 'atendimento a pacientes', 'ética profissional'],
  'https://www.youtube.com/watch?v=Y0lYRa0yd90'
),

-- 22. Fisioterapia
(
  'Fisioterapia',
  'Saúde',
  'O fisioterapeuta previne, trata e reabilita lesões e limitações do corpo humano, atuando em hospitais, clínicas, academias, times esportivos e no atendimento domiciliar. No Piauí, o envelhecimento da população e o crescimento das academias e clínicas de estética em Teresina têm ampliado as oportunidades para esse profissional, que também é essencial na rede pública de saúde e em programas de atenção domiciliar no interior do estado. É uma carreira indicada para quem gosta de anatomia, cuidado com pessoas e resultados práticos e visíveis no dia a dia dos pacientes.',
  'bachelors',
  '{"min": 2500, "max": 10000}',
  'growing',
  ARRAY['reabilitação física', 'anatomia humana', 'cuidado com pacientes', 'pilates clínico', 'empatia'],
  'https://www.youtube.com/watch?v=WYW2F8Xeu0M'
),

-- 23. Nutrição
(
  'Nutrição',
  'Saúde',
  'O nutricionista orienta a alimentação de indivíduos e comunidades, atuando em hospitais, escolas, indústrias de alimentos, clínicas de estética e consultórios particulares. No Piauí, esses profissionais trabalham tanto no combate à desnutrição em municípios do interior quanto no crescente mercado de nutrição esportiva e estética em Teresina. A profissão combina bioquímica, comportamento humano e educação alimentar, e o nutricionista pode atuar de forma autônoma, montando consultoria online para clientes de qualquer lugar do Brasil.',
  'bachelors',
  '{"min": 2200, "max": 9000}',
  'growing',
  ARRAY['alimentação saudável', 'bioquímica', 'educação nutricional', 'saúde pública', 'atendimento clínico'],
  'https://www.youtube.com/watch?v=PmDeV8ZQ-iA'
),

-- 24. Farmácia
(
  'Farmácia',
  'Saúde',
  'O farmacêutico garante o uso correto e seguro dos medicamentos, atuando em farmácias, hospitais, laboratórios de análises clínicas e na indústria farmacêutica. Em Teresina, a rede de drogarias é uma das que mais emprega no comércio, e o farmacêutico responsável técnico é obrigatório por lei em cada estabelecimento, garantindo estabilidade de emprego. Além do balcão, o profissional pode seguir carreira em análises clínicas, manipulação de fórmulas ou vigilância sanitária em prefeituras e no governo do estado.',
  'bachelors',
  '{"min": 2500, "max": 11000}',
  'stable',
  ARRAY['farmacologia', 'atenção farmacêutica', 'análises clínicas', 'gestão de farmácia', 'química'],
  'https://www.youtube.com/watch?v=mNCI8NUA_pU'
),

-- 25. Medicina Veterinária
(
  'Medicina Veterinária',
  'Agronegócio',
  'O médico veterinário cuida da saúde de animais domésticos e de produção, atuando em clínicas, pet shops, granjas, fazendas e na fiscalização sanitária. O Piauí tem forte vocação pecuária, especialmente no sul do estado dentro do MATOPIBA, o que gera demanda por veterinários especializados em grandes animais, além do mercado crescente de clínicas para pets em Teresina. É uma carreira para quem gosta de animais, ciências biológicas e não se importa em trabalhar em campo ou em plantões de emergência.',
  'bachelors',
  '{"min": 3000, "max": 14000}',
  'growing',
  ARRAY['saúde animal', 'clínica veterinária', 'produção pecuária', 'cirurgia', 'controle de zoonoses'],
  'https://www.youtube.com/watch?v=6ihctn_-RjM'
),

-- 26. Zootecnia
(
  'Zootecnia',
  'Agronegócio',
  'O zootecnista trabalha na criação e no melhoramento genético de animais de produção — bovinos, aves, suínos, peixes e caprinos — buscando mais eficiência e sustentabilidade na pecuária. No sul do Piauí, região de forte expansão do agronegócio dentro do MATOPIBA, fazendas e cooperativas têm demandado cada vez mais esses profissionais para melhorar o manejo de rebanhos. O curso é oferecido pela UFPI no campus de Bom Jesus, e o profissional também pode atuar em empresas de nutrição animal, cooperativas rurais e órgãos como a Embrapa.',
  'bachelors',
  '{"min": 3000, "max": 11000}',
  'growing',
  ARRAY['produção animal', 'melhoramento genético', 'manejo de rebanhos', 'nutrição animal', 'gestão rural'],
  'https://www.youtube.com/watch?v=dpviy60qePI'
),

-- 27. Engenharia Florestal
(
  'Engenharia Florestal',
  'Agronegócio',
  'O engenheiro florestal planeja o manejo sustentável de florestas nativas e plantadas, trabalhando com reflorestamento, licenciamento ambiental e produção de madeira e não-madeireiros. O Piauí abriga extensas áreas de Cerrado e Caatinga, e a pressão da expansão agrícola no MATOPIBA torna esse profissional cada vez mais necessário para conciliar produção e conservação ambiental. Formado pela UFPI no campus de Bom Jesus, o engenheiro florestal pode atuar em órgãos ambientais estaduais, empresas de consultoria e projetos de recuperação de áreas degradadas.',
  'bachelors',
  '{"min": 3500, "max": 13000}',
  'growing',
  ARRAY['manejo florestal', 'licenciamento ambiental', 'sustentabilidade', 'geoprocessamento', 'conservação do cerrado e caatinga'],
  'https://www.youtube.com/watch?v=v08CHlSMvSo'
),

-- 28. Engenharia de Pesca
(
  'Engenharia de Pesca',
  'Agronegócio',
  'O engenheiro de pesca desenvolve técnicas de captura sustentável, aquicultura e gestão de recursos pesqueiros em rios, açudes e no litoral. O litoral piauiense, com o Delta do Parnaíba e sua tradição de pesca artesanal, oferece um campo de atuação único para esse profissional, formado pela UFPI no campus de Parnaíba. Além da pesca marinha, há grande potencial de crescimento na piscicultura em açudes do interior do estado, uma alternativa de renda para comunidades rurais que o engenheiro de pesca ajuda a estruturar.',
  'bachelors',
  '{"min": 3200, "max": 11000}',
  'stable',
  ARRAY['aquicultura', 'pesca sustentável', 'gestão de recursos hídricos', 'biologia marinha', 'desenvolvimento comunitário'],
  'https://www.youtube.com/watch?v=4CjpZKgeA9Y'
),

-- 29. Engenharia de Produção
(
  'Engenharia de Produção',
  'Engenharia',
  'O engenheiro de produção otimiza processos dentro de fábricas, empresas de logística e prestadoras de serviço, buscando reduzir custos e aumentar a eficiência. É uma das engenharias mais versáteis, formando profissionais que atuam em indústrias, hospitais, bancos e até startups. Em Teresina, indústrias de alimentos, têxtil e de construção civil contratam engenheiros de produção para melhorar seus processos, e a formação também abre portas para cargos de gestão e consultoria empresarial em qualquer setor da economia.',
  'bachelors',
  '{"min": 4500, "max": 16000}',
  'growing',
  ARRAY['gestão de processos', 'logística', 'controle de qualidade', 'otimização', 'planejamento estratégico'],
  'https://www.youtube.com/watch?v=wPRtLHpzX3o'
),

-- 30. Arquitetura e Urbanismo
(
  'Arquitetura e Urbanismo',
  'Engenharia',
  'O arquiteto projeta espaços — casas, prédios, praças e bairros inteiros — unindo funcionalidade, estética e conforto para quem vai viver e trabalhar neles. Com o crescimento urbano de Teresina e de cidades do interior do Piauí, cresce também a demanda por profissionais capazes de planejar habitação popular, requalificação de centros históricos e projetos sustentáveis adaptados ao clima quente da região. O curso combina criatividade artística com cálculos técnicos, e o arquiteto pode atuar como autônomo, em escritórios ou em órgãos públicos de planejamento urbano.',
  'bachelors',
  '{"min": 3500, "max": 15000}',
  'stable',
  ARRAY['projeto arquitetônico', 'planejamento urbano', 'AutoCAD e Revit', 'sustentabilidade', 'criatividade'],
  'https://www.youtube.com/watch?v=Vw2Wb9qfuv0'
),

-- 31. Engenharia Mecânica
(
  'Engenharia Mecânica',
  'Engenharia',
  'O engenheiro mecânico projeta, constrói e mantém máquinas, motores e sistemas industriais, sendo essencial para a indústria, a manutenção de equipamentos e o setor automotivo. Em Teresina, indústrias de alimentos, cerâmica e construção civil precisam desses profissionais para manter suas linhas de produção funcionando, e o crescimento de usinas solares e eólicas no Piauí também abre espaço para engenheiros mecânicos especializados em geração de energia. É uma engenharia tradicional e sólida, com boas oportunidades em concursos públicos e na iniciativa privada.',
  'bachelors',
  '{"min": 4500, "max": 16000}',
  'stable',
  ARRAY['mecânica dos materiais', 'manutenção industrial', 'termodinâmica', 'automação', 'projetos mecânicos'],
  'https://www.youtube.com/watch?v=qhUMhTHVro0'
),

-- 32. Ciências Contábeis
(
  'Ciências Contábeis',
  'Administração',
  'O contador organiza e analisa as finanças de empresas, ONGs e órgãos públicos, cuidando de impostos, balanços e relatórios financeiros. É uma das profissões mais estáveis do mercado brasileiro, pois toda empresa formal — do pequeno comércio de Teresina às grandes indústrias do Piauí — precisa de um contador. O curso também prepara para concursos públicos em áreas fiscais e de controladoria, e permite abrir um escritório de contabilidade próprio, atendendo dezenas de pequenas empresas ao mesmo tempo.',
  'bachelors',
  '{"min": 2500, "max": 11000}',
  'stable',
  ARRAY['contabilidade', 'análise financeira', 'auditoria', 'legislação tributária', 'atenção a detalhes'],
  'https://www.youtube.com/watch?v=Jw2DU8OpcYg'
),

-- 33. Economia
(
  'Economia',
  'Administração',
  'O economista analisa o comportamento de mercados, preços, empregos e políticas públicas, ajudando empresas e governos a tomar decisões mais informadas. No Piauí, economistas atuam em secretarias de planejamento do governo estadual e das prefeituras, em bancos e cooperativas de crédito, e em consultorias que avaliam o impacto de projetos como os parques de energia renovável no estado. A formação é forte em estatística e raciocínio lógico, e o profissional pode seguir carreira acadêmica, no mercado financeiro ou na gestão pública.',
  'bachelors',
  '{"min": 3000, "max": 14000}',
  'stable',
  ARRAY['análise econômica', 'políticas públicas', 'estatística', 'mercado financeiro', 'pensamento crítico'],
  'https://www.youtube.com/watch?v=TWvIfq62QYk'
),

-- 34. Serviço Social
(
  'Serviço Social',
  'Ciências Sociais',
  'O assistente social defende os direitos de pessoas em situação de vulnerabilidade, atuando em CRAS, CAPS, hospitais, escolas e empresas. É uma profissão de enorme relevância no Piauí, onde as redes de assistência social dos municípios do interior dependem desses profissionais para executar programas como o Bolsa Família e o atendimento a famílias em situação de risco. O curso, oferecido pela UESPI e pela UFPI, forma profissionais com forte compromisso social, escuta ativa e conhecimento de políticas públicas, com boa demanda em concursos municipais e estaduais.',
  'bachelors',
  '{"min": 2200, "max": 7000}',
  'stable',
  ARRAY['assistência social', 'políticas públicas', 'trabalho comunitário', 'empatia', 'mediação de conflitos'],
  'https://www.youtube.com/watch?v=xwvTdAUt5j4'
),

-- 35. Geografia
(
  'Geografia',
  'Educação',
  'O geógrafo estuda o espaço, o território e a relação entre sociedade e meio ambiente, atuando como professor, em geoprocessamento, planejamento urbano ou defesa civil. No Piauí, com sua diversidade de biomas — Cerrado, Caatinga e Zona Costeira — o geógrafo tem papel importante em estudos ambientais, mapeamento de riscos de enchentes e seca, e no ensino nas escolas estaduais. O curso combina trabalho de campo com tecnologias como sistemas de informação geográfica (SIG), muito usadas em prefeituras e órgãos de planejamento.',
  'bachelors',
  '{"min": 2200, "max": 7500}',
  'stable',
  ARRAY['cartografia', 'geoprocessamento', 'licenciatura', 'meio ambiente', 'pesquisa de campo'],
  'https://www.youtube.com/watch?v=0eODIgh9kkU'
),

-- 36. História
(
  'História',
  'Educação',
  'O historiador pesquisa, preserva e ensina sobre o passado, atuando como professor, pesquisador, museólogo ou consultor de patrimônio cultural. O Piauí guarda um tesouro histórico único no Parque Nacional Serra da Capivara, com uma das maiores concentrações de sítios arqueológicos das Américas, o que abre oportunidades raras para historiadores interessados em arqueologia e preservação. Além da sala de aula em escolas estaduais, o profissional pode atuar em arquivos públicos, museus e institutos de patrimônio histórico de Teresina e do interior.',
  'bachelors',
  '{"min": 2200, "max": 7000}',
  'stable',
  ARRAY['pesquisa histórica', 'licenciatura', 'patrimônio cultural', 'arquivologia', 'educação patrimonial'],
  'https://www.youtube.com/watch?v=JeWWW1qEBnc'
),

-- 37. Letras
(
  'Letras',
  'Educação',
  'O profissional de Letras domina a língua portuguesa e, muitas vezes, uma língua estrangeira, atuando como professor, revisor de textos, tradutor ou redator. Com a expansão do ensino de inglês e espanhol nas escolas piauienses e o crescimento do mercado de produção de conteúdo digital, o formado em Letras tem cada vez mais opções além da sala de aula, como criar conteúdo para redes sociais ou trabalhar como redator freelancer para empresas de todo o Brasil. É uma carreira sólida para quem ama ler, escrever e ensinar.',
  'bachelors',
  '{"min": 2200, "max": 7000}',
  'stable',
  ARRAY['linguística', 'literatura', 'licenciatura', 'produção textual', 'revisão de texto'],
  'https://www.youtube.com/watch?v=AgFkePj_Zng'
),

-- 38. Matemática
(
  'Matemática',
  'Ciências',
  'O formado em Matemática ensina uma das disciplinas mais valorizadas do currículo escolar e pode seguir carreira acadêmica em pesquisa, estatística ou ciência de dados. No Piauí, professores de matemática são disputados em concursos da rede estadual, e o domínio de raciocínio lógico abre portas também para o mercado de tecnologia, já que muitos profissionais migram para programação e análise de dados. É um curso exigente, mas com excelente empregabilidade tanto na educação quanto em áreas técnicas emergentes.',
  'bachelors',
  '{"min": 2200, "max": 8000}',
  'stable',
  ARRAY['raciocínio lógico', 'licenciatura', 'resolução de problemas', 'ensino de matemática', 'estatística básica'],
  'https://www.youtube.com/watch?v=X4KTgw2tAm8'
),

-- 39. Física
(
  'Física',
  'Ciências',
  'O físico investiga as leis que regem o universo, desde partículas subatômicas até o funcionamento de usinas de energia, atuando em pesquisa, docência ou setores técnicos da indústria. O Piauí tem um dos maiores potenciais de energia solar do Brasil, e físicos com foco em energias renováveis encontram oportunidades em projetos de usinas fotovoltaicas que vêm sendo instalados no estado. Além da pesquisa acadêmica na UFPI, o formado em física pode lecionar no ensino médio ou atuar em laboratórios de metrologia e controle de qualidade.',
  'bachelors',
  '{"min": 2500, "max": 9000}',
  'stable',
  ARRAY['pesquisa científica', 'licenciatura', 'energias renováveis', 'experimentação', 'modelagem matemática'],
  'https://www.youtube.com/watch?v=RrCNK9pQIoU'
),

-- 40. Química
(
  'Química',
  'Ciências',
  'O químico estuda a composição e as transformações da matéria, atuando em laboratórios de análises, indústrias de alimentos e cosméticos, controle de qualidade e docência. Em Teresina, laboratórios de análises clínicas e ambientais, além de indústrias de bebidas e alimentos, empregam químicos para garantir a segurança dos produtos. Formado pela UFPI ou pelo IFPI, o profissional também pode seguir carreira em fiscalização sanitária, perícia criminal ou pesquisa acadêmica em química aplicada às riquezas naturais do Piauí.',
  'bachelors',
  '{"min": 2500, "max": 9500}',
  'stable',
  ARRAY['análises laboratoriais', 'licenciatura', 'química industrial', 'segurança química', 'pesquisa científica'],
  'https://www.youtube.com/watch?v=Q9rZqoOMLak'
),

-- 41. Educação Física
(
  'Educação Física',
  'Esportes',
  'O profissional de Educação Física atua em escolas, academias, clubes esportivos e programas de saúde pública, promovendo atividade física e qualidade de vida. Em Teresina, o crescimento do número de academias e das corridas de rua tem ampliado o mercado para personal trainers e treinadores esportivos, enquanto a licenciatura garante espaço em concursos da rede estadual de ensino. É uma carreira que combina paixão pelo esporte, conhecimento do corpo humano e capacidade de motivar pessoas a mudarem hábitos de vida.',
  'bachelors',
  '{"min": 2200, "max": 8500}',
  'growing',
  ARRAY['treinamento físico', 'licenciatura e bacharelado', 'fisiologia do exercício', 'esporte e lazer', 'trabalho em equipe'],
  'https://www.youtube.com/watch?v=sblGm7cDl0A'
),

-- 42. Análise e Desenvolvimento de Sistemas
(
  'Análise e Desenvolvimento de Sistemas',
  'Tecnologia',
  'É um curso tecnólogo, mais curto que a graduação tradicional em Ciência da Computação, que forma programadores e desenvolvedores de software prontos para o mercado em cerca de dois anos e meio. Oferecido pelo IFPI e por faculdades particulares de Teresina, é uma porta de entrada rápida para a área de tecnologia, com aulas focadas em programação prática, banco de dados e desenvolvimento web. Para estudantes do Piauí que querem começar a trabalhar com tecnologia sem esperar quatro ou cinco anos de faculdade, é uma das opções mais objetivas do mercado.',
  'technical',
  '{"min": 3000, "max": 12000}',
  'growing',
  ARRAY['programação', 'banco de dados', 'desenvolvimento web', 'curso tecnólogo curto', 'lógica de programação'],
  'https://www.youtube.com/watch?v=iM12rAuMOWM'
),

-- 43. Design de Moda
(
  'Design de Moda',
  'Moda',
  'O designer de moda cria roupas, acessórios e coleções, unindo criatividade, conhecimento de tecidos e sensibilidade às tendências de mercado. O Piauí tem uma tradição têxtil forte, com destaque para a renda renascença e o bordado artesanal de cidades como Buriti dos Lopes, um patrimônio cultural que designers locais têm reinventado em coleções contemporâneas vendidas para todo o Brasil. Com o crescimento do comércio eletrônico, é possível criar uma marca de moda autoral em Teresina e vender para clientes de qualquer estado, unindo tradição regional e inovação.',
  'bachelors',
  '{"min": 2000, "max": 9000}',
  'growing',
  ARRAY['criação de moda', 'modelagem e costura', 'tendências de mercado', 'marketing de moda', 'artesanato têxtil'],
  'https://www.youtube.com/watch?v=vwM8pNKeij0'
),

-- 44. Ciência da Computação
(
  'Ciência da Computação',
  'Tecnologia',
  'O bacharel em Ciência da Computação tem a formação mais completa da área de tecnologia, aprendendo desde algoritmos e estrutura de dados até inteligência artificial e sistemas distribuídos. Oferecido pela UFPI em Teresina, o curso prepara para carreiras acadêmicas em pesquisa, além do mercado de trabalho em empresas de software, bancos e multinacionais de tecnologia — com muitas vagas remotas acessíveis a partir de qualquer cidade do Piauí. É a base mais sólida para quem quer se aprofundar tecnicamente em programação, computação teórica e inovação tecnológica.',
  'bachelors',
  '{"min": 4000, "max": 19000}',
  'growing',
  ARRAY['algoritmos e estrutura de dados', 'programação', 'inteligência artificial', 'matemática discreta', 'pesquisa científica'],
  'https://www.youtube.com/watch?v=OCpIWQhpOh8'
),

-- 45. Turismo
(
  'Turismo',
  'Turismo',
  'O bacharel em Turismo planeja roteiros, gerencia hotéis e agências de viagem, e organiza eventos, valorizando o potencial turístico de uma região. O Piauí tem atrativos turísticos de peso — o Parque Nacional Serra da Capivara, patrimônio da humanidade pela UNESCO, e as praias e dunas do Delta do Parnaíba, no litoral —, mas ainda pouco explorados, o que representa uma grande oportunidade para profissionais formados na UFPI de Picos e Parnaíba. A carreira é ideal para quem gosta de viajar, de história local e de criar experiências para visitantes brasileiros e estrangeiros.',
  'bachelors',
  '{"min": 2000, "max": 8000}',
  'growing',
  ARRAY['ecoturismo', 'planejamento turístico', 'hospitalidade', 'gestão de eventos', 'patrimônio histórico'],
  'https://www.youtube.com/watch?v=5vXyxfYlz8M'
);

-- ── Verificar inserção ────────────────────────────────────────
SELECT COUNT(*) AS total_professions FROM professions;
