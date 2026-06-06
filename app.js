// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================
// ATENÇÃO: Substitua as strings abaixo com os dados do seu projeto Supabase!
const SUPABASE_URL = 'COLE_SEU_URL_AQUI';
const SUPABASE_KEY = 'COLE_SUA_ANON_KEY_AQUI';

let supabaseClient;
if (SUPABASE_URL !== 'COLE_SEU_URL_AQUI') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ============================================================================
// ESTADO DA APLICAÇÃO
// ============================================================================
const state = {
    currentUser: null, // { id, name, role, xp, level } ou session do supabase
    currentView: 'dashboard'
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    
    if (SUPABASE_URL === 'COLE_SEU_URL_AQUI') {
        Swal.fire({
            icon: 'warning',
            title: 'Supabase não configurado',
            text: 'Por favor, insira o URL e a ANON KEY no arquivo app.js.',
            confirmButtonColor: '#6d28d9'
        });
        return;
    }

    setupLoginTabs();
    setupEventListeners();
    await checkAuth();
});

function setupLoginTabs() {
    const tabStudent = document.getElementById('tab-student');
    const tabTeacher = document.getElementById('tab-teacher');
    const formStudent = document.getElementById('form-student');
    const formTeacher = document.getElementById('form-teacher');

    tabStudent.addEventListener('click', () => {
        tabStudent.classList.replace('text-slate-400', 'text-white');
        tabStudent.classList.add('bg-primary', 'shadow');
        tabTeacher.classList.remove('bg-primary', 'shadow', 'text-white');
        tabTeacher.classList.add('text-slate-400');
        
        formStudent.classList.remove('hidden');
        formTeacher.classList.add('hidden');
    });

    tabTeacher.addEventListener('click', () => {
        tabTeacher.classList.replace('text-slate-400', 'text-white');
        tabTeacher.classList.add('bg-primary', 'shadow');
        tabStudent.classList.remove('bg-primary', 'shadow', 'text-white');
        tabStudent.classList.add('text-slate-400');
        
        formTeacher.classList.remove('hidden');
        formStudent.classList.add('hidden');
    });
}

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================
async function checkAuth() {
    // Check if Teacher is logged in via Supabase Auth
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        state.currentUser = { ...session.user, role: 'teacher', name: 'Professor' };
        showAppView();
        return;
    }

    // Check if Student is stored in LocalStorage
    const studentId = localStorage.getItem('eduacao_studentId');
    if (studentId) {
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();
            
        if (data && !error) {
            state.currentUser = { ...data, role: 'student' };
            showAppView();
            return;
        } else {
            localStorage.removeItem('eduacao_studentId');
        }
    }

    showLoginView();
}

async function loginStudent(name) {
    if (!name.trim()) return;
    const cleanName = name.trim();
    
    // Check if student exists
    let { data: student, error } = await supabaseClient
        .from('students')
        .select('*')
        .ilike('name', cleanName)
        .single();
        
    // If not, create
    if (!student || error) {
        const { data: newStudent, error: insertError } = await supabaseClient
            .from('students')
            .insert([{ name: cleanName, xp: 0, level: 1 }])
            .select()
            .single();
            
        if (insertError) {
            Swal.fire('Erro', 'Não foi possível registrar o aluno.', 'error');
            return;
        }
        student = newStudent;
    }

    localStorage.setItem('eduacao_studentId', student.id);
    state.currentUser = { ...student, role: 'student' };
    
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Bem-vindo, ${student.name}!`, showConfirmButton: false, timer: 2000 });
    showAppView();
}

async function loginTeacher(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        Swal.fire('Erro de Login', 'Email ou senha inválidos.', 'error');
        return;
    }

    state.currentUser = { ...data.user, role: 'teacher', name: 'Professor' };
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Acesso concedido!', showConfirmButton: false, timer: 2000 });
    showAppView();
}

async function logout() {
    if (state.currentUser?.role === 'teacher') {
        await supabaseClient.auth.signOut();
    } else {
        localStorage.removeItem('eduacao_studentId');
    }
    state.currentUser = null;
    showLoginView();
}

// ============================================================================
// UI & EVENTOS
// ============================================================================
function setupEventListeners() {
    document.getElementById('form-student').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('student-name').value;
        await loginStudent(name);
    });

    document.getElementById('form-teacher').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('teacher-email').value;
        const password = document.getElementById('teacher-password').value;
        await loginTeacher(email, password);
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        logout();
    });
}

function showLoginView() {
    document.getElementById('view-app').classList.add('hidden');
    document.getElementById('view-login').classList.remove('hidden');
    document.getElementById('view-login').classList.add('flex');
}

function showAppView() {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-login').classList.remove('flex');
    document.getElementById('view-app').classList.remove('hidden');
    document.getElementById('view-app').classList.add('flex');
    
    updateHeaderInfo();
    renderSidebar();
    renderDashboard();
}

function updateHeaderInfo() {
    document.getElementById('current-user-name').textContent = state.currentUser.name;
    document.getElementById('current-user-role').textContent = state.currentUser.role === 'teacher' ? 'Admin' : `Aluno - Lvl ${state.currentUser.level}`;
    document.getElementById('user-avatar').textContent = state.currentUser.name.substring(0, 2).toUpperCase();
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar-nav');
    sidebar.innerHTML = '';
    
    const navItems = [];
    if (state.currentUser.role === 'teacher') {
        navItems.push(
            { id: 'dashboard', icon: 'layout-dashboard', label: 'Painel Geral' },
            { id: 'missions', icon: 'file-text', label: 'Missões & Diários' },
            { id: 'students', icon: 'users', label: 'Alunos & XP' }
        );
    } else {
        navItems.push(
            { id: 'dashboard', icon: 'layout-dashboard', label: 'Meu Painel' },
            { id: 'missions', icon: 'target', label: 'Missões Ativas' }
        );
    }
    
    navItems.forEach(item => {
        const btn = document.createElement('button');
        btn.className = `w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${state.currentView === item.id ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-slate-800 text-slate-300'}`;
        btn.innerHTML = `<i data-lucide="${item.icon}" class="w-5 h-5"></i> <span>${item.label}</span>`;
        btn.onclick = () => {
            state.currentView = item.id;
            renderSidebar();
            renderContent();
        };
        sidebar.appendChild(btn);
    });
    
    lucide.createIcons();
}

function renderContent() {
    if (state.currentUser.role === 'teacher') {
        if (state.currentView === 'dashboard') renderTeacherDashboard();
        else if (state.currentView === 'missions') renderTeacherMissions();
        else if (state.currentView === 'students') renderTeacherStudents();
    } else {
        if (state.currentView === 'dashboard') renderStudentDashboard();
        else if (state.currentView === 'missions') renderStudentMissions();
    }
    lucide.createIcons();
}

function renderDashboard() {
    state.currentView = 'dashboard';
    renderSidebar();
    renderContent();
}

// ============================================================================
// TEACHER VIEWS (SUPABASE)
// ============================================================================

async function renderTeacherDashboard() {
    const main = document.getElementById('main-content');
    
    const { count: studentsCount } = await supabaseClient.from('students').select('*', { count: 'exact', head: true });
    const { count: missionsCount } = await supabaseClient.from('missions').select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await supabaseClient.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    const { data: recentSubs } = await supabaseClient
        .from('submissions')
        .select('*, students(name), missions(title)')
        .order('created_at', { ascending: false })
        .limit(5);

    main.innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <h2 class="text-2xl font-bold text-white mb-6">Visão Geral da Turma</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div class="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                        <i data-lucide="users" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-white">${studentsCount || 0}</h3>
                    <p class="text-slate-400 text-sm">Alunos Ativos</p>
                </div>
                <div class="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div class="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                        <i data-lucide="file-text" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-white">${missionsCount || 0}</h3>
                    <p class="text-slate-400 text-sm">Missões Criadas</p>
                </div>
                <div class="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div class="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                        <i data-lucide="bell" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-white">${pendingCount || 0}</h3>
                    <p class="text-slate-400 text-sm">Entregas Pendentes</p>
                </div>
            </div>
            <h3 class="text-xl font-bold text-white mb-4">Últimas Entregas</h3>
            <div class="glass-panel rounded-2xl overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-800/50">
                            <th class="p-4 text-sm font-medium text-slate-300">Aluno</th>
                            <th class="p-4 text-sm font-medium text-slate-300">Missão</th>
                            <th class="p-4 text-sm font-medium text-slate-300">Status</th>
                            <th class="p-4 text-sm font-medium text-slate-300 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody id="dashboard-recent-activities">
                        <!-- Injected -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('dashboard-recent-activities');
    if (!recentSubs || recentSubs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-500">Nenhuma entrega recebida ainda.</td></tr>`;
    } else {
        recentSubs.forEach(sub => {
            const statusBadge = sub.status === 'pending' 
                ? '<span class="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-md text-xs font-medium">Pendente</span>'
                : '<span class="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-medium">Avaliado</span>';
            
            tbody.innerHTML += `
                <tr class="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td class="p-4 text-sm text-slate-200">${sub.students?.name || 'Desconhecido'}</td>
                    <td class="p-4 text-sm text-slate-400">${sub.missions?.title || 'Excluída'}</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 text-right">
                        <button onclick="gradeSubmission('${sub.id}')" class="text-primary hover:text-primary/80 font-medium text-sm">Ver e Avaliar</button>
                    </td>
                </tr>
            `;
        });
    }
}

async function renderTeacherMissions() {
    const main = document.getElementById('main-content');
    const { data: missions } = await supabaseClient.from('missions').select('*').order('created_at', { ascending: false });
    
    main.innerHTML = `
        <div class="animate__animated animate__fadeIn flex flex-col h-full">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-white">Gerenciar Missões</h2>
                <button onclick="openCreateMissionModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Nova Missão
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="missions-list"></div>
        </div>
    `;
    
    const list = document.getElementById('missions-list');
    if (!missions || missions.length === 0) {
        list.innerHTML = `<div class="col-span-2 text-center p-8 text-slate-500 glass-panel rounded-2xl">Nenhuma missão criada. Lembre-se de rodar o SQL para as missões iniciais do Plano.</div>`;
    } else {
        missions.forEach(m => {
            const typeLabel = m.type === 'diario' ? 'Diário de Leitura' : m.type === 'analise' ? 'Análise Crítica' : 'Leitura';
            const color = m.type === 'diario' ? 'text-emerald-400 bg-emerald-400/10' : m.type === 'analise' ? 'text-purple-400 bg-purple-400/10' : 'text-blue-400 bg-blue-400/10';
            
            list.innerHTML += `
                <div class="glass-panel p-5 rounded-2xl flex flex-col gap-3">
                    <div class="flex justify-between items-start">
                        <span class="text-xs font-medium px-2 py-1 rounded-md ${color}">${typeLabel}</span>
                        <div class="flex gap-2">
                            <button onclick="deleteMission('${m.id}')" class="text-slate-400 hover:text-red-400 transition-colors tooltip" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                    <h3 class="text-lg font-bold text-white">${m.title}</h3>
                    <p class="text-sm text-slate-400 line-clamp-3">${m.content}</p>
                </div>
            `;
        });
    }
    lucide.createIcons();
}

async function renderTeacherStudents() {
    const main = document.getElementById('main-content');
    const { data: students } = await supabaseClient.from('students').select('*').order('xp', { ascending: false });
    
    main.innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <h2 class="text-2xl font-bold text-white mb-6">Alunos & Desempenho</h2>
            <div class="glass-panel rounded-2xl overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-800/50">
                            <th class="p-4 text-sm font-medium text-slate-300">Aluno</th>
                            <th class="p-4 text-sm font-medium text-slate-300">Nível</th>
                            <th class="p-4 text-sm font-medium text-slate-300">XP Total</th>
                            <th class="p-4 text-sm font-medium text-slate-300 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="students-list"></tbody>
                </table>
            </div>
        </div>
    `;
    
    const list = document.getElementById('students-list');
    if (!students || students.length === 0) {
        list.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-500">Nenhum aluno registrado ainda.</td></tr>`;
    } else {
        students.forEach(s => {
            list.innerHTML += `
                <tr class="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td class="p-4 text-sm text-slate-200 font-medium flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border-2 border-primary">
                            ${s.name.substring(0,2).toUpperCase()}
                        </div>
                        ${s.name}
                    </td>
                    <td class="p-4">
                        <span class="px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold">Nível ${s.level}</span>
                    </td>
                    <td class="p-4 text-sm text-amber-400 font-bold">${s.xp} XP</td>
                    <td class="p-4 text-right">
                        <button onclick="removeStudent('${s.id}')" class="text-slate-400 hover:text-red-400 transition-colors tooltip" title="Remover">
                            <i data-lucide="user-minus" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    lucide.createIcons();
}

async function openCreateMissionModal() {
    const { value: formValues } = await Swal.fire({
        title: 'Criar Nova Missão',
        html: `
            <input id="swal-title" class="swal2-input !w-full !box-border !mx-0 !mb-4 bg-slate-900 border-slate-700 text-white" placeholder="Título da Missão">
            <select id="swal-type" class="swal2-select !w-full !box-border !mx-0 !mb-4 bg-slate-900 border-slate-700 text-white">
                <option value="diario">Diário de Leitura Crítica</option>
                <option value="analise">Análise Crítica de Texto</option>
                <option value="leitura">Leitura e Interpretação</option>
            </select>
            <textarea id="swal-content" class="swal2-textarea !w-full !box-border !mx-0 bg-slate-900 border-slate-700 text-white" placeholder="Instruções da Missão..." rows="4"></textarea>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Criar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                title: document.getElementById('swal-title').value,
                type: document.getElementById('swal-type').value,
                content: document.getElementById('swal-content').value
            }
        }
    });

    if (formValues && formValues.title) {
        await supabaseClient.from('missions').insert([{
            title: formValues.title,
            type: formValues.type,
            content: formValues.content
        }]);
        
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Missão Criada!', showConfirmButton: false, timer: 2000 });
        renderTeacherMissions();
    }
}

async function deleteMission(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Isso excluirá a missão e todas as submissões dos alunos relacionadas.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        await supabaseClient.from('missions').delete().eq('id', id);
        Swal.fire({toast:true, position:'top-end', icon:'success', title:'Excluída!', showConfirmButton:false, timer:1500});
        renderTeacherMissions();
    }
}

async function removeStudent(id) {
    const result = await Swal.fire({
        title: 'Remover Aluno?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        await supabaseClient.from('students').delete().eq('id', id);
        Swal.fire({toast:true, position:'top-end', icon:'success', title:'Aluno Removido!', showConfirmButton:false, timer:1500});
        renderTeacherStudents();
    }
}

async function gradeSubmission(subId) {
    const { data: sub } = await supabaseClient.from('submissions')
        .select('*, students(id, name, xp, level), missions(title)')
        .eq('id', subId)
        .single();
        
    if (!sub) return;
    
    const { value: formValues } = await Swal.fire({
        title: `Avaliar: ${sub.students.name}`,
        html: `
            <div class="text-left mb-4 p-4 bg-slate-900 rounded-lg border border-slate-800 text-sm overflow-y-auto max-h-40 text-slate-300">
                <strong class="text-white block mb-1">Missão: ${sub.missions.title}</strong>
                ${sub.content}
            </div>
            <label class="block text-left text-sm text-slate-400 mb-1">Feedback do Professor</label>
            <textarea id="swal-feedback" class="swal2-textarea !w-full !box-border !mx-0 !mb-4 bg-slate-900 border-slate-700 text-white" placeholder="Escreva seu feedback construtivo...">${sub.feedback || ''}</textarea>
            
            <label class="block text-left text-sm text-slate-400 mb-1">XP (Pontos - ex: 50)</label>
            <input type="number" id="swal-score" class="swal2-input !w-full !box-border !mx-0 bg-slate-900 border-slate-700 text-white" placeholder="50" value="${sub.score || 10}">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Salvar Avaliação',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                feedback: document.getElementById('swal-feedback').value,
                score: parseInt(document.getElementById('swal-score').value) || 0
            }
        }
    });

    if (formValues) {
        // Update Submission
        await supabaseClient.from('submissions').update({
            feedback: formValues.feedback,
            score: formValues.score,
            status: 'graded'
        }).eq('id', subId);
        
        // Add XP to student (only if it was pending before to avoid double xp, but for simplicity we just set the new level)
        // A robust system would check previous score difference. We'll just assume simple adding.
        const addXp = sub.status === 'pending' ? formValues.score : (formValues.score - sub.score);
        const newXp = sub.students.xp + addXp;
        const newLevel = Math.floor(newXp / 100) + 1;
        
        await supabaseClient.from('students').update({
            xp: newXp,
            level: newLevel
        }).eq('id', sub.students.id);
        
        Swal.fire({toast:true, position:'top-end', icon:'success', title:'Avaliação Salva!', showConfirmButton:false, timer:1500});
        renderContent();
    }
}

// ============================================================================
// STUDENT VIEWS (SUPABASE)
// ============================================================================

async function renderStudentDashboard() {
    const main = document.getElementById('main-content');
    
    // Refresh student data
    const { data: student } = await supabaseClient.from('students').select('*').eq('id', state.currentUser.id).single();
    if(student) {
        state.currentUser = { ...student, role: 'student' };
        updateHeaderInfo();
    }

    const { data: submissions } = await supabaseClient
        .from('submissions')
        .select('*, missions(title)')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
    
    const nextLevelXp = student.level * 100;
    const progress = (student.xp % 100) / 100 * 100;

    main.innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <div class="glass-panel p-8 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                <div class="absolute -right-10 -bottom-10 opacity-10"><i data-lucide="award" class="w-64 h-64"></i></div>
                <div class="w-32 h-32 rounded-full border-4 border-primary bg-slate-900 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(109,40,217,0.5)] z-10 relative">
                    <span class="text-4xl font-bold text-white">${student.level}</span>
                    <span class="text-xs font-bold text-primary tracking-widest uppercase mt-1">Nível</span>
                </div>
                <div class="flex-1 z-10">
                    <h2 class="text-3xl font-bold text-white mb-2">Olá, ${student.name}!</h2>
                    <p class="text-slate-300 mb-6 font-inter">Complete as missões para subir de nível e se tornar um Mestre da Leitura Crítica.</p>
                    <div class="w-full bg-slate-900 rounded-full h-4 mb-2 shadow-inner border border-slate-800">
                        <div class="bg-gradient-to-r from-primary to-accent h-4 rounded-full transition-all duration-1000 relative" style="width: ${progress}%">
                            <div class="absolute right-0 top-0 bottom-0 w-4 bg-white/20 blur-[2px] rounded-full"></div>
                        </div>
                    </div>
                    <div class="flex justify-between text-xs font-bold text-slate-400">
                        <span>${student.xp} XP Totais</span>
                        <span>Faltam ${nextLevelXp - student.xp} XP para Nível ${student.level + 1}</span>
                    </div>
                </div>
            </div>
            
            <h3 class="text-xl font-bold text-white mb-4">Suas Últimas Entregas</h3>
            <div class="glass-panel rounded-2xl overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-800/50">
                            <th class="p-4 text-sm font-medium text-slate-300">Missão</th>
                            <th class="p-4 text-sm font-medium text-slate-300">Status</th>
                            <th class="p-4 text-sm font-medium text-slate-300 text-right">XP Ganho</th>
                        </tr>
                    </thead>
                    <tbody id="student-recent-activities"></tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('student-recent-activities');
    if (!submissions || submissions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-slate-500">Você ainda não completou nenhuma missão.</td></tr>`;
    } else {
        submissions.slice(0, 5).forEach(sub => {
            const statusBadge = sub.status === 'pending' 
                ? '<span class="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-md text-xs font-medium"><i data-lucide="clock" class="inline w-3 h-3 mr-1"></i>Aguardando</span>'
                : '<span class="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-medium"><i data-lucide="check-circle" class="inline w-3 h-3 mr-1"></i>Avaliado</span>';
            
            tbody.innerHTML += `
                <tr class="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td class="p-4 text-sm text-slate-200">${sub.missions?.title || 'Missão Excluída'}</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 text-sm font-bold text-amber-400 text-right">${sub.status === 'graded' ? '+'+sub.score : '-'}</td>
                </tr>
            `;
        });
    }
    lucide.createIcons();
}

async function renderStudentMissions() {
    const main = document.getElementById('main-content');
    
    // Fetch all missions
    const { data: missions } = await supabaseClient.from('missions').select('*').order('created_at', { ascending: false });
    // Fetch student's submissions
    const { data: submissions } = await supabaseClient.from('submissions').select('*').eq('student_id', state.currentUser.id);
    
    main.innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <h2 class="text-2xl font-bold text-white mb-6">Missões Disponíveis</h2>
            <div class="grid grid-cols-1 gap-4" id="student-missions-list"></div>
        </div>
    `;
    
    const list = document.getElementById('student-missions-list');
    if (!missions || missions.length === 0) {
        list.innerHTML = `<div class="text-center p-8 text-slate-500 glass-panel rounded-2xl">Nenhuma missão liberada no momento.</div>`;
    } else {
        missions.forEach(m => {
            const sub = submissions?.find(s => s.mission_id === m.id);
            const typeLabel = m.type === 'diario' ? 'Diário de Leitura' : m.type === 'analise' ? 'Análise Crítica' : 'Leitura';
            const icon = m.type === 'diario' ? 'book-open' : m.type === 'analise' ? 'search' : 'file-text';
            
            let actionBtn = `<button onclick="doMission('${m.id}')" class="mt-4 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto">Realizar Missão</button>`;
            
            if (sub) {
                if (sub.status === 'pending') {
                    actionBtn = `<div class="mt-4 text-amber-400 text-sm font-medium flex items-center gap-2"><i data-lucide="clock" class="w-4 h-4"></i> Entregue! Aguardando avaliação.</div>`;
                } else {
                    actionBtn = `
                        <div class="mt-4 p-3 bg-slate-900 rounded-lg border border-green-500/30">
                            <div class="text-green-400 text-sm font-bold flex items-center gap-2 mb-2"><i data-lucide="check-circle" class="w-4 h-4"></i> Avaliado (+${sub.score} XP)</div>
                            <p class="text-sm text-slate-300 italic">" ${sub.feedback || 'Bom trabalho!'} "</p>
                        </div>
                    `;
                }
            }

            list.innerHTML += `
                <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <i data-lucide="${icon}" class="w-32 h-32"></i>
                    </div>
                    <div class="relative z-10">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="p-2 rounded-lg bg-slate-800 text-primary"><i data-lucide="${icon}" class="w-5 h-5"></i></span>
                            <span class="text-xs font-bold tracking-wider uppercase text-slate-400">${typeLabel}</span>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">${m.title}</h3>
                        <p class="text-sm text-slate-300 mb-4 font-inter leading-relaxed">${m.content}</p>
                        ${actionBtn}
                    </div>
                </div>
            `;
        });
    }
    lucide.createIcons();
}

async function doMission(missionId) {
    const { data: mission } = await supabaseClient.from('missions').select('*').eq('id', missionId).single();
    if(!mission) return;

    const { value: content } = await Swal.fire({
        title: mission.title,
        html: `
            <p class="text-sm text-slate-300 mb-4 text-left bg-slate-900 p-3 rounded-lg border border-slate-800">${mission.content}</p>
            <textarea id="swal-answer" class="swal2-textarea !w-full !box-border !mx-0 bg-slate-900 border-slate-700 text-white font-inter" placeholder="Escreva sua resposta ou reflexão aqui..." rows="6"></textarea>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Enviar Resposta',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'swal2-large' },
        preConfirm: () => {
            return document.getElementById('swal-answer').value;
        }
    });

    if (content && content.trim() !== '') {
        await supabaseClient.from('submissions').insert([{
            mission_id: mission.id,
            student_id: state.currentUser.id,
            content: content.trim(),
            status: 'pending'
        }]);
        
        Swal.fire({toast:true, position:'top-end', icon:'success', title:'Missão Entregue!', showConfirmButton:false, timer:1500});
        renderStudentMissions();
    }
}
