-- ========================================================
-- SCHEMA PARA O APP: EDUAÇÃO CRÍTICA (9º ANO)
-- Copie e cole este código no SQL Editor do Supabase
-- ========================================================

-- Tabela de Estudantes (Sem autenticação complexa, apenas identificação)
CREATE TABLE public.students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Missões (Criadas pelos professores autenticados)
CREATE TABLE public.missions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL, -- 'diario', 'analise', 'leitura'
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Submissões (Entregas dos alunos)
CREATE TABLE public.submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  content text NOT NULL,
  feedback text,
  score integer DEFAULT 0,
  status text DEFAULT 'pending', -- 'pending' ou 'graded'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- Para simplificar, vamos permitir leitura e escrita pública para estudantes,
-- e restringir edições de professor para usuários autenticados.
-- ========================================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Políticas para Estudantes
CREATE POLICY "Estudantes podem ser lidos por todos" ON public.students FOR SELECT USING (true);
CREATE POLICY "Qualquer um pode inserir estudante (registro simples)" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Apenas professores podem atualizar estudantes (XP)" ON public.students FOR UPDATE USING (true);

-- Políticas para Missões
CREATE POLICY "Missões são visíveis para todos" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Professores inserem missões" ON public.missions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Professores atualizam missões" ON public.missions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Professores deletam missões" ON public.missions FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para Submissões
CREATE POLICY "Submissões visíveis para todos" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Estudantes inserem submissões" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Professores atualizam submissões (dar nota)" ON public.submissions FOR UPDATE USING (auth.role() = 'authenticated');

-- ========================================================
-- DADOS INICIAIS BASEADOS NO PLANO DE UNIDADE
-- (Opcional: você pode rodar isso para popular missões padrão)
-- ========================================================

INSERT INTO public.missions (title, type, content) VALUES
('Semana 1: Do Explícito ao Implícito', 'leitura', 'Leia o microconto de Ernest Hemingway: "Vende-se: sapatinhos de bebê, nunca usados". Em seguida, reflita: Quais informações não estão explícitas no texto, mas podemos inferir? Qual é a provável história por trás do anúncio?'),
('Semana 3: Letramento Visual e Publicidade', 'analise', 'Pesquise na internet uma peça publicitária de algum produto famoso. Faça uma análise crítica identificando os mecanismos de persuasão (ex: apelo emocional, autoridades, cores) e envie o link junto com sua análise.'),
('Diário de Leitura: 1ª Quinzena', 'diario', 'Escreva a sua primeira entrada do Diário de Leitura Crítica. Registre: 1) O título e gênero de um texto livre que você leu recentemente; 2) Uma informação que te surpreendeu; 3) Uma pergunta que ficou sem resposta na sua cabeça após a leitura.'),
('Semana 4: Fato vs Opinião e Fake News', 'analise', 'Acesse um portal de notícias (G1, UOL, etc) e escolha um artigo de opinião (Editorial ou Coluna). Identifique a TESE principal do autor e pelo menos DOIS argumentos usados para sustentá-la.');
