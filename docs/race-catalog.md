# Catálogo de corridas: formato e revisão

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

O catálogo é a lista curada de provas que a app conhece por nome, em [`src/data/race-catalog.json`](../src/data/race-catalog.json), com os tipos e as funções puras em [`shared/raceCatalog/`](../shared/raceCatalog/). Serve dois propósitos: preencher uma corrida sem a escrever à mão, e, quando as datas forem de confiança, alimentar os prazos de inscrição de #246.

### Uma forma, dois produtores

| Produtor | O que é | Estado |
|----------|---------|--------|
| Seed commitado | JSON neste repo, curado por PR | existe |
| Colheita agendada | um documento Firestore refrescado por uma função | #210 |

O seed é também o fallback: uma instância sem Cloud Functions fica com ele e funciona.

### A regra da revisão

Cada entrada tem um campo `review`, e é este o ponto do formato:

- **`unreviewed`**: a entrada foi montada a partir de listagens públicas e ninguém a confirmou junto do organizador. Pode **sugerir**, ou seja preencher um campo que o corredor vê e corrige. Não pode **afirmar**: nenhum lembrete de prazo, nenhuma contagem, nada que esteja errado em silêncio.
- **`reviewed`**: alguém verificou a entrada na fonte oficial.

`canAssertDates()` é a função que separa as duas, e um teste garante que uma entrada não revista não tem `editions`. Uma data de inscrição errada é pior do que não haver aviso nenhum.

### Revisar uma entrada

1. Abre o site oficial da prova, o que está em `officialUrl`.
2. Confirma nome, cidade, país, disciplinas, método de inscrição e mês típico.
3. Acrescenta `editions` se houver datas publicadas: `raceDate`, e para o portão `registrationOpensAt`, `registrationClosesAt`, `lotteryDrawAt`, com `timezone` IANA quando a hora importa. O `typicalFee` é o preço de referência dessa edição, com `feeCurrency` em ISO 4217; uma prova tem quase sempre vários preços, e este é o de entrada.
4. Muda `review` para `reviewed` e actualiza `source` para dizer onde confirmaste.
5. Actualiza `updatedAt` no topo do ficheiro.

Uma entrada por PR é aceitável e preferível a um lote: são factos verificáveis um a um, e um lote esconde o que não foi verificado.

### Preços com vários níveis

Muitas provas cobram menos a quem é do país. O `typicalFee` guarda o que **um corredor de fora** paga, porque é esse o utilizador que o catálogo serve: quem consulta uma prova a 2000 km de casa está a planear uma viagem. O outro preço vai para a nota.

### Nomes sem patrocinador

`name` guarda o nome da prova sem o patrocinador: «Berlin Marathon», não «BMW Berlin Marathon». O patrocinador muda de contrato para contrato e o nome no catálogo ficaria errado sem nada acontecer. Alguns organizadores usam eles próprios o nome simples, o que confirma que é o nome estável.

### O `id` é para sempre

`races.catalogRaceId` aponta para ele. Renomear um `id` orfana as corridas que já o referenciam, portanto o `id` não muda: corrige-se o `name` e deixa-se o `id` como está.

---

<a id="english"></a>

## English

[Português](#portugues)

The catalog is the curated list of races the app knows by name, in [`src/data/race-catalog.json`](../src/data/race-catalog.json), with the types and pure functions in [`shared/raceCatalog/`](../shared/raceCatalog/). It serves two purposes: filling in a race without typing it, and, once the dates can be trusted, feeding the registration deadlines of #246.

### One shape, two producers

| Producer | What it is | State |
|----------|-----------|-------|
| Committed seed | JSON in this repo, curated by PR | exists |
| Scheduled harvest | a Firestore document refreshed by a function | #210 |

The seed is also the fallback: an instance with no Cloud Functions keeps it and works.

### The review rule

Every entry carries a `review` field, and this is the point of the format:

- **`unreviewed`**: the entry was assembled from public listings and nobody has confirmed it with the organiser. It may **suggest**, meaning fill in a field the runner sees and can correct. It may never **assert**: no deadline reminder, no countdown, nothing that would be wrong in silence.
- **`reviewed`**: somebody checked the entry against the official source.

`canAssertDates()` is the function that separates them, and a test enforces that an unreviewed entry carries no `editions`. A wrong registration date is worse than no warning at all.

### Reviewing an entry

1. Open the race's official site, the one in `officialUrl`.
2. Confirm the name, city, country, disciplines, entry method and typical month.
3. Add `editions` when dates are published: `raceDate`, and for the gate `registrationOpensAt`, `registrationClosesAt`, `lotteryDrawAt`, with an IANA `timezone` when the hour matters. `typicalFee` is that edition's headline price, with `feeCurrency` in ISO 4217; a race almost always has several prices and this is the entry one.
4. Set `review` to `reviewed` and update `source` to say where it was confirmed.
5. Update `updatedAt` at the top of the file.

One entry per PR is fine, and better than a batch: these are facts verifiable one at a time, and a batch hides what was not verified.

### Tiered fees

Plenty of races charge residents less. `typicalFee` holds what a **visiting runner** pays, because that is the user the catalog serves: someone looking up a race 2000 km from home is planning a trip. The other price goes in the note.

### Names without sponsors

`name` holds the race without its sponsor: "Berlin Marathon", not "BMW Berlin Marathon". Sponsors change from one contract to the next, and the catalog name would go quietly wrong. Some organisers use the plain name themselves, which is what makes it the stable one.

### The `id` is forever

`races.catalogRaceId` points at it. Renaming an `id` orphans the races already referencing it, so the `id` does not change: fix the `name` and leave the `id` alone.
