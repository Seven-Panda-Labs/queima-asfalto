# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md) | [Français](change-log.fr.md) | [العربية](change-log.ar.md)

---

## [1.82.0] - 2026-09-25

### Alterado

- **Planeamento, em vez de Bucket List:** a época é o caminho até cada prova âncora, com as provas que a preparam em linha, o tempo entre elas, e o espaço entre duas a abrir o catálogo já a perguntar por aquelas datas.
- **Marcar e agendar sem formulários:** um coração no catálogo marca a prova como desejo, e o botão de calendário põe-na na época com a data que o catálogo publica.
- **Um desejo é um marcador:** deixa de ter nome, local e distância próprios, que são os da prova, e fica só com a tua nota.
- **O sorteio e os prazos vivem na prova:** deixam de estar no caminho de toda a gente e passam a estar onde importam, nas provas âncora com inscrição disputada.
- **O mapa dos desejos lê o sítio da prova:** uma prova marcada no catálogo passa a guardar as coordenadas que o catálogo publica, e o mapa mostra o que a prova sabe em vez do que o desejo tinha copiado.
- **A app passa a saber onde ficam as provas do catálogo:** todas as noites descobre onde estão até trezentas, a partir da terra e do país que as fontes publicam. Dois terços do catálogo não trazia coordenadas, e sem elas uma prova não aparece no mapa nem numa procura por raio.
- **Cada desejo diz quando é:** a data da próxima edição, assim que o organizador a publica e a recolha a traz, ou o mês em que a prova costuma ser enquanto não há data. Na própria linha, ao lado do botão que a põe no calendário.
- **Uma inscrição pode existir antes do calendário:** um sorteio entregue com um ano de antecedência, ou uma prova que falhou e vais tentar na época seguinte, aparecem no planeamento dessa época e abrem para editar prazos, mesmo sem data marcada.
- **As ações de cada linha são iguais em todo o lado:** o catálogo e os parkruns deixam de misturar links, emojis e botões coloridos, e passam a usar os mesmos ícones com etiqueta que os eventos usam desde sempre. O painel de partilha passou para dentro dos desejos, que é o que é partilhado.

---

## [1.81.0] - 2026-09-18

### Adicionado

- **Perguntar mais tarde:** na lista de provas à espera de temporada nova, as provas escolhidas podem ser adiadas uma semana, um mês ou três meses, para poderes ler as que ainda não viste sem paginar dez vezes.
- **O total é o total:** o número no topo dessa lista passa a ser as provas que estão mesmo à espera, contadas no servidor, em vez de crescer a cada «Mostrar mais».

---

## [1.80.0] - 2026-09-18

### Corrigido

- **Anular um varrimento de provas retiradas volta a funcionar:** a razão era escrita como «nada» em vez de apagada, e as regras recusavam a escrita inteira.

---

## [1.79.0] - 2026-09-18

### Corrigido

- **Os parkruns saem do calendário de provas anuais:** eram lidos dos calendários alemães como se fossem provas com data e inscrição, ao lado do mesmo local no catálogo de parkrun da app. Provas anuais com «park run» no nome, como o Brescia Park Run, ficam.

---

## [1.78.0] - 2026-09-18

### Corrigido

- **A recolha diária tem tempo para acabar:** o último passo, a lista de possíveis duplicados, corria o risco de ficar por fazer quando a fonte do dia era grande.

---

## [1.77.0] - 2026-09-18

### Corrigido

- **«Mostrar mais» já sabe quando acabou:** na lista de provas confirmadas sem edição futura, o botão repetia a última página sem fim e o total no topo crescia com ela. Também deixa de saltar provas que partilham a mesma data.

---

## [1.76.0] - 2026-09-18

### Alterado

- **Também nas provas vindas da kilometerliebe.de:** o link da prova passa a ser o site do organizador, como já acontecia nas outras duas plataformas. São 267 provas, resolvidas ao longo de algumas noites.

---

## [1.75.0] - 2026-09-18

### Alterado

- **A fila de duplicados diz porque está a perguntar:** quando as duas provas apontam para a mesma página do organizador, a lista mostra-a por baixo do par.

---

## [1.74.0] - 2026-09-18

### Adicionado

- **Provas repetidas com o mesmo site:** a lista de possíveis duplicados passa a juntar duas provas que apontam para a mesma página do organizador, mesmo quando cada calendário as arrumou numa vila diferente.

---

## [1.73.0] - 2026-09-18

### Adicionado

- **O site do organizador também nas provas novas:** todas as noites a app lê até cem páginas de calendário e troca o link da plataforma pelo site da prova.

---

## [1.72.0] - 2026-09-18

### Corrigido

- **O que é decidido no catálogo sobrevive à recolha:** o site do organizador, a razão de uma prova ter saído e o «isto é uma corrida» deixavam de existir na recolha da noite seguinte.

---

## [1.71.0] - 2026-09-18

### Alterado

- **O link de uma prova passa a ser o site do organizador:** até agora era a página do calendário onde a prova foi encontrada, o que obrigava a um segundo clique para chegar ao sítio certo. A página de onde veio fica guardada à parte.

---

## [1.70.0] - 2026-09-17

### Adicionado

- **Dizer "são corridas" e não voltar a ver:** na lista do que parece outro desporto, as provas que são mesmo corridas ficam marcadas como tal e deixam de aparecer. Com anulação, caso o sim tenha sido rápido de mais.

---

## [1.69.0] - 2026-09-17

### Adicionado

- **Resultados do STGK:** as provas cronometradas pelo STGK, no norte da Alemanha, passam a importar o resultado automaticamente. Cola o link dos resultados da prova e a app encontra a classificação certa entre as várias distâncias do dia.

---

## [1.68.0] - 2026-09-17

### Adicionado

- **Listar o que parece não ser corrida:** na administração, um botão procura triatlos, caminhadas e afins pelo nome, para decidires em bloco. Uma corrida com caminhada ao lado fica de fora da lista, porque é uma corrida.

---

## [1.67.0] - 2026-09-17

### Adicionado

- **Tirar várias provas do catálogo de uma vez:** escolhem-se as linhas, dá-se uma razão, e ficam todas fora de circulação. Com um botão para anular a limpeza inteira, caso tenha ido longe de mais.

---

## [1.66.0] - 2026-09-17

### Corrigido

- **Tirar uma prova do catálogo pede só a razão:** deixa de exigir distâncias, fonte, e de obrigar a marcá-la como verificada. Um triatlo lido como corrida não tem distância que valha a pena inventar.

---

## [1.65.0] - 2026-09-17

### Adicionado

- **Importar o resultado do parkrun a partir da página impressa:** o parkrun não deixa procurar automaticamente, mas deixa-te imprimir os resultados para PDF. Abre esse ficheiro no editor do resultado e a app tira de lá o teu tempo, a tua posição e o tamanho do campo. As duas versões da página, a compacta e a detalhada, são lidas. O ficheiro é lido no teu equipamento e não é enviado para lado nenhum.

### Corrigido

- **Nomes abreviados deixaram de corresponder à pessoa errada:** quando alguém omite o apelido, os resultados mostram algo como «Jonas S». A app tratava essa inicial como um pedaço de texto solto, o que a fazia corresponder a quase qualquer nome. Passa a ser tratada como o início de um nome.

---

## [1.64.0] - 2026-09-17

### Adicionado

- **Importar o resultado do PDF oficial:** onde o cronometrista publica a classificação mas bloqueia a procura, como no MaxFunSports, descarrega o PDF e abre-o no editor do resultado. A app encontra-te na tabela e preenche tempo e classificação. O ficheiro é lido no teu equipamento e não é enviado para lado nenhum.

---

## [1.63.0] - 2026-09-17

### Corrigido

- **Corrigir um resultado à mão deixou de estar tapado:** o botão de voltar a procurar cobria o lápis de editar. Agora ficam lado a lado.
- **Registar um resultado deixou de dar em nada:** o atalho do cronómetro levava a uma página que já não existe, e uma prova já corrida só oferecia o formulário depois de marcada como concluída.

### Alterado

- **A procura automática no MaxFunSports foi desligada:** o site bloqueia qualquer leitura automática. O tempo regista-se à mão.

---

## [1.62.0] - 2026-09-14

### Adicionado

- **O calendário de um segundo cronometrista:** a descoberta passa a ler 32 provas na Renânia, cada uma com o sítio da própria prova, e todas já resolvem para uma plataforma de resultados que a app importa. Fica desligado até o activares.

---

## [1.61.0] - 2026-09-14

### Alterado

- **Ao marcares uma inscrição como feita, pedimos o preço:** só se o catálogo não tiver nenhum, e nunca a bloquear. Nenhum calendário publica preços, portanto quem pagou é a única fonte. A moeda passa a ser uma lista, para o preço não se perder por causa de três letras.

---

## [1.60.0] - 2026-09-14

### Corrigido

- **O lugar oficial deixa de ser recalculado:** quando uma prova RaceResult escrevia a coluna do lugar geral como `GesPl.p`, a importação não a reconhecia e refazia a classificação ordenando tempos. Dava um número próximo mas errado, sem nada que o denunciasse.
- **Uma página que só embute o RaceResult passa a ser reconhecida:** o endereço que o corredor copia não traz fragmento nenhum, e a importação recusava-o. Agora a página é lida e o evento sai do próprio embed.

---

## [1.59.0] - 2026-09-14

### Adicionado

- **A prova passa a celebrar o que mudou:** ao guardar um resultado aparece um painel com confetis para um novo recorde pessoal, um objetivo do ano cumprido, uma meta de performance, a estreia numa distância, o recorde de um percurso e os números redondos, em vez do simples aviso de resultado guardado. O que a prova marcou fica na sua página para sempre, mesmo depois de ser superado, e quem prefere menos movimento não leva confetis.

### Alterado

- **O recorde pessoal passa a ler-se do tempo, não do ritmo arredondado:** duas provas que mostram 5:20 podiam estar a três segundos uma da outra, e o desempate não era o mesmo no Início, na análise e nas metas. Os três seguem agora a mesma regra.

---

## [1.58.0] - 2026-09-13

### Corrigido

- **A classificação passa a dizer o campo em que foi feita:** no RaceResult, uma prova que publica uma lista por escalão dava o tamanho do escalão como se fosse o total, e ficava sem lugar geral. No mika:timing, as provas que separam a classificação de homens e mulheres ficavam sem total nenhum. Agora o lugar e o total vêm sempre da mesma lista.

---

## [1.57.0] - 2026-09-13

### Corrigido

- **Um link de resultados imperfeito deixa de impedir a importação:** colar a página do próprio resultado no RaceResult (`/details1?pid=…`) passa a funcionar como colar a lista. No mika:timing, as provas que publicam a pesquisa sem tempo e sem link deixam de ficar por importar: a prova é encontrada pelo selector de provas e o tempo vem da página do corredor.

---

## [1.56.0] - 2026-09-13

### Alterado

- **O nome de uma prova deixa de repetir a terra:** "Paarlauf im Rahmen des Sportabzeichentages - Frankfurt (Oder)" passa a mostrar só o nome, com a terra ao lado como sempre esteve. Só quando a terra é o fim inteiro do nome e o resto continua a identificar a prova.
- **Numa parkrun deixa de aparecer o convite para a ligar ao catálogo:** as parkrun não vivem nesse catálogo, as ocorrências vêm do próprio evento parkrun. Numa prova apenas chamada "parkrun", sem ligação a nenhuma, o convite continua.

---

## [1.55.0] - 2026-09-13

### Alterado

- **Os nomes das provas deixam de trazer a edição:** "33. Graz Marathon" passa a ser "Graz Marathon", porque a prova é a mesma e o número muda todos os anos. Um número que faz parte do nome ("10 Marathon in 10 Tagen") fica.

---

## [1.54.0] - 2026-09-13

### Corrigido

- **Uma prova criada na administração passa a ser encontrável:** ficava sem as palavras por que a busca procura, portanto não aparecia em lado nenhum e o identificador dela bloqueava quem a tentasse criar de novo. O erro de identificador repetido passa também a levar à prova que o tem.

---

## [1.53.0] - 2026-09-11

### Adicionado

- **Dizer porque uma prova sai do catálogo:** acabou, não é corrida (triatlo, caminhada, bicicleta), ou não é sequer uma prova. A razão é sempre escolhida por uma pessoa, e o que não é corrida deixa de ser reescrito a cada colheita.

---

## [1.52.0] - 2026-09-11

### Corrigido

- **Juntar duas provas voltou a funcionar:** quando faltava um campo às duas (o link de inscrição, por exemplo), a junção falhava com "não foi possível guardar" e as duas ficavam como estavam.

---

## [1.51.0] - 2026-09-11

### Alterado

- **As provas fora de circulação ficam discretas como as fundidas:** na administração, tudo o que o catálogo não mostra a um corredor lê-se mais apagado do que o que mostra.

---

## [1.50.0] - 2026-09-11

### Alterado

- **As provas fundidas distinguem-se à vista:** na administração, uma prova que aponta para outra fica com o nome e o fundo mais discretos, para não se confundir com a que o catálogo mostra.
- **A moeda de um preço escolhe-se de uma lista:** com o código e o nome na tua língua, em vez de três letras à mão, e um preço sem moeda deixa de poder ser guardado.
- **O fuso horário deixa de ser perguntado:** vem do país da prova, e só se escolhe quando o país tem mesmo vários fusos, com a lista reduzida a esse país. Antes era um campo repetido em cada edição.
- **Datas na administração com o calendário da app:** escritas no formato da tua língua (11/09/2026) e não no do sistema operativo do navegador, e os prazos passam a ser data mais hora opcional, na hora da prova.
- **A página oficial abre-se da lista:** cada prova na administração passa a ter um 🔗 para a fonte, para verificar a temporada seguinte sem entrar no formulário.

---

## [1.49.0] - 2026-09-11

### Corrigido

- **Juntar duas provas passa a juntar o que ambas sabiam:** a prova que fica recebe as edições, as datas, os preços, os links de resultados, o site oficial e as distâncias da outra. Antes só ficava a apontar, e a informação desaparecia de vista.

---

## [1.48.0] - 2026-09-10

### Adicionado

- **Juntar duas provas do catálogo à mão:** na administração, escolhes a repetida, procuras a que fica e juntas. Antes só a fila de duplicados juntava provas, e há nomes que nenhuma regra consegue comparar.
- **Encontrar uma prova cujo nome é quase todo números:** escrever "S25" ou "S 25" passa a encontrar a prova, que antes só aparecia se procurasses por "Berlin", entre centenas.

---

## [1.47.0] - 2026-09-10

### Corrigido

- **Uma data mal escrita já não deixa a página em branco:** uma prova do catálogo com uma data impossível fazia a página do evento falhar por inteiro. Agora aparece um traço, e a administração passa a usar um selector de data que não aceita datas inválidas.
- **Responder "provas diferentes" tira o par da lista:** a resposta ficava guardada mas o par continuava no painel até ao dia seguinte, como se o botão não fizesse nada.

---

## [1.46.0] - 2026-09-10

### Corrigido

- **Provas diferentes deixam de ser juntadas por partilharem o dia:** partilhar o dia, a cidade e a distância com uma prova já verificada não a torna a mesma prova, e passava a ser tratada como cópia. Agora só os nomes juntam duas entradas, e uma prova numa terra vizinha (por exemplo "Rüdersdorf bei Berlin") já não conta como sendo na cidade grande.

---

## [1.45.0] - 2026-09-10

### Corrigido

- **Propor uma prova liga-te a ela:** a prova que propões passa a ficar ligada ao teu evento, com o dia e a página de resultados que já tinhas. Antes a entrada era criada e ficavas de fora dela.
- **Menos provas repetidas:** a mesma prova guardada duas vezes para anos diferentes passa a ser reconhecida, e propor uma prova que o catálogo já tem noutro ano liga-te à que lá está em vez de criar outra. A terra de uma proposta passa a vir do fim da localização (a cidade), não do início (o parque).

---

## [1.44.0] - 2026-09-10

### Adicionado

- **Ligar uma prova ao catálogo conta o que já correste:** as edições que corriste com resultado verificado passam a entrar no catálogo, e não só as próximas.
- **Os resultados de cada edição no catálogo:** ao importar um resultado verificado, o link da página de resultados desse ano passa a ficar no catálogo, sem nada que te identifique (uma busca pelo teu nome ou a tua linha da tabela ficam de fora).
- **Os resultados que outros já encontraram:** num evento sem link de resultados, o catálogo oferece a página desse ano, e é um clique teu para a usar.

### Alterado

- **O fuso horário escolhe-se de uma lista:** por região e com a hora de cada uma, em vez de escrever o nome IANA à mão.

### Corrigido

- **Depois de dizer qual é a prova, a caixa desaparece:** antes ficava a pedir o mesmo até recarregar a página.

---

## [1.43.0] - 2026-09-10

### Adicionado

- **A busca por nome acerta mais:** usa todas as palavras que escreves e põe à frente as provas que mais correspondem, não as mais próximas.
- **Propor uma prova diz o que se segue:** a mensagem deixa claro que não falta fazer nada, e quem mantém o catálogo passa a ver as propostas à espera.
- **Administração do catálogo mais rápida:** o painel mostra as provas que precisam de trabalho, cinquenta a cinquenta, em vez de descarregar as cinco mil.
- **O país escolhe-se de uma lista:** com os nomes na tua língua, em vez do código de duas letras.

---

## [1.42.0] - 2026-09-09

### Adicionado

- **Procurar uma prova pelo nome:** a busca passa a procurar em todo o catálogo, e não só nas provas que já estavam na página.
- **Dizer qual é a prova:** liga a prova do teu evento ao catálogo partilhado, e as datas e o preço da próxima edição passam a vir preenchidos.
- **Propor uma prova que falta:** se a prova que corres não está no catálogo, podes propô-la na página do evento.

---

## [1.41.0] - 2026-09-09

### Adicionado

- **Duplicados no catálogo:** cada prova da fila de revisão traz agora o link para a fonte, para confirmar nas páginas de origem qual das duas é qual.
- **A inscrição já vem preenchida:** ao planear uma prova que o catálogo conhece, as datas, os prazos e o preço aparecem preenchidos, com a fonte à vista. Enquanto ninguém tiver verificado a entrada, ficam como sugestão e a data não conta como confirmada.
- **O teu resultado oficial melhora o catálogo:** ao importar um resultado verificado, dizes ao catálogo em que dia a prova se correu. Um ano que o catálogo não tinha entra logo; corrigir uma data que ele já tinha precisa de dois corredores a concordar. Vai só o dia, nunca quem o enviou, e continua a não disparar avisos.
- **Quanto custou, para quem vier depois:** ao marcares uma inscrição como feita, o preço que pagaste passa a ficar no catálogo. Nenhum dos calendários que lemos publica preços, portanto isto só existe porque os corredores o dizem. Mudar um preço que o catálogo já tem exige dois corredores a concordar.

---

## [1.40.0] - 2026-09-09

### Adicionado

- **Provas perto de ti:** a busca de provas ganha um raio, de 10 a 250 km, a contar da tua localização ou da terra que escreveres.
- **Provas repetidas:** quando duas linhas da busca são a mesma prova escrita de duas maneiras, podes dizer-nos com um toque.

### Alterado

- **Busca por distância:** as provas cujo calendário só diz a distância na descrição passam a entrar no filtro.

### Corrigido

- **A mesma prova duas vezes:** muito menos repetições na lista, quando as fontes escrevem a terra, a data ou a língua de outra maneira.

---

## [1.39.0] - 2026-09-04

### Alterado

- **Encontrar provas:** a página passa a pedir um filtro antes de mostrar lista, ganha busca por país, e traz os resultados aos poucos em vez de descarregar o catálogo inteiro para o browser.

---

## [1.38.0] - 2026-09-04

### Corrigido

- **Provas repetidas no catálogo:** a mesma prova deixa de entrar duas vezes quando duas fontes lhe dão nomes ligeiramente diferentes, quando uma delas não publica a distância, ou quando o nome da terra muda de lugar.

---

## [1.37.0] - 2026-09-04

### Adicionado

- **Provas em 60 países:** a descoberta passa a poder ler um calendário mundial com 2280 provas, a maioria de 5 e 10 km, e calendários de meia maratona de 17 países. Continua desligada até as activares.

---

## [1.36.0] - 2026-09-04

### Corrigido

- **Actualização do catálogo:** uma fonte que só é lida em parte (por fatias, ou porque o site cortou a meio) deixou de ser tomada por avariada, o que impedia a sua actualização.

---

## [1.35.0] - 2026-09-03

### Adicionado

- **Mais provas curtas:** a descoberta passa a poder ler dois calendários alemães com muitos 5 km, 10 km e meias maratonas. Continua desligada até as activares.

### Alterado

- **Catálogo actualizado aos poucos:** o catálogo passa a ser actualizado todos os dias, uma fonte de cada vez, e uma fonte em baixo já não atrasa as outras.

### Corrigido

- **Self-hosting:** o deploy das funções falhava desde a última actualização de dependências.

---

## [1.34.0] - 2026-09-03

### Adicionado

- **Duas fontes novas na descoberta:** maratonas em 55 países, e provas alemãs com o preço da inscrição. Continua desligada até as activares.

---

## [1.33.0] - 2026-09-03

### Adicionado

- **A estrada da temporada:** o herói mostra a última prova, a próxima e a prova objetivo, com a contagem para cada uma.

### Alterado

- **Planear é mover:** agendar uma prova da bucket list passa-a para o calendário e tira-a da lista.
- **Avisos da temporada:** ficam na página da prova e já não desaparecem quando a agendas.

### Corrigido

- **Distâncias com decimais:** já é possível guardar 42,195 km.
- **Provas repetidas no catálogo:** a mesma prova deixa de aparecer duas vezes com nomes diferentes.

---

## [1.32.0] - 2026-09-02

### Adicionado

- **Planeamento de inscrições:** a bucket list passa a estar agrupada pelo que falta fazer, e cada prova pode ter a sua inscrição: quando abre, quando fecha, o sorteio, e o prazo para garantir um lugar já ganho. Com aviso antes de cada prazo.
- **A temporada em volta das provas âncora:** marca as provas que fixam o teu ano e a app sugere onde encaixa uma prova de preparação, avisa quando algo cai no afinamento, e mostra o tempo previsto para a âncora.
- **Quando falha:** uma prova que passa sem resultado pergunta o que aconteceu em vez de dizer que faltaste, uma desistência passa a contar como prova começada, e um botão cria a tentativa da próxima temporada.
- **Encontrar provas:** uma página nova procura no catálogo por mês, distância e local, e acrescenta uma prova à lista num clique. Inclui os parkruns perto de ti.
- **Primeiros passos:** o dashboard de uma conta nova abre com quatro passos, cada um a explicar o que a app faz com aquilo. Desaparece quando estiverem feitos.

### Alterado

- **Contas à espera de aprovação:** o login passa a ser recusado com a razão, em vez de deixar entrar numa app onde nada podia ser escrito.
- **Self-hosting:** duas fontes novas para o catálogo, desligadas até as activares. Ver [`docs/discovery-sources.md`](docs/discovery-sources.md).

---

## [1.31.0] - 2026-09-01

### Adicionado

- **Mais distâncias:** 1500 m, 3000 m, 15Km, 10 milhas, 30Km, 50Km, 50 milhas, 100Km e 100 milhas juntam-se às quatro de sempre. As novas chegam desligadas: liga as que corres em Definições, Disciplinas.
- **Catálogo de provas:** a instância passa a conhecer provas por nome, com a forma de inscrição, os prazos e o sorteio de cada edição. É o que vai dar avisos antes de as inscrições fecharem.
- **Área de administração:** aprovar, bloquear e eliminar contas, e manter o catálogo, dentro da app em vez da consola.

### Alterado

- **Escolher disciplinas ficou compacto:** as 13 distâncias passam a pastilhas agrupadas em pista, estrada e ultra.
- **Self-hosting:** o administrador passa a ser um utilizador marcado como tal, em vez de uma variável de ambiente. Ver [`docs/self-hosting.md`](docs/self-hosting.md).

---

## [1.30.0] - 2026-09-01

### Removido

- **Import e export de Excel saíram:** o backup completo em `.zip` cobre o mesmo com mais precisão, incluindo fotos, vídeos, ficheiros de actividade e objectivos, e restaura tudo com os mesmos identificadores. A folha de cálculo deixa de ser caminho de entrada.

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

- **Ficheiros de atividade nos eventos:** carrega o GPX ou TCX do teu relógio e a prova ganha splits por quilómetro, o percurso no mapa, ritmo, altitude e batimentos. O tempo medido é oferecido para preencher o resultado, nunca imposto: a cronometragem oficial é a que conta.

---

## [1.26.1] - 2026-08-30

### Alterado

- **Os documentos seguem a língua da app:** changelog, aviso de resultados e política de privacidade deixaram de ter seletor próprio, e em árabe leem-se da direita para a esquerda.

---

## [1.26.0] - 2026-08-30

### Adicionado

- **Escolhe as disciplinas que queres ver:** em Definições > App podes desligar as distâncias que não corres. Deixam de aparecer nos filtros e nas listas de escolha. Nada se perde do que já tens.

---

## [1.25.0] - 2026-08-30

### Alterado

- **A página de Resultados passou a ser a de Análise:** responde a três perguntas, com um selector no topo: como vai esta época, como está face às anteriores, e o que mudou desde sempre. Os links antigos continuam a funcionar.
- **Curva de forma:** cada prova é convertida para o equivalente na tua distância mais corrida, por isso um 5K e uma maratona passam a comparar-se na mesma linha. Com previsão de tempos para as outras distâncias.
- **Novas leituras:** posição no pelotão ao longo do tempo, progressão de cada recorde, km acumulados contra as épocas anteriores, meses fortes e fracos do ano, e uma grelha de consistência por provas ou por quilómetros.
- **Ritmo médio do ano corrigido:** passa a ser ponderado pela distância. Antes um 5K pesava o mesmo que uma maratona.

---

## [1.24.0] - 2026-08-29

### Alterado

- **O resultado de uma prova edita-se na página do evento:** acabou a página à parte. O tempo, a posição e o link dos resultados oficiais ficam todos no mesmo sítio, ao lado dos números.

---

## [1.23.0] - 2026-08-29

### Alterado

- **O catálogo parkrun actualiza-se sozinho:** as provas parkrun novas passam a aparecer poucos dias depois de abrirem, sem esperar por uma actualização da aplicação.

---

## [1.22.0] - 2026-08-28

### Alterado

- **O resto da app com o visual do Início:** os objetivos agrupam-se por estado, os filtros ficaram iguais em todas as páginas, e a página de um evento passa a ter o nome da prova como título.

---

## [1.21.0] - 2026-08-28

### Alterado

- **Início redesenhado:** o próximo evento em destaque com a contagem decrescente, os números do ano numa faixa única, agora com os quilómetros percorridos, e lugar próprio para conquistas, objetivos por cumprir e recordes pessoais.

---

## [1.20.0] - 2026-08-25

### Adicionado

- **Novo idioma, Árabe (primeira versão):** a app está agora disponível em árabe, com layout da direita para a esquerda. Selecciona-o em Definições → Idioma.

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

- **Estado dos eventos:** um evento com resultado oficial já não pode ficar marcado como «Faltou».

---

## [1.16.0] - 2026-08-03

### Adicionado

- **Backup com fotos e vídeos:** o `.zip` de backup passa a incluir os ficheiros de fotos e vídeos, não só os metadados. Podes desligar a opção antes de exportar; acima de 300 MB o backup fica só com os dados.
- **Restauro de fotos e vídeos:** com os ficheiros no `.zip`, as fotos e vídeos voltam mesmo no modo «substituir tudo» e ao restaurar noutra conta. Antes só eram recuperáveis se ainda estivessem na conta.

---

## [1.15.1] - 2026-08-03

### Corrigido

- **Segurança:** uma conta pendente ou rejeitada já não consegue dar acesso total a si mesma.
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

- **Self-hosting:** podes exigir aprovação manual das contas novas: email ao administrador para aprovar ou rejeitar, e aviso ao utilizador. Opcional. Ver [`docs/self-hosting.md`](docs/self-hosting.md).

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
