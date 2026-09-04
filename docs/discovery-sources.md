# Fontes de descoberta / Discovery sources

[Português](#português) | [English](#english)

## Português

Como a app encontra provas novas, e o que é preciso para acrescentar uma fonte.

### O que é uma fonte

Uma fonte é um sítio que publica provas futuras de forma legível por máquina. O
que decide se entra são duas coisas, por esta ordem:

1. **Permissão.** O `robots.txt` permite o caminho, o sitemap está anunciado, e
   os termos não proíbem leitura automática. Um desafio de bot (Cloudflare, por
   exemplo) é uma resposta: não.
2. **Forma dos dados.** Uma de três, e nada mais:

   | `kind` | Forma | Custo por corrida |
   |---|---|---|
   | `sitemap` | uma página por evento, cada uma com `schema.org` | um pedido por evento |
   | `search` | um calendário em JSON, mais uma página por evento | um pedido por evento |
   | `listing` | o calendário todo numa página | um pedido, total |

   O que precisa de um browser a correr para os dados existirem não é fonte. O
   `/v3/event/register/…/overview` do davengo é uma app Vaadin, e conduzir esse
   protocolo é a mesma classe de coisa que uma grelha Livewire: rota que muda
   por deploy, e o operador a dizer sem dizer que não quer aquele tráfego.

Não escrevemos um conector por calendário. Há centenas e listam em grande parte
as mesmas provas, por isso o objectivo não é cobertura de fontes, é escolher as
mais baratas de ler e depois deduplicar.

### As fontes que este código lê

Nenhuma corre sem estar em `DISCOVERY_SOURCES`.

| id | `kind` | O que dá |
|---|---|---|
| `acorrer.pt` | `sitemap` | provas em Portugal, com `schema.org` em cada página |
| `davengo.com` | `search` | provas na Alemanha, distâncias tiradas da lista de participantes |
| `kilometerliebe.de` | `listing` | 447 provas na Alemanha numa página, com as distâncias exactas |
| `running.life` | `listing` | provas alemãs em `schema.org`, 20 por página, as mais próximas primeiro |
| `scc-events.com` | `listing` | Berlim, o calendário do operador de cronometragem |
| `marathon.de` | `sitemap` | 406 provas, com cidade, distâncias e preço por distância |
| `planet-marathon.de` | `listing` | maratonas em todos os continentes, três páginas |

O `planet-marathon.de` é um calendário mantido à mão por uma pessoa (Franz
Schwengler), e é a fonte de maior alcance que temos: 386 maratonas, 55 países.
Três coisas que só ele tem:

- **Só a distância oficial.** A regra é da própria página: só entram provas com
  os 42,195 km. Por isso este leitor não lê distância nenhuma, afirma-a.
- **Sem HTTPS e sem charset.** O TLS do servidor não negocia, e o
  `Content-Type` é um `text/html` seco sobre bytes ISO-8859-1. Sem isso
  declarado na fonte, «Fränkische» entrava no catálogo como «Fr�nkische».
- **Códigos de país escritos de memória.** `JAP`, `MAY`, `SER`, `ROM`, e `SLK` e
  `SVK` os dois. A tabela conhece as duas grafias, e uma linha cujo código não
  resolve é uma linha que se deixa cair: o país é o que a deduplicação compara.

Também deixa cair a maratona que é a perna de uma estafeta de triatlo e a que se
corre em três etapas: nenhuma delas é uma maratona que se possa inscrever.

O `marathon.de` é a única fonte que dá **preço**. Não tem `schema.org`, mas cada
página de evento está escrita sempre da mesma forma, com etiquetas:

```
Datum: Samstag, 05.09.2026        (um intervalo de dois dias começa no primeiro)
Ort: Wolgast, Deutschland         cidade e país, o país por nome alemão
Distanzen: 21 km / 42 km
Startgebühr: 21 km ... 16,00 - 25,00 Euro | 42 km ... 25,00 - 35,00 Euro
```

Duas consequências que valem a pena saber:

- **O sitemap não tem `lastmod`**, portanto um limite leria sempre as mesmas
  primeiras páginas. Cada corrida lê uma fatia diferente (`rotatePages`), com o
  desvio a andar por semana: 150 páginas por semana cobrem as 406 em três.
- **O preço é o do evento, não o da distância.** `lowPrice` é o mais barato que
  a página lista e `highPrice` o mais caro, que é o que os campos significam.
  Numa prova que vende 5 km e maratona, o preço da entrada não é um número só.

A `kilometerliebe.de` é a fonte mais barata que lemos e a que finalmente puxa o
catálogo para as distâncias curtas: um pedido, 447 provas, 271 com 10 km, 242
com 5 km e 172 com meia maratona. Entrega os campos em atributos, não em prosa:

```html
<article data-event-card data-event-title="34. Fohlenhoflauf"
  data-event-city="Homburg" data-event-state="Saarland"
  data-event-date="2026-09-03" data-event-category="lauf">
  <span class="distpill">4 km</span><span class="distpill">5 km</span>…
```

Duas escolhas que valem a pena registar:

- **As distâncias vêm das pastilhas, não do atributo.** O `data-event-distances`
  diz `5k,10k`, que são os baldes do filtro do site; as pastilhas dizem 4, 5 e
  10 km, que são as provas.
- **Só `lauf` e `trail`.** O calendário também tem triatlos e caminhadas, e as
  distâncias de um triatlo entrariam no catálogo como quilómetros que ninguém
  correu. Uma prova medida em horas (um 24 h, um backyard) também fica de fora:
  não tem distância nenhuma.

A `running.life` publica `schema.org` na própria página de calendário, e a página
de cada evento não acrescenta nada, portanto não se busca nenhuma. São 116
páginas de 20, e lemos as 25 primeiras: o calendário está ordenado por data, por
isso essas são as provas que vêm a seguir, e o resto chega sozinho com as
semanas.

Três coisas que ela nos ensinou, e as três são partilhadas:

- **Responde 429 ao nosso ritmo.** Setecentos milissegundos entre páginas é
  demasiado depressa para este site, três segundos não. Uma fonte pode agora
  pedir o seu próprio ritmo (`delayMs`), e uma página recusada a meio do
  calendário passa a guardar o que já foi lido em vez de deitar a corrida fora.
- **O país vem como «Deutschland».** O `addressCountry` do schema.org está
  documentado como ISO 3166-1 alpha-2 e é publicado como quiserem. Passar isso
  para maiúsculas arquivava provas no país «DEUTSCHLAND», que é o campo que a
  deduplicação compara.
- **A distância só existe na descrição**, e em prosa um número pequeno não é uma
  prova: «na pista de 400 m» é o comprimento da volta e «de 400 m a 10 km» é a
  prova das crianças. Abaixo de 2 km, um número em prosa não conta. Numa oferta
  com nome («1500 m») conta sempre.

### O que a colheita faz

`harvestRaceCatalog` corre **uma vez por dia e lê uma fonte**, escolhida pelo
dia: com sete fontes activadas, cada uma é lida uma vez por semana, tal como
quando uma corrida lia todas, mas com um sétimo do trabalho em cada invocação.
Ler tudo de uma vez fazia o tempo de execução crescer com cada fonte
acrescentada, até o limite da função passar a ser o limite de quantas fontes a
app podia ter. Assim, uma fonte em baixo custa a sua vez e não a colheita.

O dia escolhe a fonte, não um cursor guardado: forçar a execução no mesmo dia lê
sempre a mesma fonte, e não há estado para encravar.

Para a fonte do dia:

1. Lê o sitemap e escolhe as páginas de evento, as mais recentemente alteradas
   primeiro (`lastmod` ordena o trabalho, não o filtra).
2. Busca cada página com uma pausa entre pedidos e um `user-agent` que se
   identifica e diz onde reclamar.
3. Lê os nós `Event`, tira as distâncias dos nomes das inscrições, e descarta o
   que já passou, o que está cancelado e o que não tem distância nenhuma.
4. Deduplica: nome sem a edição, mais o dia, mais o país.
5. Escreve em `raceCatalog` como `unreviewed`, `producer: harvest`.

### As duas regras que protegem o catálogo

- **Nunca por cima de uma pessoa.** Uma entrada `curated` ou já `reviewed` só
  recebe uma edição que lhe faltava. Nome, forma de inscrição e datas revistas
  ficam como estão.
- **Piso de colapso.** Se uma colheita traz menos de 80% do que **essa fonte**
  já tem no catálogo, não publica nada. São scrapes: uma mudança de template lá
  em cima custa uma corrida, não a funcionalidade. Por fonte e não por catálogo,
  porque uma corrida lê uma fonte, e porque uma fonte a apagar-se ficava
  escondida pelo volume das outras.

  O piso só se aplica a uma fonte **lida por inteiro**. Uma que leia uma fatia
  das páginas por desenho (`rotatePages`), ou que o site tenha cortado a meio,
  traz menos por razões que conhecemos, e o piso não distingue leitura curta de
  parser avariado. Isentá-las é seguro porque uma colheita nunca apaga: uma
  corrida curta escreve menos, não remove o que já lá está.

E a regra que vem do #249: uma entrada `unreviewed` pode **sugerir** (preencher
um campo que o corredor vê e corrige) e nunca **afirmar** (nada de lembretes ou
contagens decrescentes).

### Duplicados: quando a mesma prova já está no catálogo

A colheita compara cada prova com o catálogo inteiro, não só com as outras da
mesma corrida. Duas formas contam como a mesma prova, e ambas exigem o mesmo dia,
a mesma cidade e uma distância em comum:

1. **Uma entrada que uma pessoa reviu.** Alguém a verificou, e uma colheita a
   aparecer com o nome do organizador não é novidade. É o que junta «Berlin Half
   Marathon» e «GENERALI BERLINER HALBMARATHON», que são uma prova e não
   partilham quase nenhuma letra.
2. **Nomes que claramente concordam**, depois de tirar patrocinadores e edição.

Fora disso ficam duas provas. O fim de semana da maratona de Berlim mostra
porquê: a «GENERALI 5K im Rahmen des BMW BERLIN-MARATHON» e a «R5K Tour Finale»
são ambas de 5 km, ambas em Berlim, ambas a 26/09/2026, e são duas corridas
diferentes. O que a colheita ainda não resolve, duas fontes a trazerem a mesma
prova com nomes que não concordam, está na
[issue #291](https://github.com/Seven-Panda-Labs/queima-asfalto/issues/291).

### Acrescentar uma fonte

1. Verifica o `robots.txt` e os termos. Se houver dúvida, pede autorização.
2. Confirma que uma página de evento tem `application/ld+json` com um nó
   `Event` ou `SportsEvent`.
3. Guarda o bloco JSON-LD como fixture em `shared/eventDiscovery/fixtures/`.
4. Acrescenta a fonte a `DISCOVERY_SOURCES` em
   [`functions/src/discovery/sources.ts`](../functions/src/discovery/sources.ts)
   com o `kind` e o que ele precisa.
5. Um teste sobre o fixture. Se o parser precisar de mudar para a ler, é porque
   a fonte não é tier 1 ou 2, e aí a conversa é outra.

Nada corre sem `DISCOVERY_SOURCES` no `functions/.env`. Ver
[`self-hosting.md`](./self-hosting.md).

<a id="english"></a>

## English

How the app finds new races, and what it takes to add a source.

### What counts as a source

A source is a site that publishes upcoming races in a machine-readable way. Two
things decide whether it qualifies, in this order:

1. **Permission.** `robots.txt` allows the path, the sitemap is advertised, and
   the terms do not forbid automated reading. A bot challenge (Cloudflare, say)
   is an answer: no.
2. **Data shape.** One of three, and nothing else:

   | `kind` | Shape | Cost per run |
   |---|---|---|
   | `sitemap` | a page per event, each with `schema.org` | one fetch per event |
   | `search` | a JSON calendar, plus a page per event | one fetch per event |
   | `listing` | the whole calendar on one page | one fetch, total |

   Anything that needs a browser to run before the data exists is not a source.
   davengo's `/v3/event/register/…/overview` is a Vaadin app, and driving that
   protocol is the same class of thing as a Livewire grid: a route that changes
   per deploy, and the operator saying without saying that they do not want that
   traffic.

We do not write one connector per calendar. There are hundreds and they largely
list the same races, so the goal is not source coverage; it is picking the ones
that are cheapest to read, then deduplicating.

### The sources this codebase reads

None of them runs unless `DISCOVERY_SOURCES` names it.

| id | `kind` | What it gives |
|---|---|---|
| `acorrer.pt` | `sitemap` | races in Portugal, `schema.org` on every page |
| `davengo.com` | `search` | races in Germany, distances read off the starter list |
| `kilometerliebe.de` | `listing` | 447 German races on one page, with the exact distances |
| `running.life` | `listing` | German races as `schema.org`, 20 a page, the nearest first |
| `scc-events.com` | `listing` | Berlin, a timing operator's own calendar |
| `marathon.de` | `sitemap` | 406 races, with the city, the distances and a fee per distance |
| `planet-marathon.de` | `listing` | marathons on every continent, three pages |

`planet-marathon.de` is a calendar one person keeps by hand (Franz Schwengler),
and it is the widest reach we have: 386 marathons, 55 countries. Three things
only it has:

- **The official distance only.** That is the site's own rule: nothing is listed
  unless it has the official 42.195 km. So this reader parses no distance at
  all, it asserts one.
- **No HTTPS and no charset.** The server's TLS does not negotiate, and the
  `Content-Type` is a bare `text/html` over ISO-8859-1 bytes. Without the source
  declaring that, "Fränkische" enters the catalog as "Fr�nkische".
- **Country codes typed from memory.** `JAP`, `MAY`, `SER`, `ROM`, and both
  `SLK` and `SVK`. The table knows either spelling, and a row whose code does
  not resolve is a row we drop: country is what dedup compares.

It also drops the marathon that is a leg of a triathlon relay and the one run
over three stages: neither is a marathon anybody can enter.

`marathon.de` is the only source that gives a **fee**. No `schema.org`, but
every event page is written the same way, with labels:

```
Datum: Samstag, 05.09.2026        (a two day range starts on the first)
Ort: Wolgast, Deutschland         city and country, the country in German
Distanzen: 21 km / 42 km
Startgebühr: 21 km ... 16,00 - 25,00 Euro | 42 km ... 25,00 - 35,00 Euro
```

Two consequences worth knowing:

- **The sitemap has no `lastmod`**, so a limit would read the same first pages
  for ever. Each run reads a different slice (`rotatePages`), the offset moving
  by week: 150 pages a week covers all 406 in three.
- **The fee is the event's, not the distance's.** `lowPrice` is the cheapest the
  page lists and `highPrice` the dearest, which is what those fields mean. For a
  race selling a 5K and a marathon, the entry fee is not one number.

`kilometerliebe.de` is the cheapest source we read and the one that finally
pulls the catalog towards the short distances: one request, 447 races, 271 with
a 10K, 242 with a 5K and 172 with a half. It hands the fields over as attributes
rather than as prose:

```html
<article data-event-card data-event-title="34. Fohlenhoflauf"
  data-event-city="Homburg" data-event-state="Saarland"
  data-event-date="2026-09-03" data-event-category="lauf">
  <span class="distpill">4 km</span><span class="distpill">5 km</span>…
```

Two choices worth recording:

- **The distances come from the pills, not the attribute.**
  `data-event-distances` says `5k,10k`, which are the site's filter buckets; the
  pills say 4, 5 and 10 km, which are the races.
- **Only `lauf` and `trail`.** The calendar also carries triathlons and hikes,
  and a triathlon's legs would enter the catalog as kilometres nobody ran. A run
  measured in hours (a 24h, a backyard) is left out too: it has no distance.

`running.life` publishes `schema.org` on the calendar page itself, and the event
page adds nothing, so none is fetched. There are 116 pages of 20 and we read the
first 25: the calendar is ordered by date, so those are the races coming up, and
the rest arrives on its own as the weeks pass.

Three things it taught us, and all three are shared:

- **It answers 429 at our pace.** Seven hundred milliseconds between pages is
  too fast for this site and three seconds is not. A source can now ask for its
  own pace (`delayMs`), and a page refused halfway through a calendar keeps what
  was already read instead of throwing the run away.
- **The country arrives as "Deutschland".** schema.org documents
  `addressCountry` as ISO 3166-1 alpha-2 and sources publish whatever they like.
  Upper-casing it filed races in the country "DEUTSCHLAND", which is the field
  dedup compares.
- **The distance only exists in the description**, and in prose a small number
  is not a race: "auf der 400 m Bahn" is the lap of a track and "von 400 m bis
  10 km" is the children's dash. Under 2 km, a number in prose does not count.
  In a named offer ("1500 m") it always does.

### What the harvest does

`harvestRaceCatalog` runs **once a day and reads one source**, picked by the
day: with seven sources enabled each is read once a week, the same as when one
run read them all, with a seventh of the work in any one invocation. Reading
everything at once made the runtime grow with each source added, until the
function's timeout was the limit on how many sources this app could have. This
way a source that is down costs its own slot rather than the harvest.

The day picks the source rather than a stored cursor: forcing a run on the same
day reads the same source, and there is no state to get stuck.

For the day's source:

1. Reads the sitemap and picks the event pages, most recently changed first
   (`lastmod` orders the work rather than filtering it).
2. Fetches each page with a delay between requests and a `user-agent` that says
   who it is and where to complain.
3. Reads the `Event` nodes, recovers the distances from the names of what the
   event sells, and drops the past, the cancelled and the distanceless.
4. Deduplicates: name without its edition, plus the day, plus the country.
5. Writes into `raceCatalog` as `unreviewed`, `producer: harvest`.

### The two rules that protect the catalog

- **Never over a person.** A `curated` or already `reviewed` entry only ever
  gains an edition it was missing. Its name, entry method and reviewed dates
  stay as they are.
- **Collapse floor.** A harvest returning under 80% of what **that source**
  already has in the catalog publishes nothing. These are scrapes: a template
  change upstream costs a run, not the feature. Per source rather than per
  catalog, because a run reads one source, and because a source going dark used
  to be hidden by the volume of the others.

  The floor applies only to a source read **whole**. One that reads a slice of
  its pages by design (`rotatePages`), or that the site cut short, brings back
  less for reasons we know, and the floor cannot tell a short read from a broken
  parser. Exempting them is safe because a harvest never deletes: a short run
  writes fewer entries, it does not remove the ones already there.

Plus the rule from #249: an `unreviewed` entry may **suggest** (prefill a field
the runner can see and correct) and may never **assert** (no reminders, no
countdowns).

### Duplicates: when the catalog already holds the race

The harvest compares each race against the whole catalog, not only against the
others in the same run. Two shapes count as the same race, and both need the
same day, the same city and a distance in common:

1. **An entry a person reviewed.** They checked it, and a harvest turning up
   with the organiser's own name for it is not news. This is what joins "Berlin
   Half Marathon" and "GENERALI BERLINER HALBMARATHON", which are one race and
   share almost no letters.
2. **Names that plainly agree**, once the sponsors and the edition are gone.

Anything else stays two races. The Berlin marathon weekend shows why: "GENERALI
5K im Rahmen des BMW BERLIN-MARATHON" and "R5K Tour Finale" are both 5 km, both
in Berlin, both on 26/09/2026, and they are two different races.

A copy is pointed at the survivor (`duplicateOfCatalogRaceId`) and never
deleted: `races.catalogRaceId` may already point at it, and no Firestore rule
can check for references.

**The rest is a question, not a rule.** Two sources can bring the same race
under two organiser names that agree on nothing, with nobody having checked
either entry, and there is no evidence there to merge on. Those pairs, same day,
same city, a distance in common, and no name or review to settle it, go to
"Possibly the same race" at the top of the admin catalog, with two answers:

- **Same race**, which points the second entry at the first.
- **Different races**, which is written on both entries (`notDuplicateOf`) so the
  next harvest neither merges them nor asks again.

### Adding a source

1. Check `robots.txt` and the terms. If in doubt, ask for permission.
2. Confirm an event page carries `application/ld+json` with an `Event` or
   `SportsEvent` node.
3. Save that JSON-LD block as a fixture in `shared/eventDiscovery/fixtures/`.
4. Add the source to `DISCOVERY_SOURCES` in
   [`functions/src/discovery/sources.ts`](../functions/src/discovery/sources.ts)
   with its `kind` and whatever that kind needs.
5. One test over the fixture. If the parser has to change to read it, the source
   is not tier 1 or 2, and that is a different conversation.

Nothing runs without `DISCOVERY_SOURCES` in `functions/.env`. See
[`self-hosting.md`](./self-hosting.md).
