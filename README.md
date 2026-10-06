This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Painel administrativo

O painel `/admin` usa os endpoints protegidos do backend para consultar e gerenciar usuários e setores no banco. Configure `NEXT_PUBLIC_API_URL` em `.env.local` se a API não estiver em `http://localhost:8000`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

No login, selecione **Almoxarife** e informe `admin_cinza` para revelar o acesso administrativo. A senha é validada pelo backend; a conta precisa existir com perfil `ADMIN`. Para criar a primeira conta ADMIN, configure o `.env` do backend e rode `\.venv\Scripts\python.exe .\bootstrap_admin.py`, informando `admin_cinza` como login e definindo uma senha própria. Não há senha padrão no frontend. Com uma conta ADMIN já existente, crie `admin_cinza` pelo endpoint `POST /usuarios` no Swagger (`http://localhost:8000/docs`) ou pelo painel depois do primeiro acesso.

O botão de desativar preserva os registros da conta no banco. Apenas usuários autenticados com perfil `ADMIN` podem criar, desativar ou reativar contas; o backend também valida cada operação de setor.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
