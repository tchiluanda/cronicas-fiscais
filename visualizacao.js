const $grafico = d3.select('.grafico-d3');
const $grafico_container = d3.select('.grafico-d3-container');
const $svg     = $grafico.select('.grafico-d3-svg');

const PAD = 40;

console.log("Estou aqui.")

d3.csv("dados.csv", function(d) {
    return {
        periodo: d3.timeParse("%Y-%m-%d")(d.Periodo),
        tipo_despesa: d.tipo_despesa,
        vlr_var: +d.valor_variacao,
        vlr_dif: +d.valor_diferenca,
        vlr_acu: +d.valor_acumulado
    }
}).then(function(dados) {

    // define uma variável geral para controlar os passos
    let step_atual = 1;

    // testes para entender a estrutura dos dados

    //console.log(dados);
    console.log(Object.keys(dados[1]));
    console.table(dados);
    //console.table(dados[1]);
    //console.log(dados[1].Periodo);
    //console.log(d3.extent(dados, d => d.Periodo));

    // constantes gerais dos dados
    const PERIODO = d3.extent(dados, d => d.periodo);
    const AMPLITUDE_VLR_ABSOLUTO = [0, d3.max(dados, d => d.vlr_acu)];
    const AMPLITUDE_VLR_VARIACAO = d3.extent(dados, d => d.vlr_var);
    const AMPLITUDE_VLR_DIF      = d3.extent(dados, d => d.vlr_dif);

    const w = $grafico_container.node().offsetWidth;
    console.log("Largura do container: ", w);

    const h = 400;

    const LAST_DATE = d3.max(dados, d => d.periodo);
    const FRST_DATE = d3.min(dados, d => d.periodo);

    console.log("Última data: ", LAST_DATE);

    console.log("Amplitude período: ",         PERIODO);
    console.log("Amplitude valor absoluto: ",  AMPLITUDE_VLR_ABSOLUTO);
    console.log("Amplitude valor relativo: ",  AMPLITUDE_VLR_VARIACAO);
    console.log("Amplitude valor diferença: ", AMPLITUDE_VLR_DIF);

    const scale_X_PERIODO = d3
        .scaleTime()
        .domain(PERIODO)
        .range([PAD, w - PAD])

    const scale_DIFERENCA = d3
        .scalePow()
        .exponent(0.5)
        .range([0, 80])
        .domain(AMPLITUDE_VLR_DIF);

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

    const scale_COLOR = d3
        .scaleOrdinal()
        .range(["#FFE93B", "#ff2190"])
        .domain(["discricionaria", "obrigatoria"]);

    const scale_COLOR_text = d3
        .scaleOrdinal()
        .range(["#B3A017", "#B30C5F"])
        .domain(["discricionaria", "obrigatoria"]);
         
    const eixo_y_abs = d3.axisLeft()
                .scale(scale_ABSOLUTO)
                .tickFormat(function(d) {return formataBR(d/1e3)});

    const eixo_x_data = d3.axisBottom()
                .scale(scale_X_PERIODO)
                .tickFormat(d => formataData(d));
    
    console.log("Teste escala absoluta: ", 
                dados[1].vlr_acu,
                "corresponde a: ",
                scale_ABSOLUTO(dados[1].vlr_acu),
                "pixels.");

    // subsets dos dados
    const dados_inici = dados.filter(d => d.periodo <= FRST_DATE);
    const dados_final = dados.filter(d => d.periodo >= LAST_DATE);
    const dados_obrig = dados.filter(d => d.tipo_despesa == "obrigatoria");
    const dados_discr = dados.filter(d => d.tipo_despesa == "discricionaria");
    const dados_extremos = dados.filter(d => d.periodo >= LAST_DATE |
        d.periodo <= FRST_DATE);

    console.log("Dados extremos:")
    console.table(dados_extremos);

    // grab svg reference
    const $SVG = d3.select(".grafico-d3-svg")
                   .attr("width", w)
                   .attr("height", h);

    // // funcoes 

    // formatação valores
    
    let localeBrasil = {
        "decimal": ",",
        "thousands": ".",
        "grouping": [3],
        "currency": ["R$", ""]};
    
    let formataBR = d3.formatDefaultLocale(localeBrasil).format(",.0f");
    let formataBR_1casa = d3.formatDefaultLocale(localeBrasil).format(",.1f");
    let formataData = d3.timeFormat("%b %Y");

    console.log("Periodo formatado:", formataData(PERIODO[0]));

    function pathTween(d1, precision) {
        return function() {
          var path0 = this,
              path1 = path0.cloneNode(),
              n0 = path0.getTotalLength(),
              n1 = (path1.setAttribute("d", d1), path1).getTotalLength();
          // Uniform sampling of distance based on specified precision.
          var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
          while ((i += dt) < 1) distances.push(i);
          distances.push(1);
          // Compute point-interpolators at each distance.
          var points = distances.map(function(t) {
            var p0 = path0.getPointAtLength(t * n0),
                p1 = path1.getPointAtLength(t * n1);
            return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
          });
          return function(t) {
            return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : d1;
          };
        };
      }

    const switch_step = function(step) {
        d3.selectAll(".steps li").classed("active", false);
        d3.select("#step-" + step).classed("active", true);
    }
    
    // // // Step 1 - Barras iniciais
    const render_step1 = function() {

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
                                     .text("Dez 2010");



    }

    // // // Step 2 - Barras fim série
    const render_step2 = function() {

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
                                     .text("Jul 2019");


    };

    // // // Step 3, 4 novo - Calcula diferenças iniciais

    const render_step3_4 = function(inicial_ou_final) {

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
            var layer = "layer3";
            console.log("dentro if", inicial_ou_final, altura, y_0);
        } else {
            var altura = height_final;
            var razao = razao_finais;
            var y_0s = y_finais;
            var y_0 = y_final;
            var x0 = w*3/4 - 16;
            var xend = w*3/4 + 16
            var x_comentario = w*3/4 + 40;
            var layer = "layer4";
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
+
        // incluir texto

        d3.select("#annotation-" + inicial_ou_final + " p.valor")
            .attr("class", "valor "+layer)
            .text(formataBR_1casa(razao)+"x");

        d3.select("div.comentarios > #annotation-" + inicial_ou_final)
            .style("left", x_comentario + "px")
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

    };

    // // // Step 5 - Transformação em círculos
    const render_step5 = function() {

        // remove texto

        $SVG.selectAll("text").transition().duration(1000).attr("opacity", 0).remove();
        
        d3.selectAll("div.annotation").attr("opacity", 1).transition().duration(500).attr("opacity", 0).remove();

        // transforma barras em círculos, e remove

        const height_final = 16;
        const width_final  = 16;

        const layer_step3 = $SVG.selectAll("rect")
                                .attr("class", "layer-step3-pontos")
                                .transition()
                                .duration(1000)
                                .attr("y", function() {return (this.getAttribute("y") - height_final/2)})
                                .attr("height", height_final)
                                .attr("width", width_final)
                                .transition()
                                .delay(1000)
                                .duration(1000)
                                .attr("x", d => scale_X_PERIODO(d.periodo)-width_final/2)                            
                                .attr("rx", 100)
                                .attr("ry", 100);

        //  entram círculos

        /*

        $SVG.selectAll("circle")
                .data(dados_extremos)
                .enter()
                .append("circle")
                .attr("opacity", 0)
                .attr("cx", d => scale_X_PERIODO(d.periodo))
                .attr("cy", d => scale_ABSOLUTO(d.vlr_acu))
                .attr("fill", d => scale_COLOR(d.tipo_despesa))
                .attr("r", 8)
                .transition()
                .delay(1500)
                .duration(1000)
                .attr("opacity", 1);
        
        */
        
        // create line

        const line_acum = d3.line()
            .x(d => scale_X_PERIODO(d.periodo))
            .y(d => scale_ABSOLUTO(d.vlr_acu));
        
        const v_linha_obrig = $SVG.append("path")
                    .datum(dados_obrig)
                    .attr("class", "line-obrig layer-step3")
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
            .delay(4000)
            .duration(2000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        const v_linha_discr = $SVG.append("path")
                    .datum(dados_discr)
                    .attr("class", "line-discr layer-step3")
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
        
    }

    // // // Step 6 - Valores relativos
    const render_step6 = function() {
        
        let $line_obrig = d3.select(".line-obrig");
        //let d0_obrig = $line_obrig.attr("d");

        // função da linha relativa
        const line_relativa = d3.line()
            .x(d => scale_X_PERIODO(d.periodo))
            .y(d => scale_VARIACAO(d.vlr_var));

        /*let $line_obrig_relativa = $SVG.append("path")
            .datum(dados_obrig)            
            .attr("class", "line-obrig-relativa")
            .attr("d", line_relativa)
            .attr("display", "none");

         let d1_obrig = $line_obrig_relativa.attr("d");

         $line_obrig
             .attr('d', d0_obrig)
             .attr('stroke-dasharray', null)
             .attr('stroke-dashoffset', null)
             .transition()
             .duration(2000)
             .attr('d', d1_obrig); */
        $line_obrig
             .attr('stroke-dasharray', null)
             .attr('stroke-dashoffset', null)
             .transition()
             .duration(2000)
             .attr("d", line_relativa);

      }
    
    
    
    // // // Step 7 - Linhas                    
    const render_step7 = function(dados_obrig, dados_discr) {
        
        // create line
        const line_acum = d3.line()
        .x(d => scale_X_PERIODO(d.periodo))
        .y(d => scale_ABSOLUTO(d.vlr_acu));
        
        console.table(dados_obrig);
        console.table(dados_discr);
  
        const t_linhas = 3000;
    
        const v_linha_obrig = $SVG.append("path")
                    .datum(dados_obrig)
                    .attr("class", "line obrig layer-step2")
                    .attr("d", line_acum)
                    .attr('stroke', "steelblue")
                    .attr('stroke-width', 3)
                    .attr('fill', 'none');
    
        let comprimento_linha_obrig = v_linha_obrig.node().getTotalLength();
        console.log("Comprimento linha obrig:", comprimento_linha_obrig);
    
        v_linha_obrig
            .attr("stroke-dasharray", comprimento_linha_obrig + " " + comprimento_linha_obrig)
            .attr("stroke-dashoffset", comprimento_linha_obrig)
            .transition()
            .duration(t_linhas)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    
        const v_linha_discr = $SVG.append("path")
                    .datum(dados_discr)
                    .attr("class", "line discr layer-step2")
                    .attr("d", line_acum)
                    .attr('stroke', "lightcoral")
                    .attr('stroke-width', 3)
                    .attr('fill', 'none');
    
        let comprimento_linha_discr = v_linha_discr.node().getTotalLength();
        console.log("Comprimento linha discr:", comprimento_linha_discr);
    
        v_linha_discr
            .attr("stroke-dasharray", comprimento_linha_discr + " " + comprimento_linha_obrig)
            .attr("stroke-dashoffset", comprimento_linha_discr)
            .transition()
            .duration(t_linhas)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    }

    // // // Step 8 - Linhas relativas                    
    const render_step8 = function(dados_obrig, dados_discr) {
        
        // create line
        const line_relativa = d3.line()
        .x(d => scale_X_PERIODO(d.periodo))
        .y(d => scale_VARIACAO(d.vlr_var));

        console.log("Extent periodo dados_obrig:", d3.extent(dados_obrig, d => d.periodo));
        console.log("Extent periodo dados_discr:", d3.extent(dados_discr, d => d.periodo))
        
        const t_linhas = 3000;

        // problema: os paths vão ter quantidades de pontos diferentes.
        // vou tentar essa solução de interpolação do Mike bostock

        let d0 = $SVG.select(".line.obrig").attr("d");

        let nova_linha_obrig = $SVG.append('path')
                                   .datum(dados_obrig)
                                   .attr("d", line_relativa)
                                   .attr("display", "none");

        let d1 = nova_linha_obrig.attr("d");

        let linha_original_obrig_mod = $SVG.append('path')
                       .attr("id", "nova-linha-original")
                       .attr('d', d1)
                       .attr("display", "none")
                       .transition()
                       .duration(0)
                       .attrTween("d", pathTween(d0, 4));
        
        let d0_0 = d3.select("#nova-linha-original").attr("d");

        $SVG.select(".line.obrig").remove()
        linha_original_obrig_mod.remove()
        nova_linha_obrig.remove()


        const v_linha_obrig = $SVG.append('path')
             .attr('d', d0_0)
             .attr('stroke', "steelblue")
             .attr('class', 'line obrig layer-step3')
             .attr('stroke-width', 3)
             .attr('fill', 'none');

        v_linha_obrig
             .transition()
             .duration(5000)
             .attrTween("d", pathTween(d1, 4));



        console.log("d0 original e modificada", d0, d0_0);


        const v_linha_discr = $SVG.select(".line.discr")
                    .datum(dados_discr)
                    .attr("class", "line discr layer-step3")
                    .transition()
                    .duration(t_linhas)
                    .attr('d', line_relativa);  
    }

    // inicio fluxo
    
    let layer_step1 = render_step1();

    d3.selectAll(".nav-stepper li")
      .on("click", function(){
         console.log("Estou no listener dos steps. O this é", this);

         const step_anterior = step_atual;

         console.log("Step atual:", step_anterior);
         
         let step_clicado = d3.select(this).attr("id").substr(5,4);
         // se o usuário clicar no número, essa substr não vai ter 4 
         // caracteres, mas um só, o próprio número.

         if (step_clicado == "next") {
             if (step_atual != 7) step_atual += 1;                  
         } else if (step_clicado == "prev") {
             if (step_atual != 1) step_atual -= 1;
         } else step_atual = +step_clicado; // esse caso vai ser o em que
                                           // o objeto clicado é um step
                                           // propriamente dito
          
          switch_step(step_atual);

          switch (""+step_atual) {
            case "1":
                if (step_anterior > step_atual) {
                    $SVG.selectAll(".layer-step2").remove()
                }
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