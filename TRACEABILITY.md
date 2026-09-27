# Rastreabilidade — Vison 0.1.0-local

| Requisito | Evidência no produto/documentação | Estado G8 |
|---|---|---|
| REQ-01 | `js/models`, `js/views`, `js/controllers`, `README.md` | Coberto |
| REQ-02 | `js/models/schema-model.js`, `js/utils.js`, fixture e README | Coberto |
| REQ-03 | `schema-model.js`, controles documentados no README | Coberto |
| REQ-04 | histórico em `schema-model.js`, teste undo/redo | Coberto |
| REQ-05 | `validateSchema`, teste de validação e seção de dados | Coberto |
| REQ-06 | `storage-service.js`, testes de carga/quota e README | Coberto |
| REQ-07 | fluxo de import/export em controller/modelo, README | Coberto |
| REQ-08 | `index.html`, CSS, papéis ARIA, foco e responsividade | Coberto por inspeção; QA visual não declarado |
| REQ-09 | status em `storage-service.js` e documentação de diagnóstico | Coberto |
| REQ-10 | `tests/run-tests.mjs`, `package.json`, ressalva de QA visual | Coberto nos testes disponíveis |
| REQ-11 | README, `package.json` e `RELEASE_NOTES.md` | Coberto |
| REQ-12 | `normalizeSchema`, `schemaVersion: 1`, testes e README | Coberto |
| REQ-13 | diagnóstico local em storage/status; ausência de rede documentada | Coberto |

## Evidências de gate

- G4 — exportações preservam a ordem visual: `js/utils.js`, `js/services/storage-service.js`, `js/views/form-view.js`, `js/controllers/app-controller.js`, `tests/ticket-26.test.mjs` e `tests/form-export.test.mjs`; validação registrada em `ai_changes/27_G4_20260927-153000.md`.

- G5/G6/G7 aprovados e registrados em `release/G7-RELEASE-RECORD.json`.
- Snapshot e ZIP produzidos no G7; o manifesto registra hashes e tamanhos do snapshot.
- G8 revisa a documentação sem alterar código funcional.

## Decisões, exceções e riscos aceitos

- A versão é local e não possui SCM/publicação remota; rollback é operacional no diretório/ZIP.
- Não foi inventado resultado de QA visual; essa validação permanece com o Tester.
- `localStorage` é persistência local, não backup durável; quota, limpeza e confidencialidade residual permanecem riscos documentados.
- A validação implementada cobre os campos suportados pela interface, não todo o vocabulário JSON Schema Draft 2020-12.
