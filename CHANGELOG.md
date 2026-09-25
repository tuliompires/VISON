# Changelog

## [0.1.0-local] — 2026-09-24

### Entregue

- Editor visual local de JSON Schema em HTML, CSS e JavaScript ES6 puro.
- Árvore hierárquica com edição, seleção, inclusão, remoção e histórico undo/redo.
- Validação dos campos suportados, normalização/migração para `schemaVersion: 1` e preservação de metadados.
- Importação/exportação JSON, persistência local via `localStorage` e diagnóstico de quota/status.
- CSP restritiva, renderização segura por nós DOM/texto, acessibilidade semântica e layout responsivo documentados.
- Suíte determinística: `npm test` com 7/7 testes e `npm run check` com saída 0.

### Documentação G8

- README revisado com índice dos artefatos documentais.
- Notas de release, changelog e matriz de rastreabilidade adicionados.
- Limitações preservadas: sem QA visual interativo declarado, sem backend/publicação remota e sem Git/SCM detectado.

### Não incluído

- QA visual interativo em navegador; deve ser executado pelo Tester no ambiente apropriado.
- Validação completa de todos os vocabulários do JSON Schema Draft 2020-12.
- Persistência remota, autenticação, colaboração e rollback remoto.
