# Catálogo de corridas: formato e revisão

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

O catálogo é a lista de provas que a app conhece por nome, e **vive na instância**, na colecção `raceCatalog` do Firestore, um documento por prova. Os tipos e as funções puras estão em [`shared/raceCatalog/`](../shared/raceCatalog/). Serve dois propósitos: preencher uma corrida sem a escrever à mão, e, quando as datas forem de confiança, alimentar os prazos de inscrição de #246.

Não há catálogo commitado no repo. Cada instância mantém o seu, editado na área de administração (#261), e uma instância que nunca o povoou tem um catálogo vazio, o que é um estado normal: o preenchimento não oferece nada.

Para começar com as provas já revistas, `npm run seed:race-catalog -- --confirm` escreve as 14 que existiam quando o catálogo mudou de casa. Corre uma vez, nunca sobrepõe o que já lá está, e a lista está em [`scripts/data/raceCatalogSeed.ts`](../scripts/data/raceCatalogSeed.ts). É um arranque, não um catálogo.

### Uma colecção, dois produtores

| Produtor | O que escreve | Estado |
|----------|---------------|--------|
| Curadoria | entradas escritas na área de administração, `producer: 'curated'` | #261 |
| Colheita agendada | candidatos escritos por uma função, `producer: 'harvest'` | #210 |

Partilham a colecção de propósito: a fila de «o que precisa de um humano» é uma consulta só, e uma colheita nunca tem de adivinhar se está a sobrepor algo que alguém verificou.

Um documento por prova, e não um documento com todas: as entradas editam-se uma a uma, e ler-modificar-escrever um documento grande perdia a edição que chegasse em segundo. O catálogo do parkrun escolheu o contrário pela razão contrária, milhares de entradas que ninguém edita.

Nada se apaga. O `races.catalogRaceId` aponta para um id e nenhuma regra do Firestore consegue verificar referências, logo uma entrada sai de circulação com `retired: true` e continua legível.

### A regra da revisão

Cada entrada tem um campo `review`, e é este o ponto do formato:

- **`unreviewed`**: a entrada foi montada a partir de listagens públicas e ninguém a confirmou junto do organizador. Pode **sugerir**, ou seja preencher um campo que o corredor vê e corrige. Não pode **afirmar**: nenhum lembrete de prazo, nenhuma contagem, nada que esteja errado em silêncio.
- **`reviewed`**: alguém verificou a entrada na fonte oficial.

`canAssertDates()` é a função que separa as duas. Uma data de inscrição errada é pior do que não haver aviso nenhum.

Um detalhe que vale a pena não confundir: o teste que garante que uma entrada não revista não tem `editions` é sobre o **ficheiro de seed** curado. Uma entrada colhida traz a data que leu e continua `unreviewed`, e é o `canAssertDates()` que a impede de disparar o que quer que seja, não a ausência de edições.

### Edições, e o que é uma edição

Uma edição é **um ano de uma prova anual**: a data, os prazos de inscrição, o sorteio, o preço. É identificada pelo `year`, e o elo entre um evento e a sua edição é derivado do ano da data do evento. Não há campo nenhum no evento a apontar para a edição, de propósito: a edição já é definida pelo ano, o evento já tem a data, e um ponteiro seria uma segunda fonte de verdade a poder discordar da primeira.

Isto só serve provas que acontecem uma vez por ano, e é assumido. **Um evento recorrente não tem edições**: um parkrun acontece todos os sábados, as suas ocorrências derivam de uma regra e não de uma lista, e o que se ignora sobre uma prova anual (a data, o preço, o link dos resultados) é derivável para um parkrun a partir do slug. Os dois modelos divergem porque precisam de coisas diferentes.

### O que um corredor pode devolver ao catálogo

A qualidade dos dados partilhados pode subir com o que os corredores já sabem, e a fronteira é entre o passado e o futuro:

- **O passado confirma-se.** Um evento `completed` com `resultsVerified` é uma testemunha de outra qualidade: o `resultsVerified` só vem da importação oficial, portanto se a página oficial lista o corredor a terminar naquele dia, a data daquela edição não é um palpite. A data e o link dos resultados são factos sobre a prova e podem entrar sozinhos.
- **O futuro pergunta-se.** O preço e os prazos de inscrição vão para a fila de revisão. São o que dispara lembretes, e um prazo errado está errado em silêncio: é exactamente o que a regra da revisão protege, e o `canAssertDates()` não muda.

O que nunca sai da conta: o tempo, o ritmo, a classificação, as notas, a media, o traçado, e se o corredor entrou ou não.

Uma contribuição segue a forma dos votos de duplicados: colecção própria, um documento por (prova, ano, utilizador) para que uma pessoa seja uma voz, e o que chega à edição partilhada são valores e contagens, nunca a identidade de quem contribuiu.

Isto é o desenho decidido, não o que está construído: nada disto existe ainda, e a edição nem tem campo para o link de resultados. Ver [#328](https://github.com/Seven-Panda-Labs/queima-asfalto/issues/328).

### Revisar uma entrada

`npm run catalog:review` lista o que precisa de trabalho, lendo a instância: nunca verificadas, verificadas mas sem edição futura, e em ordem. Depois, por entrada:

1. Abre o site oficial da prova, o que está em `officialUrl`.
2. Confirma nome, cidade, país, disciplinas, método de inscrição e mês típico.
3. Acrescenta `editions` se houver datas publicadas: `raceDate`, e para o portão `registrationOpensAt`, `registrationClosesAt`, `lotteryDrawAt`, com `timezone` IANA quando a hora importa. O `typicalFee` é o preço de referência dessa edição, com `feeCurrency` em ISO 4217; uma prova tem quase sempre vários preços, e este é o de entrada.
4. Muda `review` para `reviewed` e actualiza `source` para dizer onde confirmaste.
5. Grava. O `updatedAt` e o `updatedBy` ficam no documento.

Uma entrada de cada vez, e não um lote: são factos verificáveis um a um, e um lote esconde o que não foi verificado.

### O que entra no catálogo

Uma prova entra quando a app pode fazer algo com ela, e o que a app faz é avisar antes de o portão fechar. Uma prova com sorteio, com esgotamento antecipado ou com tempo de qualificação tem portão; uma que abre inscrições e as mantém abertas até à véspera não tem, e no catálogo seria um nome e um mês que ninguém lê.

Foi por isto que a primeira lista encolheu de 27 para 14 entradas: as provas de destino sem portão saíram, e o que ficou são as sete Majors mais Sydney, as seis SuperHalfs e o 10K de Lisboa.

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

The catalog is the list of races the app knows by name, and it **lives in the instance**, in the Firestore `raceCatalog` collection, one document per race. The types and pure functions are in [`shared/raceCatalog/`](../shared/raceCatalog/). It serves two purposes: filling in a race without typing it, and, once the dates can be trusted, feeding the registration deadlines of #246.

There is no committed catalog in the repo. Each instance keeps its own, edited in the admin area (#261), and an instance that never populated one has an empty catalog, which is a normal state: the prefill offers nothing.

To start with the races already reviewed, `npm run seed:race-catalog -- --confirm` writes the 14 that existed when the catalog moved. It runs once, never overwrites what is already there, and the list is in [`scripts/data/raceCatalogSeed.ts`](../scripts/data/raceCatalogSeed.ts). A bootstrap, not a catalog.

### One collection, two producers

| Producer | What it writes | State |
|----------|----------------|-------|
| Curation | entries written in the admin area, `producer: 'curated'` | #261 |
| Scheduled harvest | candidates written by a function, `producer: 'harvest'` | #210 |

They share the collection on purpose: the queue asking "what needs a human" is one query, and a harvest never has to guess whether it is about to overwrite something a person checked.

One document per race, not one document holding all of them: entries are edited one at a time, and a read-modify-write of a big document would lose whichever edit landed second. The parkrun catalog chose the opposite for the opposite reason, thousands of entries nobody edits.

Nothing is deleted. `races.catalogRaceId` points at an id and no Firestore rule can check for references, so an entry leaves circulation with `retired: true` and stays readable.

### The review rule

Every entry carries a `review` field, and this is the point of the format:

- **`unreviewed`**: the entry was assembled from public listings and nobody has confirmed it with the organiser. It may **suggest**, meaning fill in a field the runner sees and can correct. It may never **assert**: no deadline reminder, no countdown, nothing that would be wrong in silence.
- **`reviewed`**: somebody checked the entry against the official source.

`canAssertDates()` is the function that separates them. A wrong registration date is worse than no warning at all.

One detail worth not confusing: the test enforcing that an unreviewed entry carries no `editions` is about the curated **seed file**. A harvested entry carries the date it read and stays `unreviewed`, and it is `canAssertDates()` that keeps it from firing anything, not the absence of editions.

### Editions, and what an edition is

An edition is **one year of an annual race**: the date, the entry gates, the draw, the fee. It is identified by its `year`, and the link between an event and its edition is derived from the year of the event's date. There is deliberately no field on the event pointing at an edition: the edition is already defined by the year, the event already has the date, and a pointer would be a second source of truth free to disagree with the first.

This only serves races that happen once a year, and that is assumed. **A recurring event has no editions**: a parkrun happens every Saturday, its occurrences follow from a rule rather than a list, and what is unknown about an annual race (the date, the fee, the results link) is derivable for a parkrun from its slug. The two models diverge because they need different things.

### What a runner can give back to the catalog

The quality of the shared data can rise on what runners already know, and the boundary runs between the past and the future:

- **The past confirms itself.** A `completed` event with `resultsVerified` is a witness of a different order: `resultsVerified` only ever comes from the official import, so if the official page lists the runner finishing that day, the date of that edition is not a guess. The date and the results link are facts about the race and can land on their own.
- **The future gets asked.** The fee and the entry gates go to the review queue. They are what fires reminders, and a wrong deadline is wrong in silence: that is exactly what the review rule protects, and `canAssertDates()` does not change.

What never leaves the account: the time, the pace, the classification, the notes, the media, the track, and whether the runner got in.

A contribution follows the shape of the duplicate votes: a collection of its own, one document per (race, year, user) so one person is one voice, and what reaches the shared edition is values and counts, never the identity of whoever contributed.

This is the decided design, not what is built: none of it exists yet, and the edition has no field for a results link. See [#328](https://github.com/Seven-Panda-Labs/queima-asfalto/issues/328).

### Reviewing an entry

`npm run catalog:review` lists what needs work, reading the instance: never checked, checked but out of editions, and in order. Then, per entry:

1. Open the race's official site, the one in `officialUrl`.
2. Confirm the name, city, country, disciplines, entry method and typical month.
3. Add `editions` when dates are published: `raceDate`, and for the gate `registrationOpensAt`, `registrationClosesAt`, `lotteryDrawAt`, with an IANA `timezone` when the hour matters. `typicalFee` is that edition's headline price, with `feeCurrency` in ISO 4217; a race almost always has several prices and this is the entry one.
4. Set `review` to `reviewed` and update `source` to say where it was confirmed.
5. Save. `updatedAt` and `updatedBy` are written on the document.

One entry at a time, not a batch: these are facts verifiable one at a time, and a batch hides what was not verified.

### What belongs in the catalog

A race belongs when the app can do something with it, and what the app does is warn before the gate closes. A race with a lottery, an early sell-out or a qualifying time has a gate; one that opens registration and keeps it open until the day before does not, and in the catalog it would be a name and a month nobody reads.

That is why the first list shrank from 27 entries to 14: destination races with no gate came out, and what stayed is the seven Majors plus Sydney, the six SuperHalfs and the Lisbon 10K.

### Tiered fees

Plenty of races charge residents less. `typicalFee` holds what a **visiting runner** pays, because that is the user the catalog serves: someone looking up a race 2000 km from home is planning a trip. The other price goes in the note.

### Names without sponsors

`name` holds the race without its sponsor: "Berlin Marathon", not "BMW Berlin Marathon". Sponsors change from one contract to the next, and the catalog name would go quietly wrong. Some organisers use the plain name themselves, which is what makes it the stable one.

### The `id` is forever

`races.catalogRaceId` points at it. Renaming an `id` orphans the races already referencing it, so the `id` does not change: fix the `name` and leave the `id` alone.
