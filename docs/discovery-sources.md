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

### O que a colheita faz

`harvestRaceCatalog` corre uma vez por semana e, para cada fonte activada:

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
- **Piso de colapso.** Se uma colheita traz menos de 80% do que já está
  guardado, não publica nada. São scrapes: uma mudança de template lá em cima
  custa uma corrida, não a funcionalidade.

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

### What the harvest does

`harvestRaceCatalog` runs once a week and, for each enabled source:

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
- **Collapse floor.** A harvest returning under 80% of what is already stored
  publishes nothing. These are scrapes: a template change upstream costs a run,
  not the feature.

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
in Berlin, both on 26/09/2026, and they are two different races. What the harvest
still does not solve, two sources bringing the same race under names that do not
agree, is in
[issue #291](https://github.com/Seven-Panda-Labs/queima-asfalto/issues/291).

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
