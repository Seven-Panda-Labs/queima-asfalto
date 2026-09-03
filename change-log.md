# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md) | [Français](change-log.fr.md) | [العربية](change-log.ar.md)

---

## [1.34.0] - 2026-09-03

### Adicionado

- **Duas fontes de provas novas:** a colheita passa a poder ler o marathon.de, que dá cidade, distâncias e o preço da inscrição (o primeiro que temos), e o planet-marathon.de, um calendário de maratonas mantido à mão com 386 provas em 55 países. Continua desligada até as activares. Ver [`docs/discovery-sources.md`](docs/discovery-sources.md).

---

## [1.33.0] - 2026-09-03

### Adicionado

- **A estrada da temporada:** o herói do dashboard passa a mostrar a última prova, a próxima e a prova objetivo no fim, cada uma com a sua distância e a sua contagem. Na recta final, quando a próxima prova já é a objetivo, o herói é todo dela.

### Alterado

- **Planear é mover:** agendar uma prova da bucket list passa-a para o calendário e tira-a da lista, sem perguntar. A âncora e o papel na temporada vivem na prova, portanto não se perde nada ao mover.
- **Avisos da temporada:** aparecem na página de cada prova, e deixam de desaparecer quando a agendas.

### Corrigido

- **Distâncias com decimais:** não era possível guardar 42,195 km. O browser recusava o valor em silêncio, antes de a app chegar a validar.
- **Provas repetidas no catálogo:** a mesma prova aparecia duas vezes, uma com o nome do patrocinador. A colheita passa a reconhecer a prova que o catálogo já tem, mesmo com nome diferente ou noutra língua, e junta-lhe a edição. Os pares que não pode decidir sozinha passam a uma fila na administração.

---

## [1.32.0] - 2026-09-02

### Adicionado

- **Planeamento de inscrições:** a bucket list passa a estar agrupada pelo que falta fazer, e cada prova pode ter a sua inscrição: quando abre, quando fecha, o sorteio, e o prazo para garantir um lugar já ganho. Com avisos por notificação antes de cada prazo, que se ligam em Definições.
- **A temporada em volta das provas âncora:** marca as uma a três provas que fixam o teu ano, na página da própria prova. A partir delas a app sugere a janela onde encaixa uma prova de preparação, avisa quando algo cai no afinamento ou quando o mês fica cheio, e mostra o tempo previsto para a âncora a partir da tua última prova.
- **Quando falha:** uma prova que passa sem resultado pergunta o que aconteceu em vez de dizer que faltaste, uma desistência passa a contar como prova começada, e um botão cria a tentativa da próxima temporada.
- **Encontrar provas:** uma página nova procura no catálogo da instância por mês, distância e local, e acrescenta uma prova à lista num clique. Escolher a âncora põe à frente as que encaixam na janela. Inclui os parkruns perto de ti, que não aparecem em calendário nenhum.
- **Primeiros passos:** o dashboard de uma conta nova abre com quatro passos, cada um a explicar o que a app faz com aquilo. Desaparece quando estiverem feitos.

### Alterado

- **Contas à espera de aprovação:** o login passa a ser recusado com a razão, em vez de deixar entrar numa app onde nada podia ser escrito.
- **Self-hosting:** a colheita de provas pode ler duas fontes novas, e continua desligada até a activares. Ver [`docs/discovery-sources.md`](docs/discovery-sources.md).

---

## [1.31.0] - 2026-09-01

### Adicionado

- **Mais distâncias:** 1500 m, 3000 m, 15Km, 10 milhas, 30Km, 50Km, 50 milhas, 100Km e 100 milhas juntam-se às quatro de sempre. As novas chegam desligadas: liga as que corres em Definições, Disciplinas.
- **Catálogo de provas:** a instância passa a conhecer provas por nome, com a forma de inscrição, os prazos e o sorteio de cada edição. É o que vai dar avisos antes de as inscrições fecharem.
- **Área de administração:** aprovar, bloquear e eliminar contas, e manter o catálogo, dentro da app em vez da consola.

### Alterado

- **Escolher disciplinas ficou compacto:** as 13 distâncias passam a pastilhas agrupadas em pista, estrada e ultra.
- **Self-hosting:** o administrador deixa de ser a variável `ADMIN_EMAIL` e passa a ser um utilizador com `admin: true`, dado uma vez na consola. Ver [`docs/self-hosting.md`](docs/self-hosting.md).

---

## [1.30.0] - 2026-09-01

### Removido

- **Import e export de Excel saíram:** o backup completo em `.zip` cobre o mesmo com mais precisão, incluindo fotos, vídeos, ficheiros de actividade e objectivos, e restaura tudo com os mesmos identificadores. A folha de cálculo deixa de ser caminho de entrada: as provas passam a entrar na app, ou por restauro de um backup.

---

## [1.29.1] - 2026-08-31

### Alterado

- **Distribuição de esforço mais legível:** perder até 10 s/km na segunda metade passa a contar como ritmo constante, e o vermelho fica reservado para quebras acima de 25 s/km. O gráfico aparece a partir de uma prova, em vez de exigir cinco.
- **Contagens no singular:** "1 vez aqui" em vez de "1 vezes aqui", nas frases que contam quantas vezes já correste um percurso.

---

## [1.29.0] - 2026-08-31

### Adicionado

- **Marca a bater nas provas que aí vêm:** ao abrires uma prova futura num percurso que já correste, vês o teu melhor ritmo ali e o tempo que ele dá nesta distância.
- **A marca a bater também no início:** o cartão da próxima prova mostra o tempo e o ritmo a bater, quando já correste esse percurso.

### Alterado

- **Carregar ficheiro só depois da prova:** o carregamento de GPX ou TCX deixa de aparecer em provas futuras, para não acabar lá um treino no percurso arquivado como se fosse a prova.

---

## [1.28.0] - 2026-08-30

### Adicionado

- **Distribuição de esforço:** a página de análise mostra, prova a prova, quanto abrandaste na segunda metade, e diz-te em quantas provas isso aconteceu.
- **Comparação do mesmo percurso:** ao abrires uma prova que já correste antes, vês onde ela fica entre todas as vezes que a fizeste, com a melhor e a anterior.

---

## [1.27.0] - 2026-08-30

### Adicionado

- **Ficheiros de atividade nos eventos:** carrega o GPX ou TCX do teu relógio e a prova ganha splits por quilómetro, o percurso desenhado no mapa, um gráfico de ritmo e altitude e, se o ficheiro os trouxer, os batimentos cardíacos. O tempo medido é oferecido para preencher o resultado, e nunca substitui o que já lá está sem confirmares: a cronometragem oficial é a que conta. Os ficheiros entram e saem nos backups.

---

## [1.26.1] - 2026-08-30

### Alterado

- **Os documentos seguem a língua da app:** changelog, aviso de resultados e política de privacidade deixaram de ter seletor próprio, e em árabe leem-se da direita para a esquerda.

---

## [1.26.0] - 2026-08-30

### Adicionado

- **Escolhe as disciplinas que queres ver:** em Definições > App podes desligar as distâncias que não corres. Deixam de aparecer nos filtros e nas listas de escolha. Nada se perde: as provas, objetivos e recordes que já tens numa disciplina desligada continuam à vista.

---

## [1.25.0] - 2026-08-30

### Alterado

- **A página de Resultados passou a ser a de Análise:** deixou de repetir a lista de Eventos. Passa a responder a três perguntas, com um selector no topo: como vai esta época, como está face às anteriores, e o que mudou desde sempre. A rota mudou para `/analise`, e os links antigos continuam a funcionar.
- **Curva de forma:** cada prova é convertida para o equivalente na tua distância mais corrida, por isso um 5K e uma maratona passam a comparar-se na mesma linha. Traz também previsão de tempos para as outras distâncias, a partir da tua melhor marca dos últimos 12 meses.
- **Novas leituras:** posição no pelotão ao longo do tempo, progressão de cada recorde, km acumulados contra as épocas anteriores, meses fortes e fracos do ano, e uma grelha de consistência por provas ou por quilómetros.
- **Ritmo médio do ano corrigido:** passa a ser ponderado pela distância. Antes um 5K pesava o mesmo que uma maratona.

---

## [1.24.0] - 2026-08-29

### Alterado

- **O resultado de uma prova edita-se na página do evento:** acabou a página à parte. O tempo, a posição e o link dos resultados oficiais ficam todos no mesmo sítio, ao lado dos números.

---

## [1.23.0] - 2026-08-29

### Alterado

- **O catálogo parkrun actualiza-se sozinho:** as provas parkrun novas passam a aparecer poucos dias depois de abrirem, sem esperar por uma actualização da aplicação. A lista também deixou de ser descarregada quando já está em dia, o que torna o arranque mais leve.

---

## [1.22.0] - 2026-08-28

### Alterado

- **O resto da app com o visual do Início:** os objetivos passaram a agrupar-se por estado, com os cumpridos em destaque, os filtros e os seletores de vista ficaram iguais em todas as páginas, e a página de um evento passa a ter o nome da prova como título e o resultado em destaque.

---

## [1.21.0] - 2026-08-28

### Alterado

- **Início redesenhado:** o próximo evento em destaque com a contagem decrescente, os números do ano numa faixa única, agora com os quilómetros percorridos, e lugar próprio para conquistas, objetivos por cumprir e recordes pessoais.

---

## [1.20.0] - 2026-08-25

### Adicionado

- **Novo idioma, Árabe (primeira versão):** a aplicação, as notas de versão, o aviso de resultados oficiais, a política de privacidade, os emails de conta e os lembretes push estão agora disponíveis em árabe, com layout da direita para a esquerda (RTL). Selecciona-o em Definições → Idioma.

---

## [1.19.0] - 2026-08-25

### Adicionado

- **Novo idioma, Francês:** a aplicação, as notas de versão, o aviso de resultados oficiais, a política de privacidade, os emails de conta e os lembretes push estão agora disponíveis em francês. Selecciona-o em Definições → Idioma.

---

## [1.18.0] - 2026-08-17

### Alterado

- **Resultados oficiais:** procura automática de resultados Parkrun temporariamente desativada: o Parkrun bloqueia pedidos automáticos vindos de infraestrutura cloud conhecida. O resultado continua a poder ser registado manualmente.

---

## [1.17.0] - 2026-08-13

### Adicionado

- **Novo seletor de emoji:** pesquisa e acesso a todos os emojis Unicode, em vez da lista curada anterior.

---

## [1.16.1] - 2026-08-13

### Adicionado

- **Mais emojis:** juntámos mais de 50 opções novas ao seletor: animais, flores, comida, temática de Halloween e bandeiras da Ásia, América do Sul e Norte de África de emoji de eventos e objetivos.

### Corrigido

- **Estado dos eventos:** um evento com resultado oficial já não pode ficar marcado como «Faltou». Havia uma condição de corrida entre a transição automática para «Faltou» e a gravação do resultado. Se a transição automática ganhasse a corrida, o estado ficava errado apesar de o resultado estar guardado.

---

## [1.16.0] - 2026-08-03

### Adicionado

- **Backup com fotos e vídeos:** o `.zip` de backup passa a incluir os ficheiros de fotos e vídeos, não só os metadados. Podes desligar a opção antes de exportar; acima de 300 MB o backup fica só com os dados.
- **Restauro de fotos e vídeos:** com os ficheiros no `.zip`, as fotos e vídeos voltam mesmo no modo «substituir tudo» e ao restaurar noutra conta. Antes só eram recuperáveis se ainda estivessem na conta.

---

## [1.15.1] - 2026-08-03

### Corrigido

- **Segurança:** as regras do Firestore passam a tratar os campos de aprovação de conta como imutáveis do lado do cliente. Antes, uma conta pendente ou rejeitada conseguia remover o próprio `accountStatus` numa escrita e ficar com acesso total.
- **Definições:** em instâncias com aprovação de contas activada, voltar a gravar idioma, preferências de notificações e perfil de resultados. As escritas eram todas recusadas depois de a conta ser aprovada.

---

## [1.15.0] - 2026-08-03

### Adicionado

- **Backup completo:** exporta todos os teus dados em JSON dentro de um ficheiro `.zip` (eventos, objetivos, metas de performance, bucket list, metadados de fotos e vídeos, preferências e partilhas).
- **Restaurar backup:** volta a carregar um `.zip` de backup para repor os dados, com os IDs originais preservados. Podes juntar aos dados actuais ou substituir tudo.

---

## [1.14.2] - 2026-08-02

### Corrigido

- **Resultados oficiais:** MikaTiming usa a coluna de classificação geral correta (varia por evento).
- **Resultados oficiais:** total de participantes MikaTiming sem filtro de sexo (cabeçalho da lista).

---

## [1.14.1] - 2026-08-01

### Corrigido

- **Resultados oficiais:** conector MikaTiming (pesquisa multi-disciplina e tempos Netto); mais memória na callable de lookup.

---

## [1.14.0] - 2026-07-30

### Adicionado

- **Self-hosting:** aprovação manual de contas novas (opcional): ecrã de pendente/rejeitado, email ao administrador com links aprovar/rejeitar (Resend), notificação ao utilizador, regras Firestore/Storage e funções de blocking Auth; ver `docs/configuration.md` e `docs/self-hosting.md`.

---

## [1.13.0] - 2026-07-23

### Adicionado

- **Memórias:** lightbox para ver fotos e vídeos em ecrã inteiro, com navegação por setas, teclado e swipe em mobile.

---

## [1.12.1] - 2026-07-23

### Alterado

- Várias melhorias de desempenho e atualizações de segurança.

---

## [1.12.0] - 2026-07-23

### Adicionado

- **Idiomas:** suporte a espanhol (es-ES) e alemão na app: UI, emojis, lembretes push, changelog, política de privacidade e aviso de resultados oficiais.
- **Definições:** selector de idioma com Português, English, Español e Deutsch.

### Alterado

- Fallback de traduções em falta passa a inglês; detecção automática do browser para `pt`, `en`, `es` e `de`.

---

## [1.11.0] - 2026-07-20

### Adicionado

- **Privacidade:** link para a política de privacidade no rodapé da app.

### Corrigido

- **Privacidade:** página com o mesmo layout, tema e navegação que o resto da app.

### Alterado

- Intervalo mínimo entre pesquisas de resultados oficiais aumentado para **10 segundos**, com contagem no botão.

---

## [1.10.0] - 2026-07-19

### Adicionado

- **Parkrun:** criação dedicada de eventos com pesquisa no catálogo global, favoritos e país no autocomplete.
- **Parkrun:** favoritos no perfil de resultados; eventos escolhidos passam a favoritos automaticamente.

### Corrigido

- **Parkrun:** ao mudar a escolha no autocomplete, local e mapa voltam a actualizar.

### Alterado

- **Parkrun:** importação de resultados mais fiável com o evento correcto guardado no registo.

---

## [1.9.2] - 2026-07-19

### Adicionado

- **Google Analytics** integrado na app.

### Corrigido

- **Parkrun:** importação de resultados oficiais a falhar em alguns ambientes.

### Alterado

- Intervalo mínimo entre pesquisas de resultados oficiais reduzido para **5 segundos**, com contagem no botão.

---

## [1.9.1] - 2026-07-19

### Corrigido

- **MyRaceResult:** pesquisa em eventos com várias categorias (ex. Mittsommerlauf).

### Alterado

- **MyRaceResult:** suporte a resultados embebidos em páginas de evento e classificação geral por tempo.

---

## [1.9.0] - 2026-07-09

### Adicionado

- Conector **mika:timing** (Chicago Marathon, London Marathon, etc.).

### Alterado

- Lista de plataformas suportadas nas Definições ordenada alfabeticamente.

---

## [1.8.0] - 2026-07-09

### Adicionado

- Conector **Tímataka** (timataka.net / timataka.is).

---

## [1.7.0] - 2026-07-09

### Adicionado

- **Notificações push** com lembretes mesmo com a app fechada.

### Alterado

- Definições de notificações actualizadas; idioma da app usado nas mensagens remotas.

---

## [1.6.0] - 2026-07-08

### Adicionado

- Conector **Wiclax** (classificações em direto).

---

## [1.5.1] - 2026-07-08

### Adicionado

- Página **Novidades** (`/novidades`) com o histórico de versões; link na versão do rodapé.
- Crédito **Seven Panda Labs** no rodapé.

---

## [1.5.0] - 2026-07-08

### Adicionado

- Conector **VCRunning** (Valencia Ciudad del Running).
- Changelog versionado em português e inglês.

---

## [1.4.0] - 2026-07-08

### Adicionado

- Melhorias de UX para eventos **Parkrun**: configuração do Parkrunner ID e formulário simplificado.

---

## [1.3.2] - 2026-07-07

### Adicionado

- Mais mensagens de carregamento no tom de voz da marca.

---

## [1.3.1] - 2026-07-07

### Adicionado

- Tom de voz da marca em estados vazios, carregamentos e mensagens de sucesso.
- Documentação do tom de voz em [docs/voice.md](docs/voice.md).

### Corrigido

- Desempate de recordes pessoais por tempo quando ritmo e distância coincidem.

---

## [1.3.0] - 2026-07-06

### Alterado

- Definições reorganizadas; partilhas passam a estar nas Definições.

---

## [1.2.0] - 2026-07-06

### Adicionado

- Resultados partilhados na página Resultados, com separadores por amigo.

### Corrigido

- Datas em dados partilhados recebidos de amigos.

---

## [1.1.0] - 2026-07-06

### Adicionado

- Vistas partilhadas nas secções Eventos e Objetivos.

---

## [1.0.2] - 2026-07-06

### Corrigido

- Email do dono visível nos convites de partilha recebidos.

---

## [1.0.1] - 2026-07-06

### Adicionado

- Edição de permissões de partilha e aviso de convites pendentes.

---

## [1.0.0] - 2026-07-06

Marco: partilha de dados entre amigos.

### Adicionado

- Partilha de eventos, objetivos e resultados com convites por email.
- Permissões configuráveis por área (eventos, objetivos, resultados, metas de performance).

---

## [0.22.0] - 2026-07-06

### Adicionado

- Base da funcionalidade de partilha com amigos.

---

## [0.21.0] - 2026-07-06

### Adicionado

- Modo escuro com preferência de sistema.

---

## [0.20.0] - 2026-07-05

### Adicionado

- Conector **Ultimate Sport Service**.

---

## [0.19.1] - 2026-07-05

### Corrigido

- **RunCzech:** tempo de chip em vez de tempo oficial.

---

## [0.19.0] - 2026-07-05

### Adicionado

- Conector **RunCzech**.

---

## [0.18.1] - 2026-07-05

### Corrigido

- **NSF Berlin:** tabelas com colunas variáveis.

---

## [0.18.0] - 2026-07-05

### Adicionado

- Conector **NSF Berlin**.

---

## [0.17.2] - 2026-07-05

### Corrigido

- **ZielZeit:** tempo líquido em vez de tempo bruto.

---

## [0.17.1] - 2026-07-05

### Corrigido

- **EQ Timing:** posição geral com base nos finishers por etapa.

---

## [0.17.0] - 2026-07-05

### Adicionado

- Conector **EQ Timing**.

---

## [0.16.0] - 2026-07-05

### Adicionado

- Conector **ZielZeit**.

---

## [0.15.0] - 2026-07-05

### Adicionado

- Conector **Strassenlauf.org**.

---

## [0.14.1] - 2026-07-05

### Corrigido

- **MyRacePartner:** pesquisa mais robusta.

---

## [0.14.0] - 2026-07-05

### Adicionado

- Conector **MyRacePartner**.

---

## [0.13.1] - 2026-07-05

### Corrigido

- **MaxFunSports:** total de finishers em URLs embebidas.

---

## [0.13.0] - 2026-07-05

### Adicionado

- Conector **MaxFunSports**.

---

## [0.12.2] - 2026-07-05

### Corrigido

- **SCC Events:** competição SCC Läufer incluída na pesquisa.

---

## [0.12.1] - 2026-07-05

### Corrigido

- **SCC Events:** deteção de URLs alargada.

---

## [0.12.0] - 2026-07-05

### Adicionado

- Conector **SCC Events**.

---

## [0.11.1] - 2026-07-05

### Corrigido

- **MyRaceResult:** pesquisa em categorias excluídas da lista principal.

---

## [0.11.0] - 2026-07-05

### Adicionado

- Conector **MyRaceResult**.

### Corrigido

- **Parkrun**, **Davengo** e **Sporthive:** várias melhorias na importação de resultados.

---

## [0.9.0] - 2026-07-04

Marco: resultados oficiais automáticos.

### Adicionado

- Importação de resultados oficiais para **Sporthive**, **Davengo** e **Parkrun**.
- Ícone de resultados verificados nas listas.
- Contagem de finishers em Parkrun e Davengo.

### Corrigido

- Parsing de tabelas de resultados Parkrun.

---

## [0.8.0] - 2026-07-04

### Corrigido

- Mapa deixou de sobrepor diálogos.

### Alterado

- Ordem dos itens na navegação principal.

---

## [0.7.0] - 2026-07-04

### Adicionado

- Mapa na bucket list e na página Resultados.
- Mais emojis disponíveis.

---

## [0.6.2] - 2026-07-02

### Adicionado

- Legenda de estados na vista de mapa.

---

## [0.6.1] - 2026-07-02

### Corrigido

- Alertas de segurança de dependências.

---

## [0.6.0] - 2026-06-30

### Adicionado

- Autocomplete de localização e mapa na bucket list.

---

## [0.5.4] - 2026-06-30

### Adicionado

- Pré-visualização do mapa no formulário de evento.

---

## [0.5.3] - 2026-06-30

### Corrigido

- Agrupamento de marcadores no mapa.

---

## [0.5.2] - 2026-06-30

### Corrigido

- Pesquisa de localização redundante após seleccionar sugestão.

---

## [0.5.1] - 2026-06-30

### Adicionado

- Autocomplete e geocodificação de localizações.
- Mapa no detalhe do evento.

---

## [0.5.0] - 2026-06-29

Marco: modo mapa.

### Adicionado

- Coordenadas nos eventos e vista **Lista | Mapa** na página Eventos.
- Painel para eventos sem localização definida.

---

## [0.4.3] - 2026-06-29

### Corrigido

- Fotos e vídeos de eventos em produção.

---

## [0.4.2] - 2026-06-29

### Corrigido

- Permissões de acesso a fotos e vídeos.

---

## [0.4.1] - 2026-06-29

### Corrigido

- Carregamento de memórias (fotos/vídeos).

---

## [0.4.0] - 2026-06-29

Marco: fotos e vídeos de eventos.

### Adicionado

- Upload de fotos e vídeos no detalhe do evento (até 10 ficheiros; vídeo máx. 2 min).
- Galeria de memórias associada a cada evento.

### Corrigido

- Galeria actualizada imediatamente após upload.

---

## [0.2.0] - 2026-06-28

Marco: internacionalização.

### Adicionado

- Suporte **pt-PT** e **en-GB**.
- Múltiplas disciplinas por item na bucket list.
- Vista de detalhe de evento e recuperação para a bucket list.
- Estados Falhada, Ultrapassada e Destruída nas metas de performance.
- Contagem de dias até ao próximo evento no Dashboard.
- Versão da app no rodapé.

### Alterado

- Estado «Agendado» renomeado para «Planeado».
- Terminar sessão movido para Definições.

### Corrigido

- Contraste e filtros de estado; legenda e tabela em Resultados.
- Isolamento de dados por utilizador.

---

## [0.1.0] - 2026-06-26

Marco: **MVP**, substituição da folha Excel por PWA.

### Adicionado

- App web com login Google, dados na cloud e modo offline.
- Gestão de eventos, resultados, objetivos anuais e dashboard com gráficos.
- Importação e exportação Excel.
- **Bucket list**, calendário, metas de performance e notificações locais.
- Definições, recordes pessoais e instalação como PWA.

### Corrigido

- Login e sincronização offline em vários separadores.
