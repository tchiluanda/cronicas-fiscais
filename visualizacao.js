const $grafico = d3.select('.grafico-d3');
const $grafico_container = d3.select('.grafico-d3-container');
const $svg     = $grafico.select('.grafico-d3-svg');

const PAD = 20;

console.log("Estou aqui.")

d3.csv("dados.csv", function(d) {
    return {
        periodo: d.Periodo,
        tipo_despesa: d.tipo_despesa,
        vlr_var: +d.valor_variacao,
        vlr_dif: +d.valor_diferenca,
        vlr_acu: +d.valor_acumulado
    }
}).then(function(dados) {
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

    const w = $grafico_container.node().offsetWidth;
    console.log("Largura do container: ", w);

    const LAST_DATE = d3.max(dados, d => d.periodo);
    console.log("Última data: ", LAST_DATE);

    const scale_ABSOLUTO = d3.scaleLinear().range([PAD, w - PAD]).domain(AMPLITUDE_VLR_ABSOLUTO);

    const scale_VARIACAO = d3.scaleLinear().range([PAD, w - PAD]).domain(AMPLITUDE_VLR_VARIACAO);

    

    // console.log(AMPLITUDE_VLR_ABSOLUTO, 
    //     d3.max(dados, d => d.vlr_acu),
    //     scale_ABSOLUTO.domain(),
    //     scale_ABSOLUTO.range());








    

    
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