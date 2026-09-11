# pp2-cs4-2026-2
Repositório da disciplina de Paradigmas de Programação II - 4º sem. CC/SI - Uni-FACEF 2026/2

Back-end do cadastro de clientes da loja Karangos, com as etapas de código do roteiro até **10/09/2026**. Implementação concluída em 11/09, preservando as datas reais do histórico Git.

## Executar

Requisitos: Node.js 24, npm e PostgreSQL. O banco pode estar no Prisma Postgres (conforme o roteiro) ou em um servidor PostgreSQL local.

1. Dentro de `back-end`, execute `npm ci`.
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL` com a conexão do seu banco. Mantenha esse arquivo fora do Git.
3. Execute `npm run db:migrate` para aplicar as três migrations.
4. Execute `npm run build` para gerar o Prisma Client e compilar o TypeScript.
5. Execute `npm run dev` para desenvolvimento ou `npm start` para compilar e iniciar a versão JavaScript.

A API atende em **http://localhost:8888**. A variável `PORT` pode alterar a porta. `npm run db:studio` abre o Prisma Studio para consultar a tabela `Customer`.

Os imports locais usam `.js`, com resolução `NodeNext`, para funcionar tanto com `tsx` quanto após a compilação. O Prisma Client fica em `back-end/generated/prisma` e é gerado pelo build, sem versionamento.

## Endpoints

| Método | Caminho | Resultado |
| --- | --- | --- |
| GET | `/customers` | 200: lista ordenada por nome |
| GET | `/customers/:id` | 200: cliente encontrado |
| POST | `/customers` | 201: cliente criado e persistido |
| PUT | `/customers/:id` | 200: cliente atualizado; aceita os campos alterados |
| DELETE | `/customers/:id` | 204: exclusão, sem corpo |

Cliente inexistente retorna `404`; documento ou e-mail duplicado retorna `409`. IDs inválidos, JSON malformado e dados rejeitados pelo Prisma retornam `400`. Erros inesperados retornam `500`, sem enviar detalhes internos ao cliente.

O arquivo [customers.http](back-end/requests/customers.http) contém o corpo de Mariana fornecido no PDF e exemplos das cinco operações. No EchoAPI, selecione POST, URL `http://localhost:8888/customers`, Body/raw/JSON e copie o corpo desse arquivo. O POST deve retornar `201`; repetindo os mesmos documento/e-mail, o resultado esperado é `409`. Use o ID retornado nas operações seguintes.

## Arquitetura e banco

`server → app → routes → controllers → services → repositories → Prisma Client → PostgreSQL`

O modelo `Customer` possui ID autoincremental, documento e e-mail únicos, nascimento `DATE` opcional, complemento opcional e UF `CHAR(2)`. As migrations registram separadamente a criação da tabela, a alteração da UF e os índices únicos. A camada de serviço gera `NotFoundError`; o middleware converte os erros em respostas HTTP. O cliente Prisma registra consultas, parâmetros e duração no terminal, conforme o roteiro.

## Testes de integração

Use um banco PostgreSQL separado para testes. No PowerShell, dentro de `back-end`:

```powershell
$env:TEST_DATABASE_URL = 'postgresql://USUARIO:SENHA@localhost:5432/karangos_test'
$env:DATABASE_URL = $env:TEST_DATABASE_URL
npm run db:migrate
npm run build
npm test
Remove-Item Env:DATABASE_URL
Remove-Item Env:TEST_DATABASE_URL
```

Os testes enviam HTTP real para o Express e verificam os registros no PostgreSQL, cobrindo CRUD, ordenação, unicidade, campos opcionais, ausência de registro e entradas inválidas. Os registros criados pelos testes são removidos ao final. `TEST_DATABASE_URL` é obrigatória para evitar usar acidentalmente a conexão de desenvolvimento.

## Validação desta entrega

Em 11/09/2026, com Node.js 24 e PostgreSQL 18 local:

- `npm run build`: aprovado; `npm start`: servidor compilado iniciado na porta 8888.
- Três migrations aplicadas; `prisma migrate status`: atualizado; `prisma migrate diff`: nenhuma diferença entre schema e banco.
- `npm test`: 3 testes de integração aprovados, sem falhas.
- POST com o corpo exato de Mariana do roteiro: **201 Created**, `id: 1`.
- GET `/customers/1`: **200 OK**, confirmando os dados persistidos.

Após configurar a conexão Prisma Postgres do usuário, a validação foi repetida **no banco em nuvem**:

- Os três arquivos de migrations foram recuperados com os nomes já registrados no banco (`20260903225534_create_customers`, `20260903225550_alter_customers` e `20260903225700_alter_customers`). Os hashes SHA-256 dos arquivos conferem exatamente com os checksums das migrations aplicadas. O SQL foi recuperado do [repositório da disciplina](https://github.com/faustocintra/pp2-cs4-2026-2/tree/main/back-end/prisma/migrations).
- A tentativa inicial de recriar a tabela existente foi marcada como revertida no histórico pelo `prisma migrate resolve`, sem remover a tabela ou registros.
- `npm run db:migrate`: nenhuma migration pendente; `prisma migrate status`: atualizado; `prisma migrate diff`: nenhuma diferença.
- `npm start`: build aprovado e API conectada ao Prisma Postgres.
- POST `/customers` com o corpo de Mariana: **201 Created**, `id: 1`; GET `/customers/1`: **200 OK**. Uma consulta SQL independente confirmou o registro no banco em nuvem.
- As migrations recuperadas também foram aplicadas em um novo banco local vazio (`karangos_verify`), com os três testes de integração aprovados novamente.

A conexão ativa com a nuvem está somente em `back-end/.env`, ignorada pelo Git. `.env.example` mantém `DATABASE_URL` vazia. Nesta máquina, o VS Code também está escutando em `127.0.0.1:8888`; se ele interceptar a conexão, use `http://[::1]:8888` para alcançar diretamente a API. O POST de validação em nuvem foi enviado por esse endereço de loopback IPv6.

Para os testes locais foi criado um cluster separado em `.tmp/postgres-data`, na porta 55432, sem modificar o serviço PostgreSQL já instalado. Após reiniciar o computador, ele pode ser iniciado a partir da raiz do repositório:

```powershell
& 'C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe' -D .tmp/postgres-data -l .tmp/postgres.log -o '-p 55432 -h 127.0.0.1' -w start
```

Esse cluster atende somente na interface local e usa autenticação trust para desenvolvimento. Os arquivos do banco permanecem locais e não são enviados ao repositório.

As atividades pessoais no AVA e de organização do grupo UCE não fazem parte da implementação deste repositório; a avaliação de 17/09 e o relatório com prazo de 27/09 estão fora do recorte solicitado.
