# Vison

IDE visual de JSON Schema em HTML, CSS e JavaScript ES6 puro, sem dependências externas obrigatórias.

## Arquitetura

- `index.html`: shell semântico, controles e CSP.
- `css/style.css`: tema responsivo, foco visível e layout adaptável.
- `js/models/schema-model.js`: árvore, histórico undo/redo, estado dirty, importação e exportação do modelo.
- `js/views/schema-view.js`: renderização segura com `createElement`, `textContent` e atributos controlados; não contém regra de negócio.
- `js/controllers/app-controller.js`: eventos, confirmação de importação, validação e coordenação.
- `js/services/storage-service.js`: localStorage, clipboard, download e diagnóstico de status/quota.
- `js/utils.js`: normalização/migração, conversão de árvore, validação e utilitários.
- `tests/`: fixture e runner determinístico sem dependências externas.

## Execução local

Use Node.js 20 ou superior e execute `npm start`. Abra **http://127.0.0.1:8000**. HTTP é obrigatório: não abra `index.html` via `file://`, pois a aplicação usa módulos ES. O servidor sem dependências fornece MIME correto e escuta somente em 127.0.0.1. Ele expõe apenas index.html, js/ e css/, sem listagem de diretórios.

Para outra porta no PowerShell: `$env:PORT=8001; npm start`. Se a porta estiver ocupada, coordene o restart com o Orquestrador; não encerre o servidor atual automaticamente. Para os testes automatizados:

```text
npm test
npm run check
node tests/run-tests.mjs
```

Não há build, instalação ou acesso de rede necessário.

## Documentação da versão local

- `CHANGELOG.md`: histórico de mudanças da versão `0.1.0-local`.
- `RELEASE_NOTES.md`: escopo liberado, operação, limitações e rollback local.
- `TRACEABILITY.md`: rastreabilidade dos requisitos finais para evidências e artefatos.
- `release/G7-RELEASE-RECORD.json`: registro e integridade do empacotamento produzido no G7.
- `release/G8-DOCUMENTATION-RECORD.json`: registro desta revisão documental.

## Documentação da versão local

- `CHANGELOG.md`: histórico de mudanças da versão `0.1.0-local`.
- `RELEASE_NOTES.md`: escopo liberado, operação, limitações e rollback local.
- `TRACEABILITY.md`: rastreabilidade dos requisitos finais para evidências e artefatos.
- `release/G7-RELEASE-RECORD.json`: registro e integridade do empacotamento produzido no G7.
- `release/G8-DOCUMENTATION-RECORD.json`: registro desta revisão documental.

## Dados, versão e diagnóstico

Documentos recebem `schemaVersion: 1`. `normalizeSchema()` migra documentos legados sem versão para a versão atual, corrige tipo ausente por inferência e normaliza `properties`/`items`. O storage mantém o backup em `localStorage` sob `vison-schema-v1`.

`storageService.getStatus()` expõe operação, sucesso, mensagem, tipo de erro e versão. Falhas de leitura, gravação, remoção e quota não são silenciadas; a interface mostra mensagem quando uma gravação falha. O status de backup é visível no rodapé da árvore.

Antes de qualquer `importSchema` iniciado por arquivo, alterações dirty exigem confirmação explícita. Cancelar preserva o documento atual. `title`, `description`, `$schema` e `schemaVersion` são preservados no import/export.

## Segurança e acessibilidade

O documento usa CSP sem `unsafe-inline`, `connect-src 'none'`, `object-src 'none'` e `form-action 'none'`. Dados do schema não são inseridos via `innerHTML`: árvore, inspector, preview, mensagens e código são criados com nós DOM e `textContent`. O código mantém syntax highlight com spans gerados a partir de tokens do JSON.

Não há `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, `new Function` ou `document.write`. Controles têm texto/labels, a árvore usa `role=tree/treeitem`, seleção ARIA, foco por teclado e foco visível; o layout possui breakpoints para telas menores.

## Critérios verificados

- Testes determinísticos cobrem árvore, required/items, validação, import/export com metadados, undo/redo, normalização, storage e erro de quota.
- `node --check` cobre todos os módulos da aplicação.
- Checagem textual confirma CSP e ausência das APIs/sinks proibidas.
- QA visual interativo não é declarado: depende de navegador local e deve ser revalidado pelo Tester.

## Limitações conhecidas

O preview visual resume propriedades do objeto e o editor opera em um documento por vez. A validação cobre os campos suportados pela interface, não é um validador completo de todos os vocabulários do JSON Schema Draft 2020-12.

Backups inválidos são preservados integralmente em `vison-schema-v1`; o boot abre o exemplo inicial com aviso e bloqueia gravações automáticas nesta sessão. Exporte o trabalho para JSON. Para recuperar o backup, copie o valor original pelo DevTools antes de qualquer limpeza manual e corrija o documento; depois recarregue. Nenhuma limpeza é automática.
