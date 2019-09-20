library(ckanr)
library(readxl)
library(tidyverse)

# importação de dados -----------------------------------------------------

recurso_TT <- resource_show(id="527ccdb1-3059-42f3-bf23-b5e3ab4c6dc6",
                             url="https://apickan.tesouro.gov.br/ckan")
download.file(recurso_TT$url, destfile = "./rtn.xlsx", mode = 'wb' )
tabela <- read_excel("rtn.xlsx", sheet = "1.1", skip = 4)


# processa dados ----------------------------------------------------------

meses <- c("Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro")

# ,Valor_12m = zoo::rollapply(Valor, width = 12, FUN = sum, fill = NA, align = 'right'),
# Resultado = ifelse(Valor_12m > 0, "Positivo", "Negativo"

serie <- tabela %>% 
  rename(rotulos = 1) %>%
  filter(str_detect(rotulos, "IV. DESPESA TOTAL") |
           str_detect(rotulos, "IV.4.2 Discricionárias")) %>%
  mutate(rotulos = c("DespTotal", "DespDiscr")) %>%
  gather(-1, key = "Periodo", value = "Valores") %>%
  spread(key = rotulos, value = Valores) %>%
  mutate(DespTotal = as.numeric(DespTotal),
         DespDiscr = as.numeric(DespDiscr),
         Periodo = as.Date(as.numeric(Periodo), origin = "1899-12-30"),
         Ano = lubridate::year(Periodo),
         Mes = lubridate::month(Periodo),
         Data = paste0(Ano, " - ", meses[Mes])) %>%
  filter(Periodo >= "2010-01-01") %>%
  mutate(DespObrig = DespTotal - DespDiscr) %>%
  mutate_at(vars(starts_with("Desp")), .funs = list( # para preservar as variáveis originais
    ac12m = ~zoo::rollapply(., width = 12, FUN = sum, fill = NA, align = 'right')))

serie_bolhas <- serie %>%
  filter(!is.na(DespDiscr_ac12m), Mes == 12) %>%
  select(Periodo, DespDiscr_ac12m, DespObrig_ac12m) %>%
  mutate_at(vars(starts_with("Desp")), .funs = ~. - lag(.)) %>%
  rename(discricionaria = DespDiscr_ac12m,
         obrigatoria    = DespObrig_ac12m) %>%
  gather(discricionaria, obrigatoria, key = tipo_despesa, value = valor_diferenca)

serie_acum <- serie %>%
  filter(!is.na(DespDiscr_ac12m)) %>%
  select(Periodo, 
         discricionaria = DespDiscr_ac12m, 
         obrigatoria    = DespObrig_ac12m) %>%
  arrange(Periodo)

serie_valores <- serie_acum %>%
  gather(discricionaria, obrigatoria, key = tipo_despesa, value = valor_acumulado)
  
serie_variacao <- serie_acum %>%
  mutate_at(vars(-Periodo), .funs = ~./.[1]) %>%
  gather(discricionaria, obrigatoria, key = tipo_despesa, value = valor_variacao)
  
serie_plot <- serie_variacao %>%
  left_join(serie_bolhas) %>%
  left_join(serie_valores) %>%
  arrange(Periodo)



plot_completo <- ggplot(serie_plot, 
       aes(x = Periodo, y = valor_variacao, color = tipo_despesa)) + 
  geom_line(size = 1) +
  geom_point(aes(size = abs(valor_diferenca),
                 fill = valor_diferenca >= 0), 
             shape = 21, color = "white") +
  geom_text(aes(label = round(valor_diferenca/1000,0)), size = 3, color = "white") +
  scale_size(range = c(5, 20)) +
  theme_minimal()

ggsave(plot_completo, filename = "esboco_vis.png", type = "cairo-png")

write.csv(serie_plot, file = "dados.csv")
               