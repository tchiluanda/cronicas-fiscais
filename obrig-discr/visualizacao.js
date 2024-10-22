const $grafico = d3.select('.grafico-d3');
const $grafico_container = d3.select('.grafico-d3-container');
const $svg     = $grafico.select('.grafico-d3-svg');
const $botao_proximo = d3.select("#botao-proximo");

const PAD = 40;

console.log("Estou aqui.")

// // read data

d3.csv("dados.csv", function(d) {
    return {
        periodo: d3.timeParse("%Y-%m-%d")(d.Periodo),
        tipo_despesa: d.tipo_despesa,
        vlr_var: +d.valor_variacao,
        vlr_dif: +d.valor_diferenca,
        vlr_acu: +d.valor_acumulado,
        vlr_part: +d.participacao,
        vlr_part_ajus: d.tipo_despesa == "obrigatoria" ? 100.0 : +d.participacao
    }
}).then(function(dados) {

    // define uma variável geral para controlar os passos
    let step_atual = 0;

    // testes para entender a estrutura dos dados

    //console.log(dados);
    //console.log(Object.keys(dados[1]));
    //console.table(dados);
    //console.table(dados[1]);
    //console.log(dados[1].Periodo);
    //console.log(d3.extent(dados, d => d.Periodo));

    // constantes gerais dos dados
    const PERIODO = d3.extent(dados, d => d.periodo);
    const AMPLITUDE_VLR_ABSOLUTO = [0, d3.max(dados, d => d.vlr_acu)];
    const AMPLITUDE_VLR_VARIACAO = d3.extent(dados, d => d.vlr_var);
    const min_dif      = d3.min(dados, d => d.vlr_dif);
    const max_dif      = d3.max(dados, d => d.vlr_dif);

    // maior valor de diferença, seja negativo ou positivo:
    const max_dif_abs  = d3.max(dados, d => Math.abs(d.vlr_dif));


    // // captura a largura do container do gráfico
    // // que vai determinar a largura do svg

    const w = $grafico_container.node().offsetWidth;
    console.log("Largura do container: ", w);

    const h = 400;

    const LAST_DATE = d3.max(dados, d => d.periodo);
    const FRST_DATE = d3.min(dados, d => d.periodo);

    console.log("Última data: ", LAST_DATE);
    console.log("Amplitude período: ",         PERIODO);
    console.log("Amplitude valor absoluto: ",  AMPLITUDE_VLR_ABSOLUTO);
    console.log("Amplitude valor relativo: ",  AMPLITUDE_VLR_VARIACAO);
    console.log("amplitude diferenças", min_dif, max_dif, "Máxima diferença", max_dif_abs);

    const scale_X_PERIODO = d3
        .scaleTime()
        .domain(PERIODO)
        .range([PAD, w - PAD])

    const scale_DIFERENCA = d3
        .scaleSqrt()
        .range([0, 35])
        .domain([0, max_dif_abs]);

    const scale_ABSOLUTO = d3
        .scaleLinear()
        .range([h - PAD, PAD])
        .domain(AMPLITUDE_VLR_ABSOLUTO);

    const scale_ABSOLUTO_height = d3
        .scaleLinear()
        .range([0, h - PAD - PAD])
        .domain(AMPLITUDE_VLR_ABSOLUTO);

    const scale_VARIACAO = d3
        .scaleLinear()
        .range([h - PAD, PAD])
        .domain(AMPLITUDE_VLR_VARIACAO);

    const scale_PARTICIP = d3
        .scaleLinear()
        .range([h - PAD, PAD])
        .domain([0, 100]);

    const scale_COLOR = d3
        .scaleOrdinal()
        .range(["#FFE93B", "#ff2190"])
        .domain(["discricionaria", "obrigatoria"]);

    const scale_COLOR_text = d3
        .scaleOrdinal()
        .range(["#B3A017", "#B30C5F"])
        .domain(["discricionaria", "obrigatoria"]);

    const scale_COLOR_dif = d3.scaleLinear()
        .domain([true, false])
        .range(["#2c7bb6", "#d7191c"]);
         
    const eixo_y_abs = d3.axisLeft()
        .scale(scale_ABSOLUTO)
        .tickFormat(d => formataBR(d/1e3));

    const eixo_y_part = d3.axisLeft()
        .scale(scale_PARTICIP)
        .tickFormat(function(d) {return formataBR(d)+"%"});                                  

    const eixo_y_var = d3.axisLeft()
        .scale(scale_VARIACAO)
        .tickFormat(function(d) {return formataBR((d-1)*100)+"%"});                  

    let eixo_x_data = d3.axisBottom()
        .scale(scale_X_PERIODO)

    const line_acum = d3.line()
        .x(d => scale_X_PERIODO(d.periodo))
        .y(d => scale_ABSOLUTO(d.vlr_acu));

    // // se a largura não for suficiente,
    // // usa apenas os anos nos ticks

    if (w < 520)
        eixo_x_data = eixo_x_data.tickFormat(d => formataData_Anos(d));
    else
        eixo_x_data = eixo_x_data.tickFormat(d => formataData(d));
    
    console.log("Teste escala absoluta: ", 
                dados[1].vlr_acu,
                "corresponde a: ",
                scale_ABSOLUTO(dados[1].vlr_acu),
                "pixels.");

    // //subsets dos dados
    const dados_inici = dados.filter(d => d.periodo <= FRST_DATE);
    const dados_final = dados.filter(d => d.periodo >= LAST_DATE);
    const dados_obrig = dados.filter(d => d.tipo_despesa == "obrigatoria");
    const dados_discr = dados.filter(d => d.tipo_despesa == "discricionaria");
    const dados_extremos = dados.filter(d => d.periodo >= LAST_DATE |
        d.periodo <= FRST_DATE);
    const dados_dif = dados.filter(d => !isNaN(d.vlr_dif));

    console.log("Teste escalas difs");
    console.table(dados_dif.map(d => [d.vlr_dif, scale_DIFERENCA(Math.abs(d.vlr_dif)), scale_COLOR_dif(d.vlr_dif<0)]));

    //console.log("Dados extremos:")
    //console.table(dados_extremos);
    console.log("Dados diferença: ");
    console.table(dados_dif);

    

    // // grab svg reference
    const $SVG = d3.select(".grafico-d3-svg")
                   .attr("width", w)
                   .attr("height", h);

    // // // funcoes 

    // // formatação valores
    
    let localeBrasil = {
        "decimal": ",",
        "thousands": ".",
        "grouping": [3],
        "currency": ["R$", ""]};
    
    let formataBR = d3.formatDefaultLocale(localeBrasil).format(",.0f");
    let formataBR_1casa = d3.formatDefaultLocale(localeBrasil).format(",.1f");
    let formataData = d3.timeFormat("%b %Y");
    let formataData_Anos = d3.timeFormat("%Y");

    const primeira_data = formataData(PERIODO[0]);

    const ultima_data = formataData(PERIODO[1])

    console.log("Periodo formatado:", primeira_data, ultima_data);

    const switch_step = function(step) {
        d3.selectAll(".steps li").classed("active", false);
        d3.select("#step-" + step).classed("active", true);

        // troca texto da caixa
        d3.selectAll(".textos-steps").classed("oculto", true);       
        d3.select("#texto-step-" + step).classed("oculto", false);
    }
    
    /*const botao_inativo = function() {
        d3.select("#botao-proximo").classed("proximo-inativo", true);
    }*/

    const botao_ativo = function(espera) {
        d3.select("#botao-proximo").classed("proximo-inativo", false);
        d3.select("#botao-proximo").style("color", "slategray").style("font-weight", "normal").style("cursor", "auto").style("pointer-events", "none");
        d3.select("#botao-proximo").transition().delay(espera).style("color", "#E32C10").style("font-weight", "bold").style("cursor", "pointer").style("pointer-events", "auto");
    }
    
    // // // Step 1 - Barras iniciais
    const render_step1 = function() {

        botao_ativo(3100);

        console.log("Dados final:")
        console.table(dados_final);
        console.log("valor / y / height", dados_final[0].vlr_acu, 
        scale_ABSOLUTO(dados_final[0].vlr_acu), scale_ABSOLUTO_height(dados_final[0].vlr_acu));
        console.log("valor / y / height", dados_final[1].vlr_acu, 
        scale_ABSOLUTO(dados_final[1].vlr_acu), scale_ABSOLUTO_height(dados_final[1].vlr_acu));



        const layer_step1 = $SVG.selectAll("rect")
                                .data(dados_inici, d => d.periodo + d.tipo_despesa)
                                .enter()
                                .append("rect")
                                .attr("class", "layer-step1 barras-iniciais")
                                .attr("y", scale_ABSOLUTO(0))
                                .attr("x", function(d) {
                                    if (d.tipo_despesa == "obrigatoria") return(w*1/4 + 15)
                                    else return(w*1/4 - 15)})
                                .attr("width", 15)
                                .attr("height", 0)
                                .attr("fill", d => scale_COLOR(d.tipo_despesa))
                                .transition()
                                .duration(2000)
                                .attr("y", d => scale_ABSOLUTO(d.vlr_acu))
                                .attr("height", d => scale_ABSOLUTO_height(d.vlr_acu));

        // textos
        
        const texto_step1 = $SVG.selectAll("text.labels-valores")
                                .data(dados_inici, d => d.periodo + d.tipo_despesa)
                                .enter()
                                .append("text")
                                .attr("class", "text-label label-valores")
                                .attr("text-anchor", "middle")
                                .attr("fill", d => scale_COLOR_text(d.tipo_despesa))
                                .text(d => formataBR(d.vlr_acu/1e3) + " bi")
                                .attr("y", d => scale_ABSOLUTO(d.vlr_acu) - 10)
                                .attr("x", function(d) {
                                    if (d.tipo_despesa == "obrigatoria") return(w*1/4 + 15 + 7.5)
                                    else return(w*1/4 - 15 + 7.5)})
                                .attr("opacity", 0)
                                .transition()
                                .delay(2000)
                                .duration(1000)
                                .attr("opacity", 1);

        const texto_eixo_step1 = $SVG
                                     .append("text")
                                     .attr("class", "text-label label-inicial")
                                     .attr("text-anchor", "middle")
                                     .attr("y", scale_ABSOLUTO(0) + 25)
                                     .attr("x", w*1/4 + 7.5)
                                     .text(primeira_data);



    }

    // // // Step 2 - Barras fim série
    const render_step2 = function() {

        
        botao_ativo(3100);

        const layer_step2 = $SVG.selectAll("rect")
                                .data(dados_extremos, d => d.periodo + d.tipo_despesa)
                                .enter()
                                .append("rect")
                                .attr("class", "layer-step2 barras-finais")
                                .attr("y", scale_ABSOLUTO(0))
                                .attr("x", function(d) {
                                    if (d.tipo_despesa == "obrigatoria") return(w*3/4 + 15)
                                    else return(w*3/4 - 15)})
                                .attr("width", 15)
                                .attr("height", 0)
                                .attr("fill", d => scale_COLOR(d.tipo_despesa))
                                .transition()
                                .duration(2000)
                                .attr("y", d => scale_ABSOLUTO(d.vlr_acu))
                                .attr("height", d => scale_ABSOLUTO_height(d.vlr_acu));

        // textos
        
        const texto_step2 = $SVG.selectAll("text.label-valores")
                                .data(dados_extremos, d => d.periodo + d.tipo_despesa)
                                .enter()
                                .append("text")
                                .attr("class", "text-label label-valores")
                                .attr("text-anchor", "middle")
                                .attr("fill", d => scale_COLOR_text(d.tipo_despesa))
                                .text(d => formataBR(d.vlr_acu/1e3) + " bi")
                                .attr("y", d => scale_ABSOLUTO(d.vlr_acu) - 10)
                                .attr("x", function(d) {
                                    if (d.tipo_despesa == "obrigatoria") return(w*3/4 + 15 + 7.5)
                                    else return(w*3/4 - 15 + 7.5)})
                                .attr("opacity", 0)
                                .transition()
                                .delay(2000)
                                .duration(1000)
                                .attr("opacity", 1);

        const texto_eixo_step2 = $SVG
                                     .append("text")
                                     .attr("class", "text-label label-inicial")
                                     .attr("text-anchor", "middle")
                                     .attr("y", scale_ABSOLUTO(0) + 25)
                                     .attr("x", w*3/4 + 7.5)
                                     .text(ultima_data);


    };

    // // // Step 3, 4 novo - Calcula diferenças iniciais

    const render_step3_4 = function(inicial_ou_final) {

       // controle do botão lá embaixo

        console.log(inicial_ou_final, inicial_ou_final == "inicial");

        const iniciais = d3.selectAll("rect.barras-iniciais").nodes().map(d => d.getAttribute("height"));
        const finais   = d3.selectAll("rect.barras-finais").nodes().map(d => d.getAttribute("height"));

        const height_inicial = iniciais[0];
        const height_final   = finais[0];

        const razao_iniciais = iniciais[1] / iniciais[0];
        const razao_finais   = finais[1]   / finais[0];

        const y_iniciais = d3.selectAll("rect.barras-iniciais").nodes().map(d => d.getAttribute("y"));
        const y_finais = d3.selectAll("rect.barras-finais").nodes().map(d => d.getAttribute("y"));

        const y_inicial = y_iniciais[0];
        const y_final   = y_finais[0];

        if (inicial_ou_final == "inicial") {
            console.log("Aqui!");
            var altura = height_inicial;
            var razao = razao_iniciais;
            var y_0s = y_iniciais;
            var y_0 = y_inicial;
            var x0 = w*1/4 - 16;
            var xend = w*1/4 + 16
            var x_comentario = w*1/4 + 40;
            var alinhamento = "left";
            var layer = "layer3";
            console.log("dentro if", inicial_ou_final, altura, y_0);
        } else {
            var altura = height_final;
            var razao = razao_finais;
            var y_0s = y_finais;
            var y_0 = y_final;
            var x0 = w*3/4 - 16;
            var xend = w*3/4 + 16;
            var x_comentario = w >= 520 ? w*3/4 + 40 : w*3/4 - 85;
            var alinhamento = w >= 520 ? "left" : "right";
            var layer = "layer4";

            // note que o comentário começa em w*3/4+40, com 90 de
            // largura. Então w*3/4 + 40 + 90 tem que ser menor que
            // "w". Ou seja, w teria que ser pelo menos 520, para a
            // caixa de comentário não ficar fora da área.
            // por isso a lógica. se w for menor que 520, então o 
            // comentário vai ficar `a esquerda.
            // vou ter que mudar o alinhamer

        }

        console.log("fora if", inicial_ou_final, altura, y_0);

        //const y_inicial = d3.selectAll("rect.barras-iniciais").nodes()[0].getAttribute("y");
        //const y_final   = d3.selectAll("rect.barras-finais").nodes()[0].getAttribute("y");

        //console.log("Razoes: ", razao_iniciais, razao_finais);
        //console.log("Y's: ", y_inicial, y_final);

        //  mostra primeiro medidor, inicial

        const $medidor = $SVG.append("rect")
            .attr("class", "medidor "+layer)
            .attr("y", y_0)
            .attr("x", x0 + 1)
            .attr("width", 13) // um pouquinho mais estreito
            .attr("height", altura-1)
            .attr("fill", scale_COLOR("discricionaria"))
            .attr("stroke-width", 1)
            .attr("stroke", scale_COLOR("obrigatoria"))
            .transition()
            .duration(500)
            .attr("x", xend);

        // cria os próximos retangulos/medidores

        let vetor_posicoes = Array(Math.floor(razao)-1).fill(1);
        vetor_posicoes = vetor_posicoes.map((x,index) => y_0 - altura*(index+1));
        vetor_posicoes.push(y_0 - altura*(razao-1));

        let vetor_alturas = Array(Math.floor(razao)-1).fill(+altura);
        vetor_alturas.push((razao % 1)*altura);

        // popula objeto para fazer o join

        let dataset_temporario = []
        for (let i = 0; i < vetor_posicoes.length; i++) {
            dataset_temporario.push(
                {"posicoes": vetor_posicoes[i],
                 "alturas": vetor_alturas[i]}
            )
        }

        /*

        // popula objeto para animar valores
        let vetor_valores = []
        for (let i = 0; i <= parseInt(razao); i++) {
            let next = 0;
            if (i == parseInt(razao)) next = razao
            else next = i + 1
            vetor_valores.push(next);
        }     
        console.log("Vetor valores", vetor_valores);*/
            
        console.log("Posicoes e alturas", dataset_temporario);

        $SVG.selectAll("rect.medidores-adicionais")
            .data(dataset_temporario)
            .enter()
            .append("rect")
            .attr("opacity", 0)
            .attr("class", "medidor "+layer)
            .attr("y", d => d.posicoes)
            .attr("x", xend)
            .attr("width", 13) // um pouquinho mais estreito
            .attr("height", d => d.alturas-1)
            .attr("fill", scale_COLOR("discricionaria"))
            .attr("stroke-width", 1)
            .attr("stroke", scale_COLOR("obrigatoria"))
            .transition()
            .delay((d,i) => 1000 + i*500)
            .attr("opacity", 1);

        // incluir texto

        d3.select("#annotation-" + inicial_ou_final + " p.valor")
            .attr("class", "valor "+layer)
            .text(formataBR_1casa(razao)+"x");

        d3.select("div.comentarios > #annotation-" + inicial_ou_final)
            .style("left", x_comentario + "px")
            .style("text-align", alinhamento)
            .style("top", y_0s[1] + "px")
            .classed("invisivel", false)
            .style("opacity", 0)
            .transition()
            .delay(1000 + dataset_temporario.length * 500)
            .duration(500)
            .style("opacity", 1);
        
        // remove medidores antes do próximo passo

        d3.selectAll("rect.medidor")
          .transition()
          .delay(3000 + dataset_temporario.length * 500)
          .duration(500)
          .attr("opacity", 0)
          .remove();

        
        botao_ativo(3000 + dataset_temporario.length * 500);

    };

    // // // Step 5 - Transformação em círculos e linhas
    const render_step5 = function() {

        botao_ativo(6100);

        // remove texto

        $SVG.selectAll("text").transition().duration(1000).attr("opacity", 0).remove();
        
        d3.selectAll("div.annotation").attr("opacity", 1).transition().duration(500).attr("opacity", 0).remove();

        // transforma barras em círculos, e remove

        const height_final = 16;
        const width_final  = 16;

        // // transforma rects

        const layer_step3 = $SVG.selectAll("rect")
                                .attr("class", "layer-step3-pontos")
                                .transition()
                                .duration(1000)
                                .attr("y", function() {return (this.getAttribute("y") - height_final/2)})
                                .attr("height", height_final)
                                .attr("width", width_final)
                                .transition()
                                .delay(500)
                                .duration(1000)
                                .attr("x", d => scale_X_PERIODO(d.periodo)-width_final/2)                            
                                .attr("rx", 100)
                                .attr("ry", 100);
       
        // create line

        // função line_acum definida lá em cima
        
        const v_linha_obrig = $SVG.append("path")
                    .datum(dados_obrig)
                    .attr("class", "line line-obrig layer-step3")
                    .attr("d", line_acum)
                    .attr('stroke', scale_COLOR("obrigatoria"))
                    .attr('stroke-width', 3)
                    .attr('fill', 'none');

        let comprimento_linha_obrig = v_linha_obrig.node().getTotalLength();
        console.log("Comprimento linha obrig:", comprimento_linha_obrig);

        v_linha_obrig
            .attr("stroke-dasharray", comprimento_linha_obrig + " " + comprimento_linha_obrig)
            .attr("stroke-dashoffset", comprimento_linha_obrig)
            .transition()
            .delay(3000)
            .duration(2000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        const v_linha_discr = $SVG.append("path")
                    .datum(dados_discr)
                    .attr("class", "line line-discr layer-step3")
                    .attr("d", line_acum)
                    .attr('stroke', scale_COLOR("discricionaria"))
                    .attr('stroke-width', 3)
                    .attr('fill', 'none');

        let comprimento_linha_discr = v_linha_discr.node().getTotalLength();
        console.log("Comprimento linha discr:", comprimento_linha_discr);

        v_linha_discr
            .attr("stroke-dasharray", comprimento_linha_discr + " " + comprimento_linha_obrig)
            .attr("stroke-dashoffset", comprimento_linha_discr)
            .transition()
            .delay(4000)
            .duration(2000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        // inclui eixo

        $SVG.append("g") 
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + (h-PAD) + ")")
            .attr("opacity", 0)
            .call(eixo_x_data)
            .transition()
            .delay(4000)
            .duration(2000)
            .attr("opacity", 1);

        $SVG.append("g") 
            .attr("class", "axis y-axis")
            .attr("transform", "translate(" + PAD + ",0)")
            .attr("opacity", 0)
            .call(eixo_y_abs)
            .transition()
            .delay(4000)
            .duration(2000)
            .attr("opacity", 1);

        $SVG.append("text")
            .attr("class", "titulo-eixo")
            .attr("opacity", 0)
            .attr("y", PAD - 10)
            .attr("x", 30)
            .attr("text-anchor", "middle")
            .text("R$ mi")
            .transition()
            .delay(4000)
            .duration(2000)
            .attr("opacity", 1);
        
    }

    // step 6 - área participação

    const render_step6 = function() {

        botao_ativo(4000);

        // remove os pontos / rects
        $SVG.selectAll("rect.layer-step3-pontos")
            .transition()
            .duration(1000)
            .attr('width', 0)
            .attr('height', 0)
            .remove();

        // função da area participação
        const area_participacao = d3.area()
            .x(d => scale_X_PERIODO(d.periodo))
            .y1(d => scale_PARTICIP(d.vlr_part_ajus))
            .y0(scale_PARTICIP(0));

        //pega a cor de fundo
        const cor_de_fundo = d3.select("body").style("background-color");

        $SVG.selectAll("path.line")
            .attr('stroke-dasharray', null)
            .attr('stroke-dashoffset', null)
            .attr('fill', cor_de_fundo)
            .attr("stroke-width", 3)
            .transition()
            .duration(500)
            .attr("stroke-width", 0.5)
            .transition()
            .delay(500)
            .duration(2000)
            .attr("fill", function() { return this.getAttribute("stroke");})
            .attr("d", area_participacao);

       $SVG.select("g.y-axis")
            .transition()
            .delay(500)
            .duration(3000)
            .call(eixo_y_part);

       $SVG.select("text.titulo-eixo")
           .transition()
           .delay(1000)
           .duration(2000)
           .attr("opacity", 0)

       // título gráfico

       $SVG.append("text")
           .attr("class", "titulo-eixo titulo-eixo-part")
           .attr("opacity", 0)
           .attr("y", PAD - 25)
           .attr("x", 30)
           .attr("text-anchor", "middle")
           .text("Percentual")
           .append("tspan")
           .text("do total")
           .attr("x", 30)
           .attr("dy", "1em");

       $SVG.select("text.titulo-eixo-part")
           .transition()
           .delay(2000)
           .duration(1000)
           .attr("opacity", 1);
        
    }

    // volta ao normal

    const render_step7 = function() {

        botao_ativo(2000);

        $SVG.selectAll("path.line")
            .transition()
            .duration(2000)
            .attr("fill", "none")
            .attr("stroke-width", 3)
            .attr("d", line_acum);

            
        $SVG.select("g.y-axis")
            .transition()
            .duration(2000)
            .call(eixo_y_abs);

        $SVG.select("text.titulo-eixo-part")
            .transition()
            .duration(1000)
            .attr("opacity", 0)
            .remove()

        // título gráfico

        $SVG.append("text")
            .attr("class", "titulo-eixo")
            .attr("opacity", 0)
            .attr("y", PAD - 20)
            .attr("x", 30)
            .attr("text-anchor", "middle")
            .text("R$ mi")
            .transition()
            .delay(1000)
            .duration(1000)
            .attr("opacity", 1);
    
    }

    // // // Step 8 - Valores relativos
    const render_step8 = function() {

        botao_ativo(3100);
        
        // remove os pontos / rects
        $SVG.selectAll("rect.layer-step3-pontos")
            .transition()
            .duration(1000)
            .attr('width', 0)
            .attr('height', 0)
            .remove();

        // função da linha relativa
        const line_relativa = d3.line()
            .x(d => scale_X_PERIODO(d.periodo))
            .y(d => scale_VARIACAO(d.vlr_var));

        // olha que coisa bonita: não preciso selecionar 
        // as linhas individualmente, posso selecionar ambas
        // e simplesmente pedir para aplicar uma nova função
        // geradora do "d", já que cada linha traz embutida em
        // si o "data" correto, graças ao data join no passo anterior.

        $SVG.selectAll("path.line")
             .attr('stroke-dasharray', null)
             .attr('stroke-dashoffset', null)
             .transition()
             .delay(1000)
             .duration(2000)
             .attr("d", line_relativa);

        $SVG.select("g.y-axis")
             .transition()
             .delay(0000)
             .duration(3000)
             .call(eixo_y_var);

        $SVG.selectAll("text.titulo-eixo")
            .transition()
            .delay(1000)
            .duration(2000)
            .attr("opacity", 0)
            .remove()

        $SVG.selectAll("circle")
            .data(dados_final)
            .enter()
            .append("circle")
            .attr("opacity", 0)
            .attr('r', 0)
            .attr("cx", d => scale_X_PERIODO(d.periodo))
            .attr("cy", d => scale_VARIACAO(d.vlr_var))
            .attr("fill", d => scale_COLOR(d.tipo_despesa))
            .transition()
            .delay(1000)
            .duration(2000)
            .attr("r", 5)
            .attr("opacity", 1);

        $SVG.selectAll("text.labels-valores-linha")
            .data(dados_final)
            .enter()
            .append("text")
            .attr("class", "label-valores-linha")
            .attr("text-anchor", "left")
            .attr("alignment-baseline", "central")
            .attr("fill", d => scale_COLOR_text(d.tipo_despesa))
            .text(d => (d.vlr_var-1>0 ? "+" : "") + formataBR((d.vlr_var-1)*100) + "%")
            .attr("y", d => scale_VARIACAO(d.vlr_var))
            .attr("x", d => scale_X_PERIODO(d.periodo) + 5)
            .attr("opacity", 0)
            .transition()
            .delay(2000)
            .duration(1000)
            .attr("opacity", 1);

        // título gráfico

        $SVG.append("text")
            .attr("class", "titulo-eixo-var")
            .attr("opacity", 0)
            .attr("y", PAD - 20)
            .attr("x", 30)
            .attr("text-anchor", "middle")
            .text("Variação")
            .append("tspan")
            .text("acumulada")
            .attr("x", 30)
            .attr("dy", "1em");

        $SVG.select("text.titulo-eixo-var")
            .transition()
            .delay(2000)
            .duration(1000)
            .attr("opacity", 1);
      }

    // // // Step 9 - Valores mensais

    const render_step9 = function() {

        botao_ativo(500+dados_dif.length*500+1000+1000);

        const circulos_step9 = $SVG.selectAll("circle.step9")
            .data(dados_dif)
            .enter()
            .append("circle")
            .classed("step9", true)
            .attr("cx", d => scale_X_PERIODO(d.periodo))
            .attr("cy", d => scale_VARIACAO(d.vlr_var))
            .attr("r", 0)
            .attr("fill", d => scale_COLOR(d.tipo_despesa))
            .transition()
            .duration(500)
            .attr("r", 5)

        circulos_step9
            .transition()
            .delay((d,i) => 500 + i*500)
            .duration(1000)
            .attr("r", d => scale_DIFERENCA(Math.abs(d.vlr_dif)))
            .attr("fill", d => scale_COLOR_dif(d.vlr_dif<0));
        
        // textos

        $SVG.selectAll("text.step9")
        .data(dados_dif)
        .enter()
        .append("text")
        .attr("opacity", "0")
        .classed("step9", true)
        .classed("texto-circulos-step9", true)
        .attr("y", d => scale_VARIACAO(d.vlr_var))
        .attr("x", d => scale_X_PERIODO(d.periodo))
        .attr("text-anchor", "middle")
        .text(d => (d.vlr_dif>0 ? "+" : "") + formataBR(d.vlr_dif/1000))
        .attr("fill", "#FCFBFA")
        .transition()
        .delay((d,i) => 500 + i*500)
        .duration(1000)
        .attr("opacity", 1);



        

    }
    // inicio fluxo
    
    // let layer_step1 = render_step1();

    d3.selectAll("#botao-proximo")
      .on("click", function(){
        console.log("Estou no listener dos steps. O this é", this);

        const step_anterior = step_atual;

        console.log("Step atual:", step_anterior);
         
         //let step_clicado = d3.select(this).attr("id").substr(5,4);
         // se o usuário clicar no número, essa substr não vai ter 4 
         // caracteres, mas um só, o próprio número.

         /*

         if (step_clicado == "next") {
             if (step_atual != 7) step_atual += 1;                  
         } else if (step_clicado == "prev") {
             if (step_atual != 1) step_atual -= 1;
         } else step_atual = +step_clicado; // esse caso vai ser o em que
                                           // o objeto clicado é um step
                                           // propriamente dito
        */
        step_atual += 1;
          
        switch_step(step_atual);

        switch (""+step_atual) {
        case "1":
            d3.select("#botao-proximo #parte-texto").text("Próximo")
            render_step1();
            break;              
        case "2":
            render_step2();
            break;
        case "3":
            render_step3_4("inicial");
            break;
        case "4":
            render_step3_4("final");
            break;
        case "5":
            render_step5();
            break;
        case "6":
            render_step6();
            break;   
        case "7":
            render_step7();
            break;   
        case "8":
            render_step8();
            break;    
        case "9":
            d3.select("#botao-proximo #parte-texto").text("Reiniciar")
            d3.select("#botao-proximo #parte-simbolo").text("↺")
            render_step9();
            break; 
        case "10":
            $SVG.selectAll("*").remove();
            d3.select("#botao-proximo #parte-texto").text("Próximo");
            d3.select("#botao-proximo #parte-simbolo").text("»")
            step_atual = 1; 
            switch_step(step_atual);
            render_step1();
            break;
        }
        
        console.log("Step atual:", step_atual);

      })

    console.log("Step atual:", step_atual);
 

    
})

/*

// Define uma função que vai recalcular a largura disponível para o gráfico conforme o tamanho do div de container.

function resize() {

    console.log('estou em resize'); // só para mostrar que está funcionando.

    // captura largura do div que envolve o svg
    const w = $grafico_container.node().offsetWidth;

    // agora chama o render toda vez que mudar o tamanho, passando a largura:
    render(w);

}

// Define a função que vai fazer o desenho propriamente dito

function render(w) {

} */