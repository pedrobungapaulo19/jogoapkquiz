// =======================================================================
// VARIÁVEIS GLOBAIS
// =======================================================================

// A variável quizData será preenchida dinamicamente pelo arquivo JSON
let quizData = {}; 

let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let selectedAnswer = null; 
let quizFinished = false;

let savedScore = 0;
let isMusicOn = true;
let currentVolume = 0.5;
const SAVED_SCORE_KEY = 'bungaTechSavedScore';
const SETTINGS_KEY = 'bungaTechSettings';
const musicAudio = document.getElementById('background-music');
// ⚠️ ATENÇÃO: VERIFIQUE se 'background_music.mp3' é o caminho correto no seu projeto.
musicAudio.src = 'background_music.mp3'; 

// =======================================================================
// FUNÇÕES DE CARREGAMENTO DE DADOS (Assíncrona)
// =======================================================================

async function loadQuizData() {
    try {
        const response = await fetch('perguntas.json'); 
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar perguntas.json: ${response.statusText}`);
        }
        
        return await response.json(); 
    } catch (error) {
        console.error("Erro fatal ao carregar os dados do Jogo:", error);
        return {}; 
    }
}

function createMateriaButtons() {
    const materiaOptionsDiv = document.querySelector('.materia-options');
    materiaOptionsDiv.innerHTML = ''; 

    Object.keys(quizData).forEach(materia => {
        const button = document.createElement('button');
        button.classList.add('materia-btn');
        // Capitaliza a primeira letra para exibição
        const materiaDisplay = materia.charAt(0).toUpperCase() + materia.slice(1);
        button.innerText = materiaDisplay;
        button.onclick = () => selectMateria(materia);
        materiaOptionsDiv.appendChild(button);
    });
}

// =======================================================================
// FUNÇÕES DE EXIBIÇÃO E CONFIGURAÇÃO (ATUALIZADAS PARA ÍCONES LOCAIS)
// =======================================================================

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'settings-screen' || screenId === 'result-screen') {
        loadSettings();
    }
}

// 🔑 CORRIGIDO: Agora manipula as tags <img> e <span> com IDs para alternar o ícone e o texto OFFLINE
function loadSettings() {
    const scoreFromStorage = localStorage.getItem(SAVED_SCORE_KEY);
    savedScore = scoreFromStorage ? parseInt(scoreFromStorage) : 0;
    
    const savedScoreDisplay = document.getElementById('saved-score-display');
    if (savedScoreDisplay) savedScoreDisplay.innerText = `${savedScore} Pontos`;
    
    const savedScoreResultElement = document.getElementById('saved-score-on-result');
    if (savedScoreResultElement) savedScoreResultElement.innerText = savedScore;

    const settingsFromStorage = localStorage.getItem(SETTINGS_KEY);
    if (settingsFromStorage) {
        const settings = JSON.parse(settingsFromStorage);
        isMusicOn = settings.isMusicOn !== undefined ? settings.isMusicOn : true;
        currentVolume = settings.volume !== undefined ? settings.volume : 0.5;
    }

    musicAudio.volume = currentVolume;
    
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.value = currentVolume;
        updateVolumeDisplay(currentVolume);
    }
    
    // Lógica para atualizar o ícone e texto do botão de música (USANDO IMAGENS LOCAIS)
    const musicIcon = document.getElementById('music-icon');
    const musicText = document.getElementById('music-text');

    if (musicIcon && musicText) {
        if (isMusicOn) {
            musicIcon.src = 'son.png';
            musicIcon.alt = 'Música Ligada';
            musicText.innerText = 'Música: Ligado';
        } else {
            musicIcon.src = 'sondesligado.png';
            musicIcon.alt = 'Música Desligada';
            musicText.innerText = 'Música: Desligado';
        }
    }
    
    if (isMusicOn && musicAudio.paused) {
        musicAudio.play().catch(e => console.log('Áudio bloqueado pelo navegador.'));
    } else if (!isMusicOn && !musicAudio.paused) {
        musicAudio.pause();
    }
}

function saveSettings() {
    localStorage.setItem(SAVED_SCORE_KEY, savedScore.toString());
    const settings = { isMusicOn: isMusicOn, volume: currentVolume };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function updateVolume(value) {
    currentVolume = parseFloat(value);
    musicAudio.volume = currentVolume;
    saveSettings(); 
    updateVolumeDisplay(currentVolume);
}

function updateVolumeDisplay(volume) {
    const percent = Math.round(volume * 100);
    const display = document.getElementById('volume-value-display');
    if (display) display.innerText = `${percent}%`;
}

// 🔑 CORRIGIDO: Agora manipula as tags <img> e <span> com IDs para alternar o ícone e o texto OFFLINE
function toggleMusic() {
    isMusicOn = !isMusicOn;
    const musicIcon = document.getElementById('music-icon');
    const musicText = document.getElementById('music-text');

    if (isMusicOn) {
        // Altera para ícone de música ligada
        if (musicIcon && musicText) {
            musicIcon.src = 'son.png';
            musicIcon.alt = 'Música Ligada';
            musicText.innerText = 'Música: Ligado';
        }
        musicAudio.play().catch(e => console.log('Não foi possível tocar o áudio.'));
    } else {
        // Altera para ícone de música desligada
        if (musicIcon && musicText) {
            musicIcon.src = 'sondesligado.png';
            musicIcon.alt = 'Música Desligada';
            musicText.innerText = 'Música: Desligado';
        }
        musicAudio.pause();
    }
    saveSettings(); 
}

function resetScoreConfirmation() {
    if (confirm("Tem certeza que deseja zerar seu recorde? Essa ação não pode ser desfeita.")) {
        resetScore();
    }
}

function resetScore() {
    savedScore = 0;
    saveSettings();
    document.getElementById('saved-score-display').innerText = '0 Pontos';
    alert("Recorde zerado com sucesso!");
}

// =======================================================================
// LÓGICA PRINCIPAL DO QUIZ
// =======================================================================

function selectMateria(materia) {
    currentQuestions = quizData[materia]; 
    const materiaDisplay = materia.charAt(0).toUpperCase() + materia.slice(1);
    document.getElementById('current-materia').innerText = `Matéria: ${materiaDisplay}`;
    currentQuestionIndex = 0;
    currentScore = 0;
    quizFinished = false;
    
    document.getElementById('total-questions').innerText = currentQuestions.length;
    document.getElementById('total-questions-result').innerText = currentQuestions.length;
    
    loadQuestion();
    showScreen('quiz-screen');
}

function loadQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    document.getElementById('question-index').innerText = currentQuestionIndex + 1;
    
    // Usa a chave 'pergunta' do JSON
    document.getElementById('question-text').innerText = question.pergunta; 
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Itera sobre 'opcoes' e passa o ÍNDICE do botão (i) e o ÍNDICE da resposta correta
    question.opcoes.forEach((opcao, i) => { 
        const button = document.createElement('button');
        button.classList.add('option-btn');
        button.innerText = opcao;
        
        // Passa o índice do botão (i) e o índice da resposta correta (question.resposta)
        button.onclick = () => selectAnswer(button, i, question.resposta); 
        optionsContainer.appendChild(button);
    });

    document.getElementById('next-question-btn').disabled = true;
    selectedAnswer = null;
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = false); 
}

function selectAnswer(button, selectedIndex, correctIndex) {
    if (quizFinished) return;
    
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    // Armazena os índices para checagem posterior
    selectedAnswer = { button, selectedIndex, correctIndex }; 
    document.getElementById('next-question-btn').disabled = false;
}

function checkAnswer() {
    if (!selectedAnswer) return;

    const { button, selectedIndex, correctIndex } = selectedAnswer; 
    
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

    // Compara o ÍNDICE clicado com o ÍNDICE correto
    if (selectedIndex === correctIndex) {
        button.classList.add('correct');
        currentScore++;
    } else {
        button.classList.add('wrong');
        
        // Encontra o botão correto usando o índice (correctIndex) e marca-o
        const correctButton = document.querySelectorAll('.option-btn')[correctIndex];
        if(correctButton) { 
            correctButton.classList.add('correct');
        } else {
             console.error("Índice de resposta inválido no JSON.");
        }
    }

    const nextBtn = document.getElementById('next-question-btn');
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.innerText = 'Ver Resultado';
    }
}

// 🔑 MANUTENÇÃO DA PAUSA: Pausa de 1.2 segundos para ver a resposta correta
function nextQuestion() {
    // 1. Aplica as cores (chama a função de verificação)
    checkAnswer();

    // Desabilita o botão 'Próxima' para evitar cliques múltiplos durante o delay
    document.getElementById('next-question-btn').disabled = true;

    // Adiciona um atraso de 1200 milissegundos (1.2 segundos) para ver a resposta correta
    setTimeout(() => {
        
        // Se for a última pergunta, vai para a tela de resultados
        if (currentQuestionIndex >= currentQuestions.length - 1) {
            finishQuiz();
            return;
        }
        
        // Próxima pergunta
        currentQuestionIndex++;
        loadQuestion();
        document.getElementById('next-question-btn').innerText = 'Próxima';
        
        // Reabilita o botão para a nova pergunta
        document.getElementById('next-question-btn').disabled = false;
        
    }, 1200); 
}

function finishQuiz() {
    quizFinished = true;
    document.getElementById('score-display').innerText = currentScore;
    
    if (currentScore > savedScore) {
        savedScore = currentScore; 
        saveSettings(); 
    }

    showScreen('result-screen');
}

// =======================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =======================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Carrega os dados antes de inicializar o resto
    quizData = await loadQuizData(); 
    
    if (Object.keys(quizData).length > 0) {
        createMateriaButtons(); 
    } else {
        // Exibe erro se não carregar o JSON
        document.getElementById('materia-select-screen').innerHTML = "<h2>Erro ao Carregar Dados</h2><p>Não foi possível carregar as perguntas do jogo. Verifique se o arquivo perguntas.json existe e está no formato JSON correto.</p>";
    }
    
    loadSettings(); 
});

// =======================================================================
// REGISTRO DO SERVICE WORKER (PARA OFFLINE)
// =======================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}