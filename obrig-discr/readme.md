# As despesas obrigatórias e discricionárias da União

Seja bem-vinda(o)!

Este repositório contém os dados e códigos utilizados para a produção da página https://tchiluanda.github.io/cronicas-fiscais/obrig-discr/. Todo o trabalho foi desenvolvido com o uso de software livre.

A preparação e análise inicial dos dados foi feita em `R` (o código está disponível na pasta `\R`). A página em si foi programada utilizando apenas os padrões abertos da web, e a visualização foi feita com `D3`, uma biblioteca de javascript que permite manipular páginas web a partir de dados.

Os dados utilizados foram os da série história do Resultado do Tesouro Nacional, disponíveis [nesta página do Tesouro Transparente](http://www.tesourotransparente.gov.br/ckan/dataset/resultado-do-tesouro-nacional). Especificamente, utilizamos os dados da planilha 1.1 &mdash; "Tabela 1.1. Resultado Primário do Governo Central (Valores Correntes)", considerando os valores acumulados nos 12 meses anteriores ao mês de referência.

## Inspirações

### Conteúdo: 

Esta matéria, na Intranet do Tesouro Nacional:

#### Secretário do Tesouro leva os principais números fiscais do Brasil para deputados

__Rosana Mendes Alves Lobo__

*Mansueto Almeida falou sobre despesas obrigatórias, vinculações e orçamento em audiência na Comissão de Finanças e Tributação da Câmara*

O secretário do Tesouro Nacional, Mansueto Almeida, apresentou aos integrantes da Comissão de Finanças e Tributação (CFT) da Câmara dos Deputados um panorama das contas públicas brasileiras nesta quarta-feira (18/09).

Mansueto estava acompanhado do secretário-adjunto, Otavio Ladeira, do subsecretário de Planejamento Estratégico da Política Fiscal, Pedro Jucá, da chefe da Assessoria Econômica, Parlamentar e de Comunicação, Viviane Varga, e da chefe do Núcleo de Assessoramento Econômico, Karina Felix, que passou a fazer parte da equipe nesta semana, após aprovação em processo seletivo. 

Mansueto repassou com os deputados os principais destaques do Resultado do Tesouro Nacional (RTN) de julho, chamando atenção para o tamanho das despesas obrigatórias em relação às discricionárias e para o impacto do déficit da previdência, que chega a R$ 112 bilhões no acumulado de janeiro a julho deste ano e cancela todo o superávit de R$ 76,8 bilhões registrado pelo próprio Tesouro e pelo Banco Central no período. 

“Estamos indo neste ano para o menor nível de despesas discricionárias desde 2009”, disse o secretário. “O que cresce é a despesa obrigatória, cerca de R$ 60 bilhões a cada ano. É essa realidade que precisamos mudar”, afirmou. Mansueto destacou que a reforma da previdência e a reforma administrativa são instrumentos importantes para enfrentar, respectivamente, os gastos com os inativos e com pessoal ativo, que são os principais componentes das despesas obrigatórias da União. 

Como já vem indicando nas últimas entrevistas coletivas de apresentação do RTN, Mansueto citou a possibilidade de o déficit primário neste ano fechar mais próximo dos R$ 120 bilhões do que da meta de R$ 139 bilhões. Ele também falou de cessão onerosa e da repartição de recursos com Estados e municípios, da possibilidade de descontingenciamento diante da recente melhora da receita, do excesso de vinculações do orçamento e do baixo nível de investimento previsto no orçamento do ano que vem.

Participaram da conversa com o secretário os deputados Sergio Souza (MDB-PR), que é o presidente da Comissão, Alê Silva (PSL-MG), Fernando Monteiro (PP-PE), Paulo Ganime (Novo-RJ), Elias Vaz (PSB-GO) e Júlio Cesar (PSD-PI). Os deputados convidaram Mansueto para participar de um debate aberto a ser promovido pela CFT no mês que vem.

*Fonte: ASCOM/STN*

### Forma:

* https://archive.nytimes.com/www.nytimes.com/interactive/2012/05/17/business/dealbook/how-the-facebook-offering-compares.html?_r=0

* http://arnicas.github.io/interactive-vis-course/Week12/stepper_buttons.html

* http://arnicas.github.io/interactive-vis-course/Week12/

* https://vallandingham.me/stepper_steps.html

Transformar num scroller depois?

### Efeitos, D3 etc.

* https://medium.com/@sahilaug/line-graphs-using-d3-animating-the-line-f82a1dfc3c91

* https://bocoup.com/blog/improving-d3-path-animation (match path length prior to interpolation)

* https://github.com/pbeshai/d3-interpolate-path

* https://gist.github.com/mbostock/3916621#file-index-html

### Detalhes de design

* Destaque dos textos: https://lynnandtonic.com/web/
