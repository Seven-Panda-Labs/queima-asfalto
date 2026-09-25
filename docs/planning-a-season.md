# Planear uma época: do catálogo ao calendário

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Como uma prova passa de "um dia quero correr isto" a uma data no calendário, e porque é que hoje esse caminho tem passos a mais. Decidido em conversa com o produto a 2026-09-25. Para o ciclo completo de uma prova, ver [`race-lifecycle.md`](./race-lifecycle.md); este documento substitui a parte dele que descreve o desejo e o agendamento.

### O que está a acontecer hoje

Medido na base de dados de produção, 2026-09-25:

| | |
|---|---|
| Eventos | 138, dos quais 48 com identidade de prova |
| Desejos na bucket list | 16, dos quais 1 com identidade de prova e ligação ao catálogo |
| Inscrições (`raceEntries`) | 1, sem datas e sem evento |

A época real vive nos eventos. A bucket list é uma lista de nomes escritos à mão. A camada de inscrição, que é onde vivem os prazos e o sorteio, foi usada uma vez e ficou vazia.

**Há dois caminhos da bucket list para o calendário, e fazem coisas opostas.** "Planear inscrição" abre um formulário de catorze campos, e ao ficar `registered` cria o evento e mantém o desejo. O ícone de calendário abre o formulário de evento, cria o evento e apaga o desejo, sem inscrição nenhuma, logo sem prazos, sem preço e sem histórico.

**E os dois pedem datas que o catálogo já tem.** O formulário de evento abre sempre em hoje ([`EventForm.tsx`](../src/pages/Events/EventForm.tsx)), porque nunca fala com o catálogo. O formulário de inscrição só pergunta ao catálogo quando ainda não existe inscrição para aquele desejo, por isso uma inscrição criada vazia nunca mais é preenchida, que é exactamente o caso do único registo em produção: o catálogo tem a data daquele ano e a inscrição está em branco.

### O modelo depois

Nenhuma entidade nova. Uma deixa de ser entidade.

| Conceito | Passa a ser |
|---|---|
| `races` | a identidade, sem alterações. É o que liga tudo o resto |
| Favorito (ex-bucket list) | um marcador numa prova do catálogo: utilizador, prova, quando marcou, e uma nota opcional |
| `events` | a época. `planned` é "vou fazer esta", `confirmed` é "estou inscrito" |
| `raceEntries` | camada opcional de sorteio e prazos, ligada a uma prova que já está no calendário |

O favorito perde tudo o resto que o item de bucket list carrega hoje, porque já vive noutro sítio: nome, local, distância e disciplinas são do catálogo, e a âncora, o papel e a prova que serve são da identidade (`races.anchorYears`, `role`, `servesRaceId`). Mês e ano alvo desaparecem: um sonho não tem ano.

### O caminho

1. **Marcar.** Um clique na lista de planeamento, sem formulário nenhum.
2. **Pôr no calendário.** Distância e data, ambas preenchidas a partir da edição do catálogo. Cria o evento como `planned`, ligado à identidade da prova, e a prova deixa de estar marcada como favorita.
3. **Inscrever.** Um toque no evento, que passa a `confirmed`.
4. **Só nas âncoras.** "Esta prova tem prazos" acrescenta abertura, fecho, sorteio e prazo para garantir o lugar, e os estados do meio que o evento não sabe dizer: candidatura entregue, aceite, não saiu no sorteio.

Dois passos onde hoje são cinco, e nenhuma data escrita à mão quando o catálogo a tem.

**Uma prova sem data não se agenda.** Fica favorita até a edição ser publicada, e é a colheita que traz a data. Nada de datas estimadas no calendário: uma data estimada é indistinguível de uma real no sítio onde mais custa enganar-se.

E quando a data chega, a página diz: "2 desejos já têm data para 2027", com o botão que os põe no calendário. Sem isso, a regra acima obrigava a abrir desejo a desejo para descobrir se já era altura de decidir.

### A navegação

A bucket list sai do topo da navegação e entra **Planeamento**, que é a página do catálogo com três secções:

- **Descobrir**, a procura no catálogo, com marcar e agendar em cada linha
- **Favoritos**, o filtro pelo que está marcado
- **A minha época**, o caminho até cada âncora

A época é uma linha por prova âncora, lida da esquerda para a direita: as provas que a preparam, em ordem, e a âncora no fim. Uma grelha de doze meses respondia à pergunta errada, que é "o que tenho em junho"; a pergunta é "o que faço entre hoje e a prova que conta".

Entre duas provas fica o tempo que as separa e um botão, porque é aí que o planeamento acontece: abre o catálogo já a perguntar pelos dias daquele intervalo. Cinco semanas é um plano, cinco dias é um choque, e um conector sem medida não distingue os dois.

Um ciclo não pára a 31 de dezembro. A preparação de uma âncora de abril começa no outono anterior, por isso a perna atravessa o ano, e o que é do ano de trás ou da frente aparece apagado e com o ano ao lado da data. Doze meses é o máximo que uma preparação alcança: mais do que isso, a prova ganha perna própria.

A época escolhe-se por ano, porque planeia-se tanto a corrente como uma futura, e vive na morada (`?year=`), para que ir ao catálogo e voltar não caia na época errada. Épocas já corridas não se oferecem: isso é a página de Eventos.

**Planeamento não substitui Eventos.** Eventos continua a ter o detalhe, os resultados e as épocas passadas. Páginas de detalhe não fazem parte do modo de planeamento: quem está a planear está a comparar, não a ler uma prova.

### Decisões

| Tema | Decisão |
|------|---------|
| O que é a bucket list | Um marcador numa prova do catálogo, não uma entidade com campos próprios |
| Época | Um ano civil do calendário, visto a partir dos eventos. Não é uma colecção nova |
| Unidade de planeamento | Ano civil |
| Agendar sem data | Não. Sem data concreta a prova fica favorita |
| Datas estimadas no calendário | Não |
| O desejo depois de agendado | Deixa de estar marcado. A prova continua no catálogo |
| Prova de sorteio no calendário | Entra como `planned` enquanto se espera, e cancela-se se não sair |
| Funil de inscrição | Fica, para as âncoras, e sai do caminho de toda a gente |
| Navegação | Planeamento substitui Bucket List no topo. Eventos mantém-se |
| Detalhe dentro do planeamento | Não |
| Prova fora do catálogo | Propõe-se ao catálogo ou vai direta ao calendário. Não se marca como favorita |
| Excepção ao marcador | Um parkrun vigiado, que não tem entrada no catálogo nem identidade de prova por decisão, guarda o nome no próprio desejo |
| Uma prova marca-se uma vez | O marcador é idempotente: carregar duas vezes não escreve dois desejos |
| Nome numa lista partilhada | Desnormalizado no momento da partilha, porque quem lê não pode abrir as provas de outra pessoa |
| Onde está uma prova | A identidade copia as coordenadas do catálogo, e a colheita geocodifica 300 por noite o que o catálogo não sabe |

Estas duas substituem linhas de [`race-lifecycle.md`](./race-lifecycle.md) que deixaram de valer: "o item da bucket list sobrevive ao agendamento" e "a bucket list cresce, sem rota nova de planeamento".

### Por onde se começa

1. **Ligar os desejos ao catálogo.** Sem identidade não há favorito de nada, e 15 dos 16 desejos em produção são texto livre. A regra de duplicados propõe, uma pessoa confirma.
2. **Um só caminho para o calendário**, com a data vinda da edição.
3. **O funil sai do caminho** e passa a opção na prova que já está no calendário.
4. **O favorito colapsa em marcador** e a navegação muda.

### Perguntas que estavam abertas, e o que ficou decidido

1. ~~**O mapa.**~~ **Respondido.** A identidade da prova passou a copiar as coordenadas que o catálogo publica, 1777 das 5593 entradas vivas, e a colheita geocodifica 300 por noite a partir da terra e do país, o que limpa as restantes 3816 em menos de duas semanas. Sem chave do Geoapify a passagem não faz nada e a colheita segue.
2. ~~**Os desejos que não se conseguem ligar.**~~ **Respondido.** Não existem em contas reais: os cinco que havia eram de uma conta de teste e foram apagados. O recurso ao nome guardado fica, para o parkrun vigiado e para quem se auto-aloja com dados antigos.
3. ~~**Quando a edição é publicada.**~~ **Respondido.** A página de planeamento diz quais dos desejos ganharam data para a época que está a ser montada, e agenda a partir dali. Lembrete continua fora: isto é uma decisão, não um prazo.

### O que continua por fazer

**A inscrição de uma época que ainda não tem calendário.** O "tentar na próxima época" de uma prova falhada escreve a inscrição do ano seguinte, mas como não há evento nessa época ela só aparece no cartão de prazos, e só fica editável quando a prova for agendada.

---

<a id="english"></a>

## English

How a race gets from "one day I want to run this" to a date on the calendar, and why that path has too many steps today. Decided with product on 2026-09-25. For the full lifecycle of a race see [`race-lifecycle.md`](./race-lifecycle.md); this document replaces the part of it that describes the wish and the scheduling.

### What is happening today

Measured against the production database, 2026-09-25:

| | |
|---|---|
| Events | 138, of which 48 carry a race identity |
| Bucket list wishes | 16, of which 1 carries a race identity and a catalog link |
| Entries (`raceEntries`) | 1, with no dates and no event |

The real season lives in the events. The bucket list is a list of hand written names. The entry layer, which is where deadlines and lotteries live, was used once and left empty.

**There are two paths from the bucket list to the calendar, and they do opposite things.** "Plan entry" opens a form of fourteen fields, and reaching `registered` creates the event and keeps the wish. The calendar icon opens the event form, creates the event and deletes the wish, with no entry at all, so no deadlines, no fee and no history.

**And both ask for dates the catalog already holds.** The event form always opens on today ([`EventForm.tsx`](../src/pages/Events/EventForm.tsx)), because it never talks to the catalog. The entry form only asks the catalog while no entry exists for that wish, so an entry created empty is never filled again, which is exactly the one record in production: the catalog holds that year's date and the entry is blank.

### The model afterwards

No new entity. One stops being an entity.

| Concept | Becomes |
|---|---|
| `races` | the identity, unchanged. It is what ties the rest together |
| Favourite (formerly the bucket list) | a marker on a catalog race: user, race, when it was marked, and an optional note |
| `events` | the season. `planned` is "I am doing this one", `confirmed` is "I am in" |
| `raceEntries` | an optional lottery and deadline layer on a race already in the calendar |

The favourite loses everything else a bucket list item carries today, because it already lives elsewhere: name, place, distance and disciplines belong to the catalog, and the anchor, the role and the race it serves belong to the identity (`races.anchorYears`, `role`, `servesRaceId`). Target month and year go: a dream has no year.

### The path

1. **Mark it.** One click in the planning list, no form.
2. **Put it in the calendar.** Distance and date, both filled from the catalog edition. Creates the event as `planned`, tied to the race identity, and the race stops being marked.
3. **Enter.** One tap on the event, which becomes `confirmed`.
4. **Anchors only.** "This race has deadlines" adds opening, closing, draw and the deadline to secure a won place, along with the middle states an event cannot express: applied, accepted, rejected.

Two steps where today there are five, and no date typed by hand when the catalog has it.

**A race with no date cannot be scheduled.** It stays a favourite until the edition is published, and the harvest is what brings the date. No estimated dates on the calendar: an estimate is indistinguishable from a real date in the one place where being wrong costs most.

And when the date arrives the page says so: "2 wishes have a date for 2027", with the button that puts them in the calendar. Without that, the rule above meant opening one wish at a time to find out whether it was time to decide.

### Navigation

The bucket list leaves the top level navigation and **Planning** takes its place, the catalog page with three sections:

- **Discover**, the catalog search, with marking and scheduling on every row
- **Favourites**, filtered to what is marked
- **My season**, the path to each anchor

A season is one line per anchor race, read left to right: the races that lead to it, in order, and the anchor at the end. A grid of twelve months answered the wrong question, which is "what is in June"; the question is "what am I doing between now and the race that counts".

Between two races sits the time between them and a button, because that is where planning happens: it opens the catalog already asking about the days in that gap. Five weeks is a plan and five days is a clash, and a connector with no measure on it cannot tell them apart.

A cycle does not stop on the 31st of December. The build-up for an April anchor starts the previous autumn, so a leg crosses the year, and what belongs to the year before or after is faded and carries its year beside the date. Twelve months is as far back as a build-up reaches; older than that, the race gets a leg of its own.

The season is picked by year, because both the current one and a future one get planned, and it lives in the address (`?year=`) so that going to the catalog and coming back does not land on the wrong one. Seasons already run are not offered: that is what Events is for.

**Planning does not replace Events.** Events keeps the detail, the results and past seasons. Detail pages are not part of planning mode: somebody planning is comparing, not reading one race.

### Decisions

| Topic | Decision |
|------|---------|
| What the bucket list is | A marker on a catalog race, not an entity with fields of its own |
| Season | One calendar year, read off the events. Not a new collection |
| Planning unit | Calendar year |
| Scheduling without a date | No. With no concrete date the race stays a favourite |
| Estimated dates on the calendar | No |
| The wish once scheduled | It stops being marked. The race stays in the catalog |
| A lottery race in the calendar | Goes in as `planned` while waiting, and is cancelled if the draw says no |
| The entry funnel | Stays, for anchors, and leaves everybody else's path |
| Navigation | Planning replaces Bucket List at the top. Events stays |
| Detail inside planning | No |
| A race outside the catalog | It is proposed to the catalog or goes straight to the calendar. It is not marked |
| The exception to the marker | A watched parkrun, which has no catalog entry and no race identity by decision, keeps its name on the wish |
| A race is marked once | The marker is idempotent: pressing twice does not write two wishes |
| A name on a shared list | Denormalised at the moment of sharing, because a reader cannot open somebody else's races |
| Where a race is | The identity copies the catalog's coordinates, and the harvest geocodes 300 a night of what the catalog does not know |

Two of these replace rows in [`race-lifecycle.md`](./race-lifecycle.md) that no longer hold: "the bucket list item survives scheduling" and "the bucket list grows, with no new planning route".

### Where it starts

1. **Link the wishes to the catalog.** Without an identity there is no favourite of anything, and 15 of the 16 wishes in production are free text. The duplicate rule proposes, a person confirms.
2. **One path to the calendar**, with the date from the edition.
3. **The funnel leaves the path** and becomes an option on a race already in the calendar.
4. **The favourite collapses into a marker** and the navigation changes.

### The questions that were open, and how they were answered

1. ~~**The map.**~~ **Answered.** The race identity now copies the coordinates the catalog publishes, 1777 of 5593 live entries, and the harvest geocodes 300 a night from the town and the country, which clears the other 3816 in under a fortnight. With no Geoapify key the pass does nothing and the harvest carries on.
2. ~~**The wishes that cannot be linked.**~~ **Answered.** There are none in real accounts: the five that existed belonged to a test account and were deleted. The fallback to a stored name stays, for a watched parkrun and for self-hosted instances with older data.
3. ~~**When an edition is published.**~~ **Answered.** The planning page says which wishes gained a date for the season being built, and schedules from there. A reminder stays out: this is a decision, not a deadline.

### Still to do

**An entry for a season that has no calendar yet.** "Try again next season" on a failed race writes next year's entry, but with no event in that season it only shows on the deadline card, and only becomes editable once the race is scheduled.
