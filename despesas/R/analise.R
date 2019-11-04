library(ckanr)
library(tidyverse)
library(readxl)

# Baixa arquivo do ckan ---------------------------------------------------

# recurso_TT_desp <- resource_show(id="1043f379-e7fb-4c18-be52-345b8672ccfb",
#                              url="https://apickan.tesouro.gov.br/ckan")
# download.file(recurso_TT_desp$url, destfile = "./despesas/dados/desp_uniao.xlsx", mode = 'wb' )
# desp_uniao <- read_excel("./despesas/dados/desp_uniao.xlsx")
# save(desp_uniao, file = "./despesas/dados/desp_uniao.RData")

load("desp_uniao.RData")

# classifica despesas -----------------------------------------------------

acoes_rpps_civil <- c("0053", "0054", "0055", "009K", "0181", "0397")
acoes_rpps_militar <- c("0179")
acoes_rpps_fcdf <- c("00Q2", "00QD", "00QN", "009T")
acoes_rpps_demais_desp <- c("0005", "0041", "00F1", "00F2", "00NS", "0536", "0739", "0C01")
acoes_rpps_acoes_antigas <- c("0396", "0436", "0C00")
acoes_rpps_seguridade <- c(acoes_rpps_civil, acoes_rpps_militar, acoes_rpps_fcdf, acoes_rpps_demais_desp, acoes_rpps_acoes_antigas)

acoes_rpps_militar_esf_fiscal <- c("214H", "218K")

subfuncoes_rpps <- c("272", "273", "274", "845", "846")

desp_pre <- desp_uniao %>%
  mutate(classificador = case_when(
    DespesaRGPS == TRUE ~ "Benefícios RGPS",
    GND_cod %in% c("4", "5") ~ "Investimentos",
    GND_cod %in% c("2", "6") ~ "Dívida",
    GND_cod == "3" & Funcao_cod == "10" ~ "Custeio Saúde",
    GND_cod == "3" & Funcao_cod == "12" ~ "Custeio Educação",
    GND_cod == "3" & Funcao_cod %in% c("08", "11") ~ "Custeio Social",
    GND_cod == "3" & as.numeric(Modalidade_cod) %in% 30:49 ~ "Outras Transferências",
    GND_cod == "3" ~ "Custeio Administrativo",
    GND_cod == "1" & 
      (
        (Esfera_cod == "2" & 
           Subfuncao_cod %in% subfuncoes_rpps &
           Acao_cod %in% acoes_rpps_seguridade) 
        |
          (Esfera_cod == "1" &
             Acao_cod %in% acoes_rpps_militar_esf_fiscal)
      ) ~ "Benefícios RPPS",
    GND_cod == "1" ~ "Pessoal (ativo)")) %>%
  mutate


# restringe para período e variáveis de interesse -------------------------

# essa aproximação parece ter funcionado

desp <- desp_pre %>%
  filter(Ano %in% c("2018", "2017", "2016")) %>%
  mutate(discr = ifelse(
    ResultadoPrim_cod %in% c("7", "6", "3", "2") & ExcecaoProgFin_cod == "NAO",
    "discr", "obrig")) %>%
  group_by(discr, Ano) %>%
  summarise(valor = sum(Valor)) %>%
  ungroup() %>%
  spread(Ano, valor)
  
  

