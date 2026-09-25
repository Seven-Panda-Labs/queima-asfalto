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

### A navegação

A bucket list sai do topo da navegação e entra **Planeamento**, que é a página do catálogo com três secções:

- **Descobrir**, a procura no catálogo, com marcar e agendar em cada linha
- **Favoritos**, o filtro pelo que está marcado
- **A minha época**, a forma do ano: onde estão as provas e onde estão os buracos, para responder a "falta-me uma prova um mês antes da âncora"

A época escolhe-se por ano, porque planeia-se tanto a corrente como uma futura.

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

Estas duas substituem linhas de [`race-lifecycle.md`](./race-lifecycle.md) que deixaram de valer: "o item da bucket list sobrevive ao agendamento" e "a bucket list cresce, sem rota nova de planeamento".

### Por onde se começa

1. **Ligar os desejos ao catálogo.** Sem identidade não há favorito de nada, e 15 dos 16 desejos em produção são texto livre. A regra de duplicados propõe, uma pessoa confirma.
2. **Um só caminho para o calendário**, com a data vinda da edição.
3. **O funil sai do caminho** e passa a opção na prova que já está no calendário.
4. **O favorito colapsa em marcador** e a navegação muda.

### Perguntas abertas

1. **O mapa.** Os desejos de hoje têm todos coordenadas, geocodificadas uma a uma pela app. No catálogo só 1777 de 5593 provas vivas as têm, 32%. Um mapa de favoritos construído sobre o catálogo perde dois terços dos pinos enquanto o catálogo não for geocodificado.
2. **Os desejos que não se conseguem ligar.** Se uma prova escrita à mão não existe no catálogo, ou se propõe, ou o desejo morre com o modelo antigo. Falta decidir o que acontece aos que sobrarem.
3. **Quando a edição é publicada.** Um favorito que passa a ter data é uma prova a pedir uma decisão. Onde é que isso aparece, e se chega a ser um lembrete, é desenho por fazer.

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

### Navigation

The bucket list leaves the top level navigation and **Planning** takes its place, the catalog page with three sections:

- **Discover**, the catalog search, with marking and scheduling on every row
- **Favourites**, filtered to what is marked
- **My season**, the shape of the year: where the races are and where the gaps are, so that "I need a race a month before the anchor" has an answer

The season is picked by year, because both the current one and a future one get planned.

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

Two of these replace rows in [`race-lifecycle.md`](./race-lifecycle.md) that no longer hold: "the bucket list item survives scheduling" and "the bucket list grows, with no new planning route".

### Where it starts

1. **Link the wishes to the catalog.** Without an identity there is no favourite of anything, and 15 of the 16 wishes in production are free text. The duplicate rule proposes, a person confirms.
2. **One path to the calendar**, with the date from the edition.
3. **The funnel leaves the path** and becomes an option on a race already in the calendar.
4. **The favourite collapses into a marker** and the navigation changes.

### Open questions

1. **The map.** Today's wishes all carry coordinates, geocoded one by one by the app. In the catalog only 1777 of 5593 live races do, 32%. A favourites map built on the catalog loses two pins in three until the catalog is geocoded.
2. **The wishes that cannot be linked.** If a hand written race is not in the catalog, it is either proposed or it dies with the old model. What happens to the remainder is undecided.
3. **When an edition is published.** A favourite that gains a date is a race asking for a decision. Where that shows up, and whether it ever becomes a reminder, is design still to do.
