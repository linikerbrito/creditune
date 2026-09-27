# Creditune

![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-B7178C?style=flat&logo=reactivex&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=flat&logo=sass&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)
![Cypress](https://img.shields.io/badge/Cypress-17202C?style=flat&logo=cypress&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

Simulação de uma área de aprovação de crédito/empréstimo, no estilo de
sistemas usados no setor bancário. Projeto de portfólio pessoal, com foco
em demonstrar domínio de Angular moderno (standalone components, Signals,
Reactive Forms avançados) em um cenário próximo de aplicações corporativas
reais.

## Funcionalidades

### Área do cliente
- Solicitação de crédito em formulário multi-etapa (dados e renda, valor e
  prazo, revisão e envio)
- Simulação de parcelas em tempo real, recalculada conforme o valor e o
  prazo são ajustados
- Validação assíncrona de CPF e validadores customizados de elegibilidade
- Acompanhamento do status da proposta (pendente, em análise, aprovado,
  rejeitado)
- Histórico de propostas enviadas

### Área do analista
- Painel com a fila de propostas pendentes
- Filtros por status, faixa de valor e período
- Revisão detalhada de cada proposta
- Aprovação ou rejeição, com justificativa obrigatória para rejeição

## Stack

- **Angular** (standalone components, sem NgModules)
- **Signals** para estado local/UI
- **RxJS** para fluxos assíncronos (simulação de parcelas, chamadas HTTP)
- **Reactive Forms** com `FormGroup`/`FormArray` aninhados
- **Guards** e **Resolvers** para proteção e pré-carregamento de rotas
- **HttpInterceptor** para autenticação simulada e tratamento de erros
- **SCSS** puro, sem UI kit pesado
- **Jest** (testes unitários) e **Cypress** (testes e2e)
- **Docker** para containerização

## Arquitetura

```
src/app/
├── core/
│   ├── guards/          # auth.guard.ts, analyst.guard.ts
│   ├── interceptors/    # auth.interceptor.ts, error.interceptor.ts
│   ├── services/        # auth.service.ts, proposal.service.ts, credit-score.service.ts
│   └── models/          # proposal.model.ts, user.model.ts
├── features/
│   ├── client/
│   │   ├── proposal-form/       # formulário multi-etapa
│   │   ├── proposal-tracking/   # acompanhamento de status
│   │   └── proposal-list/       # histórico de propostas
│   └── analyst/
│       ├── analyst-dashboard/   # fila de propostas pendentes
│       └── proposal-review/     # aprovação/rejeição
├── shared/
│   ├── components/      # componentes reutilizáveis (stepper, badges, inputs)
│   └── pipes/           # pipes customizados (formatação de moeda, status)
└── app.routes.ts
```

Regras de negócio (cálculo de score, elegibilidade, simulação de parcelas)
ficam isoladas em serviços injetáveis, separadas dos componentes de UI, o
que mantém os componentes de apresentação simples e os serviços
testáveis isoladamente.

Não há backend real: os dados são simulados em memória através dos
serviços em `core/services`.

## Como rodar

Pré-requisitos: Node.js (LTS) e Angular CLI instalados globalmente.

```bash
# clonar o repositório
git clone https://github.com/linikerbrito/creditune.git
cd creditune

# instalar dependências
npm install

# rodar em modo desenvolvimento
ng serve
```

A aplicação fica disponível em `https://creditune-topaz.vercel.app/`.

## Testes

```bash
# testes unitários (Jest)
npm test

# testes e2e (Cypress)
npm run e2e
```

## Docker

```bash
docker build -t creditune .
docker run -p 8080:80 creditune
```

## Autor

**Liniker Brito**
Desenvolvedor Front-end
[LinkedIn](https://www.linkedin.com/in/liniker-brito/)
