---locale:pt---
#### Aviso — importação de resultados oficiais

**Última actualização:** 2026-07-20

#### O que faz esta funcionalidade

O Queima Asfalto pode **procurar tempos e classificações** em sites de timing de terceiros (organizadores, plataformas de resultados, Parkrun, etc.) quando indicas um link público de resultados ou um identificador compatível e pedes uma pesquisa.

Cada pesquisa é **iniciada por ti** e executa pedidos HTTP automatizados a partir da instância (normalmente via Cloud Function `lookupOfficialResults`) para páginas ou APIs **publicamente acessíveis**.

#### Sem afiliação

Não somos afiliados, endossados ou representantes de nenhum organizador de provas nem de fornecedores de timing (incluindo, entre outros, Parkrun, mika:timing, Sporthive, MyRaceResult, EQ Timing, Davengo e plataformas similares). Marcas e nomes de serviços pertencem aos respectivos titulares.

#### Termos de serviço de terceiros

Cada site de timing tem os **seus próprios termos de uso**, políticas de privacidade e regras sobre acesso automatizado, cópia de dados ou uso comercial dos resultados. **Podes ser responsável** por garantir que o teu uso desta funcionalidade cumpre esses termos.

Este aviso **não constitui aconselhamento jurídico**. Em caso de dúvida, consulta o operador da instância ou um profissional qualificado.

#### Limitações

- Os dados importados provêm de fontes externas: **podem estar incompletos, desactualizados ou incorrectos**. Confirma sempre antes de aplicar um resultado.
- Sites podem **alterar formatos**, bloquear acesso ou impor limites sem aviso prévio; a funcionalidade pode deixar de funcionar temporária ou permanentemente.
- A app inclui **limites de frequência** entre pesquisas para reduzir carga nos sites; não substitui o cumprimento dos termos de cada fornecedor.

#### Operadores de instâncias self-hosted

Se fazes deploy da tua própria instância, és responsável pelo uso que os teus utilizadores fazem desta funcionalidade. Recomendações:

- Informa os utilizadores (por exemplo com este aviso ou equivalente na tua política de privacidade).
- Revisa os termos dos sites de timing que os teus utilizadores importam com frequência.
- Ajusta limites em [`docs/cloud-functions-limits.md`](https://github.com/xmajox/queima-asfalto/blob/main/docs/cloud-functions-limits.md) se necessário.
- Considera desactivar ou restringir a funcionalidade se não puderes cumprir os termos aplicáveis.

Documentação completa para operadores: [`docs/timing-scraping-disclaimer.md`](https://github.com/xmajox/queima-asfalto/blob/main/docs/timing-scraping-disclaimer.md).

#### Software

O Queima Asfalto é software open source (AGPL-3.0), fornecido **«tal como está»**. Os autores do código não garantem disponibilidade contínua de conectores nem assumem responsabilidade por violações de termos de terceiros resultantes do uso desta funcionalidade.

---locale:en---
#### Notice — official results import

**Last updated:** 2026-07-20

#### What this feature does

Queima Asfalto can **look up finish times and rankings** on third-party timing websites (race organisers, results platforms, Parkrun, etc.) when you provide a public results link or compatible identifier and request a search.

Each search is **initiated by you** and runs automated HTTP requests from the instance (usually via the `lookupOfficialResults` Cloud Function) against **publicly accessible** pages or APIs.

#### No affiliation

We are not affiliated with, endorsed by, or representatives of any race organiser or timing provider (including, among others, Parkrun, mika:timing, Sporthive, MyRaceResult, EQ Timing, Davengo, and similar platforms). Service names and trademarks belong to their respective owners.

#### Third-party terms of service

Each timing site has its **own terms of use**, privacy policies, and rules on automated access, copying data, or commercial use of results. **You may be responsible** for ensuring your use of this feature complies with those terms.

This notice is **not legal advice**. If in doubt, contact your instance operator or qualified counsel.

#### Limitations

- Imported data comes from external sources: it **may be incomplete, outdated, or incorrect**. Always confirm before applying a result.
- Sites may **change formats**, block access, or impose limits without notice; the feature may stop working temporarily or permanently.
- The app includes **rate limits** between searches to reduce load on sites; this does not replace compliance with each provider’s terms.

#### Self-hosted instance operators

If you deploy your own instance, you are responsible for how your users use this feature. Recommendations:

- Inform users (for example with this notice or equivalent wording in your privacy policy).
- Review the terms of timing sites your users import from frequently.
- Tune limits in [`docs/cloud-functions-limits.md`](https://github.com/xmajox/queima-asfalto/blob/main/docs/cloud-functions-limits.md) if needed.
- Consider disabling or restricting the feature if you cannot meet applicable terms.

Full operator documentation: [`docs/timing-scraping-disclaimer.md`](https://github.com/xmajox/queima-asfalto/blob/main/docs/timing-scraping-disclaimer.md).

#### Software

Queima Asfalto is open-source software (AGPL-3.0), provided **“as is”**. The code authors do not guarantee ongoing availability of connectors and are not liable for third-party terms violations arising from use of this feature.
