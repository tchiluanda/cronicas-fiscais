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
    const AMPLITUDE_VLR_ABSOLUTO = d3.extent(dados, d => d.vlr_acu);
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

    const scale_VARIACAO = d3
        .scaleLinear()
        .range([h - PAD, PAD])
        .domain(AMPLITUDE_VLR_VARIACAO);

    const scale_COLOR = d3
        .scaleOrdinal()
        .range(["lightcoral", "steelblue"])
        .domain(["discricionaria", "obrigatoria"]);
    
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

    // grab svg reference
    const $SVG = d3.select(".grafico-d3-svg")
                   .attr("width", w)
                   .attr("height", h);

    // funcoes 

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
    
    // // // Step 1 - Barras atuais
    const render_step1 = function(dados) {
        const layer_step1 = $SVG.selectAll("rect")
                                .data(dados_inici)
                                .enter()
                                .append("rect")
                                .attr("x", 0)
                                .attr("y", d => if (d.tipo_despesa == "obrigatoria"))
                                .attr("width", 10)
                                .attr("height", 0)


    }

    // // // Step 3 - Valores e caixa de texto
    const render_step3 = function(dados) {
        
        // não sei por que só funcionou aqui com >=, se não ele só traz uma linha)
    
        console.log("Dados pontos");
        console.table(dados_pontos);
  
        const layer_step1_pontos = $SVG.selectAll("circle")
                                .data(dados_pontos)
                                .enter()
                                .append("circle")
                                .attr("cx", d => scale_X_PERIODO(d.periodo))
                                .attr("cy", d => scale_ABSOLUTO(d.vlr_acu)+25)
                                .attr("class", "layer-step1")
                                .attr("r", 0)
                                .attr("fill", function(d) {
                                    if (d.tipo_despesa == "obrigatoria") return "steelblue"
                                    else return "lightcoral"})
                                .transition()
                                .duration(1000)
                                .attr("r", 10)
                                .attr("cy", d => scale_ABSOLUTO(d.vlr_acu));

    }
    
    
    
    // // // Step 4 - Linhas                    
    const render_step4 = function(dados_obrig, dados_discr) {
        
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

    // // // Step 5 - Linhas relativas                    
    const render_step5 = function(dados_obrig, dados_discr) {
        
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
    
    let layer_step1 = render_step3(dados);

    d3.selectAll(".nav-stepper li")
      .on("click", function(){
         console.log("Estou no listener dos steps. O this é", this);

         const step_anterior = step_atual;

         console.log("Step atual:", step_anterior);
         
         let step_clicado = d3.select(this).attr("id").substr(5,4);
         // se o usuário clicar no número, essa substr não vai ter 4 
         // caracteres, mas um só, o próprio número.

         if (step_clicado == "next") {
             if (step_atual != 4) step_atual += 1;                  
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
                render_step1(dados);
                break;              
            case "2":
                render_step2(dados_obrig, dados_discr);
                break;
            case "3":
                render_step3(dados_obrig, dados_discr);
                break;
            case "4":
                render_step4(dados_obrig, dados_discr);
                break;
            case "5":
                render_step5(dados_obrig, dados_discr);
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