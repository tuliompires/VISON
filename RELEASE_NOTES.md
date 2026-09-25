# Notas de release — Vison 0.1.0-local

## Resumo

Entrega local do Vison como IDE estático de JSON Schema. A versão não requer build, instalação ou rede: abra `index.html` ou sirva o diretório com um servidor estático.

## Escopo liberado

- Modelo hierárquico, edição, seleção e undo/redo.
- Validação, normalização/migração, importação e exportação JSON.
- Backup local em `localStorage`, mensagens de status e tratamento de quota.
- CSP e renderização segura sem execução do conteúdo do schema.
- Artefatos locais em `release/vison-0.1.0-local/` e `release/vison-0.1.0-local.zip`.

## Evidências

- G5, G6 e G7: aprovados conforme `release/G7-RELEASE-RECORD.json`.
- Integridade do snapshot: `MANIFEST.sha256.json`.
- Testes registrados pelo G7: `npm.cmd test` — 7/7; `npm.cmd run check` — exit 0.
- Rastreabilidade detalhada: `TRACEABILITY.md`.

## Operação e rollback

Abra `index.html` em navegador moderno. Para rollback local, pare o servidor estático e remova ou substitua o snapshot/ZIP conforme a política do ambiente; não existe rollback remoto porque não foi detectado Git nem publicação remota.

## Limitações e ressalvas

Não há QA visual interativo declarado nesta etapa. A documentação registra apenas evidências automatizadas e inspeções documentais disponíveis. Dados em `localStorage` permanecem sujeitos à limpeza/quota do navegador; exporte o schema para retenção manual.
