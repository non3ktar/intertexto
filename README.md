# EduAção Literária - 9º Ano

## 🎯 Objetivo do Projeto
Transformar o "Plano de Unidade: Interpretação Textual e Análise Crítica – 9º Ano do Ensino Fundamental" em um Objeto de Aprendizagem Interativo. O aplicativo simula um ambiente virtual de aprendizagem gamificado onde os alunos completam missões (Diários de Leitura, Análises Críticas) e sobem de nível, enquanto o professor monitora o progresso, cria novos desafios e avalia as entregas.

## 💻 Tech Stack
- **Frontend**: HTML5, Vanilla JavaScript.
- **Styling**: Tailwind CSS (CDN), CSS Custom (Glassmorphism, Dark Mode).
- **Ícones & Fontes**: Lucide Icons, Google Fonts (Outfit, Inter).
- **Animações**: Animate.css.
- **Banco de Dados Local**: Dexie.js (IndexedDB).
- **Alertas / Modais**: SweetAlert2.

## 🚀 Setup / Instruções de Execução
Como este projeto utiliza IndexedDB para armazenamento no navegador, ele não exige a instalação de um servidor backend complexo para rodar localmente.

1. Navegue até a pasta do projeto:
   ```bash
   cd "/home/sergio/Área de trabalho/plano-II_unidade/app_interativo"
   ```
2. Inicie um servidor estático simples. Exemplo com Python:
   ```bash
   python3 -m http.server 8080
   ```
3. Acesse no navegador: `http://localhost:8080`

**Fluxo de Uso**:
- **Professor**: Faça o login marcando a opção "Professor" e digitando seu nome (ex: "Sérgio"). A partir do painel, você pode adicionar novas "Missões" e avaliar o que os alunos enviarem.
- **Aluno**: Faça o login marcando a opção "Aluno" e digitando seu nome. Realize as missões ativas, acompanhe a barra de XP e suba de nível após receber a nota (XP) do professor.

## 🌐 Deployment
Este aplicativo é uma SPA (Single Page Application) baseada em tecnologias estáticas. Ele pode ser facilmente publicado em serviços como:
- [Cloudflare Pages](https://pages.cloudflare.com)
- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)
- [Surge.sh](https://surge.sh)

Basta realizar o deploy da pasta contendo o `index.html`. 
*(Nota: Lembre-se que por usar Dexie.js, os dados ficam salvos localmente no navegador de cada usuário. Para que Professor e Aluno em máquinas diferentes interajam, o Dexie.js precisaria ser substituído pelo Supabase ou Firebase)*.

## 📜 Histórico de Modificações (Changelog)
- **v1.0.0** (06/06/2026):
  - Lançamento inicial.
  - Implementação do design "Vibe Coding" com Glassmorphism.
  - Painéis de Aluno e Professor estabelecidos.
  - Integração do banco de dados local com Dexie.js.
  - Gamificação (Níveis e XP para alunos).
