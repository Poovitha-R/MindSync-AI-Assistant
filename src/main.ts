import './index.css';
import { GoogleGenAI } from "@google/genai";

// --- State ---
let currentUserId: number | null = null;
let userRole: string = 'adult';
let userMindset: string = 'Neutral';
let userTasks: any[] = [];
let distractionCount = 0;

const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing from environment");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

// --- Elements ---
const pages = document.querySelectorAll('.page');
const btnLogin = document.getElementById('btn-login');
const loginUsername = document.getElementById('login-username') as HTMLInputElement;
const loginPassword = document.getElementById('login-password') as HTMLInputElement;
const video = document.getElementById('login-video') as HTMLVideoElement;
const btnScan = document.getElementById('btn-scan');
const btnToPage2 = document.getElementById('btn-to-page-2');
const mindsetResult = document.getElementById('mindset-result');
const detectedMindsetSpan = document.getElementById('detected-mindset');
const roleCards = document.querySelectorAll('.role-card');
const btnAddTask = document.getElementById('btn-add-task');
const taskList = document.getElementById('task-list');
const btnSaveTasks = document.getElementById('btn-save-tasks');
const moodBtns = document.querySelectorAll('.mood-btn-v2');
const btnAssignWork = document.getElementById('btn-assign-work');
const assignedTasksContainer = document.getElementById('assigned-tasks-container');
const btnToPage5 = document.getElementById('btn-to-page-5');
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const btnChatSend = document.getElementById('btn-chat-send');
const chatMessages = document.getElementById('chat-messages');
const backButtons = document.querySelectorAll('.btn-back');
const homeButtons = document.querySelectorAll('.btn-home');

// --- Navigation ---
function showPage(pageId: string) {
    pages.forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        if (pageId === 'page-face') startCamera();
    }
}

backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = (btn as HTMLElement).dataset.to;
        if (target) showPage(target);
    });
});

homeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        showPage('page-1');
    });
});

// --- Page 1: Login ---
btnLogin?.addEventListener('click', () => {
    const user = loginUsername.value;
    const pass = loginPassword.value;
    
    if (!user || !pass) return; // Silent return for professional feel, or could add subtle shake
    
    // Mock login success
    showPage('page-face');
});

// --- Page 1.5: Face Deduction ---
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error("Camera error:", err);
    }
}

btnScan?.addEventListener('click', () => {
    const mindsets = ['Optimal', 'Fatigued', 'Energetic', 'Bored', 'Stressed'];
    const randomMindset = mindsets[Math.floor(Math.random() * mindsets.length)];
    
    btnScan.textContent = "Analyzing...";
    btnScan.classList.add('opacity-50', 'pointer-events-none');
    
    setTimeout(() => {
        userMindset = randomMindset;
        detectedMindsetSpan!.textContent = randomMindset;
        mindsetResult?.classList.remove('hidden');
        mindsetResult?.classList.remove('scale-95', 'opacity-0');
        mindsetResult?.classList.add('scale-100', 'opacity-100');
        
        btnToPage2?.classList.remove('hidden');
        btnScan.textContent = "Analysis Complete";
        btnScan.classList.add('hidden');
    }, 2500);
});

btnToPage2?.addEventListener('click', () => showPage('page-2'));

// --- Page 2: Role Selection ---
roleCards.forEach(card => {
    card.addEventListener('click', async () => {
        userRole = (card as HTMLElement).dataset.role || 'adult';
        
        // Init user in DB
        const res = await fetch('/api/user/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: userRole, mindset: userMindset })
        });
        const data = await res.json();
        currentUserId = data.userId;
        
        showPage('page-3');
    });
});

// --- Page 3: Schedule Input ---
btnAddTask?.addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'task-entry flex flex-col md:flex-row gap-4 p-6 bg-stone-50 rounded-3xl border border-stone-200/60 group transition-all hover:bg-white hover:shadow-md';
    div.innerHTML = `
        <div class="flex-1 space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Objective Title</label>
            <input type="text" placeholder="e.g., Strategic Planning" class="task-title w-full p-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all text-sm">
        </div>
        <div class="md:w-48 space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Complexity</label>
            <select class="task-difficulty w-full p-4 bg-white border border-stone-200 rounded-2xl outline-none text-sm font-medium appearance-none cursor-pointer hover:border-stone-900 transition-colors">
                <option value="Easy">Low Complexity</option>
                <option value="Medium" selected>Medium Complexity</option>
                <option value="Hard">High Complexity</option>
            </select>
        </div>
    `;
    taskList?.appendChild(div);
});

async function runTaskAssignment() {
    if (!assignedTasksContainer) return;
    assignedTasksContainer.innerHTML = '';
    
    const displayMindset = document.getElementById('display-detected-mindset-inline');
    if (displayMindset) displayMindset.textContent = userMindset;

    if (!Array.isArray(userTasks) || userTasks.length === 0) {
        assignedTasksContainer.innerHTML = `
            <div class="p-20 bg-white rounded-[2.5rem] border border-dashed border-stone-200 text-center flex flex-col items-center justify-center">
                <p class="text-stone-400 text-sm font-medium italic">No objectives found. Please return and define your schedule.</p>
            </div>
        `;
        return;
    }

    // Intelligent logic based on camera-detected mindset
    userTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-3xl shadow-sm border border-stone-200/60 flex justify-between items-center group hover:shadow-md transition-all';
        
        let status = 'Recommended';
        const isHard = task.difficulty === 'Hard' || task.difficulty === 'Very Hard';
        const isEasy = task.difficulty === 'Easy';

        // Map camera mindsets to logic
        if (userMindset === 'Stressed') {
            if (isHard) status = 'Postpone';
            else if (isEasy) status = 'Quick Win';
            else status = 'Optional';
        } else if (userMindset === 'Fatigued' || userMindset === 'Bored') {
            if (isHard || task.difficulty === 'Medium') status = 'Postpone';
            else status = 'Recommended';
        } else if (userMindset === 'Energetic') {
            if (isHard) status = 'Priority';
            else status = 'Recommended';
        } else {
            // Optimal / Default
            status = 'Recommended';
        }

        const statusColors: Record<string, string> = {
            'Priority': 'bg-emerald-50 text-emerald-700 border-emerald-100',
            'Quick Win': 'bg-sky-50 text-sky-700 border-sky-100',
            'Postpone': 'bg-rose-50 text-rose-700 border-rose-100',
            'Optional': 'bg-amber-50 text-amber-700 border-amber-100',
            'Recommended': 'bg-stone-50 text-stone-500 border-stone-100'
        };

        const colorClass = statusColors[status] || 'bg-stone-50 text-stone-500 border-stone-100';

        card.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-2 h-2 rounded-full ${colorClass.split(' ')[0].replace('bg-', 'bg-').replace('-50', '-400')}"></div>
                <div>
                    <h4 class="font-medium text-stone-900 text-sm">${task.title}</h4>
                    <span class="text-[10px] text-stone-400 uppercase tracking-widest font-bold">${task.difficulty}</span>
                </div>
            </div>
            <span class="text-[9px] px-3 py-1.5 rounded-full border ${colorClass} font-bold uppercase tracking-wider">${status}</span>
        `;
        assignedTasksContainer.appendChild(card);
    });
}

btnSaveTasks?.addEventListener('click', async () => {
    const entries = document.querySelectorAll('.task-entry');
    const tasks: any[] = [];
    
    entries.forEach(entry => {
        const title = (entry.querySelector('.task-title') as HTMLInputElement).value;
        const difficulty = (entry.querySelector('.task-difficulty') as HTMLSelectElement).value;
        if (title.trim()) {
            tasks.push({ title, difficulty });
        }
    });
    
    if (tasks.length === 0) return alert("Please add at least one task");
    
    btnSaveTasks.textContent = "Saving...";
    try {
        const res = await fetch('/api/tasks/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: tasks, manual: true })
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        
        userTasks = data.tasks || [];
        
        // Automate assignment and move to next page
        await runTaskAssignment();
        showPage('page-4');
    } catch (err: any) {
        console.error("Save error:", err);
        alert("Failed to save tasks: " + err.message);
    } finally {
        btnSaveTasks.textContent = "Finalize Schedule";
    }
});

// --- Page 4: Mood Assignment (Automated) ---
btnToPage5?.addEventListener('click', () => {
    document.getElementById('user-display-role')!.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
    document.getElementById('user-display-mindset')!.textContent = userMindset;
    renderWorkspaceTasks();
    showPage('page-5');
});

// --- Page 5: Interactive Workspace Features ---

// 1. Interactive Tasks & Completion Progress
const workspaceTasksList = document.getElementById('workspace-tasks-list');
const completionCounter = document.getElementById('completion-counter');
const progressBarFill = document.getElementById('progress-bar-fill');

function renderWorkspaceTasks() {
    if (!workspaceTasksList) return;
    workspaceTasksList.innerHTML = '';

    if (!Array.isArray(userTasks) || userTasks.length === 0) {
        workspaceTasksList.innerHTML = `<p class="text-xs text-stone-400 italic text-center py-4">No objectives loaded.</p>`;
        if (completionCounter) completionCounter.textContent = '0/0';
        if (progressBarFill) progressBarFill.style.width = '0%';
        return;
    }

    let completedCount = 0;

    userTasks.forEach((task, index) => {
        if (task.completed) completedCount++;

        const item = document.createElement('div');
        item.className = `p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            task.completed 
                ? 'bg-stone-50 border-stone-200 opacity-60' 
                : 'bg-stone-50/50 hover:bg-stone-50 border-stone-200/60 shadow-sm'
        }`;

        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-5 h-5 rounded-lg border-2 border-stone-400 flex items-center justify-center transition-colors ${
                    task.completed ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white'
                }">
                    ${task.completed ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                </div>
                <span class="text-xs font-medium text-stone-900 ${task.completed ? 'line-through text-stone-400' : ''}">${task.title}</span>
            </div>
            <span class="text-[9px] font-bold uppercase tracking-wider text-stone-400 bg-white px-2 py-0.5 rounded-md border border-stone-200/80">${task.difficulty}</span>
        `;

        item.addEventListener('click', () => {
            userTasks[index].completed = !userTasks[index].completed;
            renderWorkspaceTasks();
        });

        workspaceTasksList.appendChild(item);
    });

    const total = userTasks.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    if (completionCounter) completionCounter.textContent = `${completedCount}/${total}`;
    if (progressBarFill) progressBarFill.style.width = `${pct}%`;
}

// 2. Focus Timer (25 Min Pomodoro Engine)
let timerSeconds = 25 * 60;
let timerRunning = false;
let timerInterval: any = null;

const timerDisplay = document.getElementById('timer-display');
const btnTimerToggle = document.getElementById('btn-timer-toggle');
const btnTimerReset = document.getElementById('btn-timer-reset');
const timerBtnText = document.getElementById('timer-btn-text');

function updateTimerDisplay() {
    if (!timerDisplay) return;
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

btnTimerToggle?.addEventListener('click', () => {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        if (timerBtnText) timerBtnText.textContent = "Resume Focus";
    } else {
        timerRunning = true;
        if (timerBtnText) timerBtnText.textContent = "Pause Session";
        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                if (timerBtnText) timerBtnText.textContent = "Session Complete";
                alert("Flow session complete! Take a short cognitive break.");
            }
        }, 1000);
    }
});

btnTimerReset?.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 25 * 60;
    updateTimerDisplay();
    if (timerBtnText) timerBtnText.textContent = "Start Focus";
});

// 3. Focus Audio Synthesizer (Web Audio API)
let audioCtx: AudioContext | null = null;
let soundNodes: any[] = [];

const soundBtns = document.querySelectorAll('.btn-sound');

function stopFocusAudio() {
    soundNodes.forEach(node => {
        try { node.stop(); node.disconnect(); } catch (e) {}
    });
    soundNodes = [];
}

function playFocusAudio(type: string) {
    stopFocusAudio();
    if (type === 'none') return;

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (type === 'binaural') {
        // Soothing 200Hz left + 210Hz right (10Hz Alpha wave difference for focus)
        const oscL = audioCtx.createOscillator();
        const oscR = audioCtx.createOscillator();
        const merger = audioCtx.createChannelMerger(2);
        const gain = audioCtx.createGain();

        oscL.frequency.value = 200;
        oscR.frequency.value = 210;
        gain.gain.value = 0.08; // Gentle volume

        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(gain);
        gain.connect(audioCtx.destination);

        oscL.start();
        oscR.start();
        soundNodes.push(oscL, oscR);
    } else if (type === 'rain') {
        // Low-pass filtered pink/white noise for ambient focus
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Deep soothing tone

        const gain = audioCtx.createGain();
        gain.gain.value = 0.05;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        noise.start();
        soundNodes.push(noise);
    }
}

soundBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        soundBtns.forEach(b => {
            b.classList.remove('bg-stone-900', 'text-white', 'active');
            b.classList.add('bg-stone-50', 'text-stone-600');
        });
        btn.classList.add('bg-stone-900', 'text-white', 'active');
        btn.classList.remove('bg-stone-50', 'text-stone-600');

        const soundType = (btn as HTMLElement).dataset.sound || 'none';
        playFocusAudio(soundType);
    });
});

// 4. Cognitive Reset (Box Breathing Modal)
const btnOpenBreathing = document.getElementById('btn-open-breathing');
const btnCloseBreathing = document.getElementById('btn-close-breathing');
const modalBreathing = document.getElementById('modal-breathing');
const btnToggleBreathing = document.getElementById('btn-toggle-breathing-cycle');
const breathingRing = document.getElementById('breathing-ring');
const breathingPhase = document.getElementById('breathing-phase');
const breathingCountdown = document.getElementById('breathing-countdown');

let breathingActive = false;
let breathingTimer: any = null;

btnOpenBreathing?.addEventListener('click', () => modalBreathing?.classList.remove('hidden'));
btnCloseBreathing?.addEventListener('click', () => {
    modalBreathing?.classList.add('hidden');
    stopBreathing();
});

function stopBreathing() {
    breathingActive = false;
    clearInterval(breathingTimer);
    if (btnToggleBreathing) btnToggleBreathing.textContent = "Begin 1-Minute Reset";
    if (breathingPhase) breathingPhase.textContent = "Inhale";
    if (breathingCountdown) breathingCountdown.textContent = "4";
    if (breathingRing) breathingRing.className = "absolute inset-0 rounded-full border-4 border-stone-900/10 transition-all duration-1000 transform scale-75";
}

btnToggleBreathing?.addEventListener('click', () => {
    if (breathingActive) {
        stopBreathing();
        return;
    }

    breathingActive = true;
    if (btnToggleBreathing) btnToggleBreathing.textContent = "Stop Reset";

    const phases = [
        { name: 'Inhale', duration: 4, scale: 'scale-110 border-stone-900' },
        { name: 'Hold', duration: 4, scale: 'scale-110 border-stone-900/80 bg-stone-900/5' },
        { name: 'Exhale', duration: 4, scale: 'scale-75 border-stone-400' },
        { name: 'Hold', duration: 4, scale: 'scale-75 border-stone-300' }
    ];

    let currentPhaseIdx = 0;
    let countInPhase = 4;

    const runStep = () => {
        const p = phases[currentPhaseIdx];
        if (breathingPhase) breathingPhase.textContent = p.name;
        if (breathingCountdown) breathingCountdown.textContent = countInPhase.toString();
        if (breathingRing) breathingRing.className = `absolute inset-0 rounded-full border-4 transition-all duration-1000 transform ${p.scale}`;

        countInPhase--;
        if (countInPhase < 1) {
            currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
            countInPhase = 4;
        }
    };

    runStep();
    breathingTimer = setInterval(runStep, 1000);
});

// 5. Session Report Export
const btnExportReport = document.getElementById('btn-export-report');

btnExportReport?.addEventListener('click', () => {
    const completedTasks = userTasks.filter(t => t.completed).length;
    const totalTasks = userTasks.length;

    const reportContent = `
===============================================
       MINDSYNC COGNITIVE EXECUTIVE REPORT     
===============================================
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

USER PROFILE & METRICS:
-----------------------
Profile Role: ${userRole.toUpperCase()}
Biometric Scan Mindset: ${userMindset}
Active Status: Optimized

OBJECTIVES SUMMARY:
-------------------
Completed Objectives: ${completedTasks} / ${totalTasks}
Completion Rate: ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%

DETAILED OBJECTIVES LIST:
${userTasks.map((t, i) => `${i + 1}. [${t.completed ? 'X' : ' '}] ${t.title} (${t.difficulty})`).join('\n') || 'No tasks entered.'}

RECOMMENDATION SUMMARY:
MindSync recommends maintaining cognitive focus intervals with 5-minute structured recovery breaks.
===============================================
Generated by MindSync v2.4 Intelligence Engine
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MindSync_Executive_Report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});

// --- Page 5: Dashboard & Chat ---
btnChatSend?.addEventListener('click', async () => {
    const msg = chatInput.value;
    if (!msg) return;
    
    // Add user message
    const userDiv = document.createElement('div');
    userDiv.className = 'bg-stone-900 text-white p-6 rounded-[2rem] rounded-tr-none ml-auto max-w-[85%] shadow-sm text-sm leading-relaxed';
    userDiv.textContent = msg;
    chatMessages?.appendChild(userDiv);
    chatInput.value = '';
    
    chatMessages?.scrollTo(0, chatMessages.scrollHeight);
    
    try {
        const ai = getAI();
        if (!ai) throw new Error("AI not configured");

        const completedTasksCount = userTasks.filter(t => t.completed).length;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: msg,
            config: {
                systemInstruction: `You are MindSync, a sophisticated and highly professional AI productivity assistant. 
                The user is currently in a ${userRole} role. 
                Their detected mindset is ${userMindset}.
                They currently have ${completedTasksCount} of ${userTasks.length} objectives completed.
                Provide concise, actionable, and intellectually stimulating advice to help them stay focused or manage their current cognitive load. 
                If they are fatigued or bored, suggest scientifically-backed recovery strategies or low-complexity tasks. 
                If they are energetic, encourage them to enter a flow state with their highest complexity objectives.
                Always be supportive, professional, and maintain a high-end, executive tone.`
            }
        });
        
        const aiWrapper = document.createElement('div');
        aiWrapper.className = 'flex gap-4 max-w-[85%]';
        aiWrapper.innerHTML = `
            <div class="w-8 h-8 rounded-xl bg-stone-100 flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
            <div class="bg-stone-50 p-6 rounded-[2rem] rounded-tl-none shadow-sm border border-stone-100 text-stone-700 leading-relaxed text-sm">
                ${response.text || "I'm sorry, I couldn't generate a response."}
            </div>
        `;
        chatMessages?.appendChild(aiWrapper);
    } catch (err) {
        console.error("Chat error:", err);
        const errDiv = document.createElement('div');
        errDiv.className = 'bg-rose-50 p-6 rounded-[2rem] rounded-tl-none max-w-[85%] text-rose-700 text-sm border border-rose-100';
        errDiv.textContent = "I apologize, but I've encountered a connection interruption. Please verify your network status.";
        chatMessages?.appendChild(errDiv);
    }
    
    chatMessages?.scrollTo(0, chatMessages.scrollHeight);
});

// Start
startCamera();
showPage('page-1');
