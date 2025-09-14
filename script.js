// Mock Recipe Data
const recipeData = {
    pizza: {
        title: "Homemade Pizza",
        originalImage: "assets/samples/pizza.jpg",
        steps: [
            {
                id: 1,
                title: "Preheat",
                image: "assets/steps/preheat.png",
                audio: "assets/audio/preheat.mp3",
                instruction: "Preheat oven to 450°F"
            },
            {
                id: 2,
                title: "Roll Dough",
                image: "assets/steps/dough.png",
                audio: "assets/audio/roll-dough.mp3",
                instruction: "Roll out pizza dough on floured surface"
            },
            {
                id: 3,
                title: "Add Sauce",
                image: "assets/steps/sauce.png",
                audio: "assets/audio/add-sauce.mp3",
                instruction: "Spread tomato sauce evenly"
            },
            {
                id: 4,
                title: "Add Cheese",
                image: "assets/steps/cheese.png",
                audio: "assets/audio/add-cheese.mp3",
                instruction: "Sprinkle mozzarella cheese generously"
            },
            {
                id: 5,
                title: "Add Toppings",
                image: "assets/steps/toppings.png",
                audio: "assets/audio/add-toppings.mp3",
                instruction: "Add your favorite toppings"
            },
            {
                id: 6,
                title: "Bake",
                image: "assets/steps/bake.png",
                audio: "assets/audio/bake.mp3",
                instruction: "Bake for 12-15 minutes until golden"
            }
        ]
    },
    coffee: {
        title: "Perfect Coffee",
        originalImage: "assets/samples/coffee.jpg",
        steps: [
            {
                id: 1,
                title: "Boil Water",
                image: "assets/steps/boil.png",
                audio: "assets/audio/boil-water.mp3",
                instruction: "Boil water to 200°F"
            },
            {
                id: 2,
                title: "Grind Beans",
                image: "assets/steps/grind.png",
                audio: "assets/audio/grind-beans.mp3",
                instruction: "Grind coffee beans to medium coarse"
            },
            {
                id: 3,
                title: "Add Coffee",
                image: "assets/steps/add-coffee.png",
                audio: "assets/audio/add-coffee.mp3",
                instruction: "Add ground coffee to filter"
            },
            {
                id: 4,
                title: "Pour & Enjoy",
                image: "assets/steps/pour.png",
                audio: "assets/audio/pour-enjoy.mp3",
                instruction: "Pour hot water slowly and enjoy"
            }
        ]
    },
    sandwich: {
        title: "Gourmet Sandwich",
        originalImage: "assets/samples/sandwich.jpg",
        steps: [
            {
                id: 1,
                title: "Toast Bread",
                image: "assets/steps/toast.png",
                audio: "assets/audio/toast-bread.mp3",
                instruction: "Toast bread slices until golden"
            },
            {
                id: 2,
                title: "Add Spread",
                image: "assets/steps/spread.png",
                audio: "assets/audio/add-spread.mp3",
                instruction: "Apply mayo or mustard"
            },
            {
                id: 3,
                title: "Layer Meat",
                image: "assets/steps/meat.png",
                audio: "assets/audio/layer-meat.mp3",
                instruction: "Add sliced turkey or ham"
            },
            {
                id: 4,
                title: "Add Veggies",
                image: "assets/steps/veggies.png",
                audio: "assets/audio/add-veggies.mp3",
                instruction: "Layer lettuce, tomato, and cheese"
            },
            {
                id: 5,
                title: "Assemble",
                image: "assets/steps/assemble.png",
                audio: "assets/audio/assemble.mp3",
                instruction: "Close sandwich and cut diagonally"
            }
        ]
    }
};

// Mock Analysis Data
const analysisData = {
    good: {
        scores: { color: 5, texture: 4, ingredients: 5, presentation: 4, portion: 4 },
        feedback: "Excellent work! Your pizza looks delicious with perfect golden color and great cheese coverage.",
        audioFile: "assets/audio/feedback-excellent.mp3"
    },
    okay: {
        scores: { color: 3, texture: 4, ingredients: 3, presentation: 3, portion: 4 },
        feedback: "Good effort! Try adding more cheese next time and watch the oven temperature for better color.",
        audioFile: "assets/audio/feedback-good.mp3"
    },
    poor: {
        scores: { color: 2, texture: 2, ingredients: 2, presentation: 2, portion: 3 },
        feedback: "Keep practicing! The crust needs more time and try spreading ingredients more evenly.",
        audioFile: "assets/audio/feedback-practice.mp3"
    }
};

// Global Variables
let currentRecipe = null;
let currentAnalysis = null;
let audioPlayer = null;
let currentPlayingStep = null;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    audioPlayer = document.getElementById('audio-player');
    setupEventListeners();
    createPlaceholderAssets();
}

function setupEventListeners() {
    // Upload area interactions
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const resultUploadArea = document.getElementById('result-upload-area');
    const resultFileInput = document.getElementById('result-file-input');

    // Main upload area
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Result upload area
    resultUploadArea.addEventListener('click', () => resultFileInput.click());
    resultUploadArea.addEventListener('dragover', handleDragOver);
    resultUploadArea.addEventListener('drop', handleResultDrop);
    resultFileInput.addEventListener('change', handleResultFileSelect);

    // Sample image clicks
    document.querySelectorAll('.sample-img').forEach(img => {
        img.addEventListener('click', (e) => {
            const recipe = e.target.dataset.recipe;
            loadRecipe(recipe);
        });
    });

    // Sample result clicks
    document.querySelectorAll('.sample-result').forEach(img => {
        img.addEventListener('click', (e) => {
            const quality = e.target.dataset.quality;
            analyzeResult(quality, e.target.src);
        });
    });

    // Navigation buttons
    document.getElementById('back-to-upload').addEventListener('click', () => showPage('upload-page'));
    document.getElementById('back-to-steps').addEventListener('click', () => showPage('steps-page'));
    document.getElementById('back-to-result').addEventListener('click', () => showPage('result-upload-page'));
    document.getElementById('upload-result-btn').addEventListener('click', () => showPage('result-upload-page'));
    document.getElementById('start-over').addEventListener('click', () => showPage('upload-page'));

    // Feedback button
    document.getElementById('play-feedback').addEventListener('click', playFeedback);

    // Audio ended event
    audioPlayer.addEventListener('ended', () => {
        if (currentPlayingStep) {
            currentPlayingStep.classList.remove('playing');
            currentPlayingStep = null;
        }
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processImageFile(files[0]);
    }
}

function handleResultDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processResultFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function handleResultFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processResultFile(file);
    }
}

function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    showLoading('Analyzing your image...');

    // Simulate AI processing
    setTimeout(() => {
        // Mock AI: determine recipe based on filename or random
        const recipes = Object.keys(recipeData);
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        loadRecipe(randomRecipe);
        hideLoading();
    }, 2000);
}

function processResultFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        showLoading('Analyzing your result...');

        // Simulate AI analysis
        setTimeout(() => {
            const qualities = ['good', 'okay', 'poor'];
            const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
            analyzeResult(randomQuality, e.target.result);
            hideLoading();
        }, 3000);
    };
    reader.readAsDataURL(file);
}

function loadRecipe(recipeKey) {
    currentRecipe = recipeData[recipeKey];
    if (!currentRecipe) return;

    document.getElementById('recipe-title').textContent = currentRecipe.title;
    generateStepsGrid();
    showPage('steps-page');
}

function generateStepsGrid() {
    const stepsGrid = document.getElementById('steps-grid');
    stepsGrid.innerHTML = '';

    currentRecipe.steps.forEach((step, index) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'step-card';
        stepCard.innerHTML = `
            <div class="step-number">${step.id}</div>
            <img src="${step.image}" alt="${step.title}" class="step-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNjY3ZWVhIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3RlcCAke3N0ZXAuaWR9PC90ZXh0Pgo8L3N2Zz4K'">
            <div class="step-title">${step.title}</div>
            <div class="audio-icon">🔊</div>
        `;

        stepCard.addEventListener('click', () => playStepAudio(step, stepCard));
        stepsGrid.appendChild(stepCard);
    });
}

function playStepAudio(step, stepCard) {
    // Stop current audio if playing
    if (currentPlayingStep) {
        currentPlayingStep.classList.remove('playing');
        audioPlayer.pause();
    }

    // Set new playing step
    currentPlayingStep = stepCard;
    stepCard.classList.add('playing');

    // Try to play audio file, fallback to speech synthesis
    audioPlayer.src = step.audio;
    audioPlayer.play().catch(() => {
        // Fallback to text-to-speech
        speakText(step.instruction);
    });
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        utterance.onend = () => {
            if (currentPlayingStep) {
                currentPlayingStep.classList.remove('playing');
                currentPlayingStep = null;
            }
        };

        speechSynthesis.speak(utterance);
    } else {
        // If no speech synthesis, just show visual feedback
        setTimeout(() => {
            if (currentPlayingStep) {
                currentPlayingStep.classList.remove('playing');
                currentPlayingStep = null;
            }
        }, 2000);
    }
}

function analyzeResult(quality, imageUrl) {
    currentAnalysis = analysisData[quality];

    // Set comparison images
    document.getElementById('original-image').src = currentRecipe.originalImage;
    document.getElementById('result-image').src = imageUrl;

    // Generate radar chart
    generateRadarChart(currentAnalysis.scores);

    // Generate score details
    generateScoreDetails(currentAnalysis.scores);

    showPage('analysis-page');
}

function generateRadarChart(scores) {
    const ctx = document.getElementById('radar-chart').getContext('2d');

    // Destroy existing chart if it exists
    if (window.radarChart) {
        window.radarChart.destroy();
    }

    window.radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Color', 'Texture', 'Ingredients', 'Presentation', 'Portion'],
            datasets: [{
                label: 'Your Score',
                data: [scores.color, scores.texture, scores.ingredients, scores.presentation, scores.portion],
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function generateScoreDetails(scores) {
    const scoreGrid = document.getElementById('score-details');
    scoreGrid.innerHTML = '';

    Object.entries(scores).forEach(([category, score]) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';

        let scoreClass = 'score-poor';
        if (score >= 4) scoreClass = 'score-excellent';
        else if (score >= 3) scoreClass = 'score-good';

        scoreItem.innerHTML = `
            <div class="score-label">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            <div class="score-value ${scoreClass}">${score}/5</div>
        `;

        scoreGrid.appendChild(scoreItem);
    });
}

function playFeedback() {
    if (!currentAnalysis) return;

    // Try to play audio file, fallback to speech synthesis
    audioPlayer.src = currentAnalysis.audioFile;
    audioPlayer.play().catch(() => {
        speakText(currentAnalysis.feedback);
    });
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    document.getElementById(pageId).classList.add('active');
}

function showLoading(text) {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

function createPlaceholderAssets() {
    // Create placeholder images using data URLs for demo
    const placeholderImages = {
        'assets/samples/pizza.jpg': createPlaceholderImage('🍕', 'Pizza'),
        'assets/samples/coffee.jpg': createPlaceholderImage('☕', 'Coffee'),
        'assets/samples/sandwich.jpg': createPlaceholderImage('🥪', 'Sandwich'),
        'assets/results/pizza-good.jpg': createPlaceholderImage('🍕✨', 'Great Pizza'),
        'assets/results/pizza-okay.jpg': createPlaceholderImage('🍕👍', 'Good Pizza'),
        'assets/results/pizza-poor.jpg': createPlaceholderImage('🍕😅', 'Practice Pizza')
    };

    // Update image sources
    Object.entries(placeholderImages).forEach(([path, dataUrl]) => {
        document.querySelectorAll(`img[src="${path}"]`).forEach(img => {
            img.src = dataUrl;
        });
    });

    // Update recipe data with placeholder images
    Object.values(recipeData).forEach(recipe => {
        recipe.steps.forEach(step => {
            step.image = createStepPlaceholder(step.title, step.id);
        });
    });
}

function createPlaceholderImage(emoji, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, 200, 200);

    // Emoji
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, 100, 100);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(text, 100, 150);

    return canvas.toDataURL();
}

function createStepPlaceholder(title, stepNumber) {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, 80, 80);

    // Step number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(stepNumber, 40, 35);

    // Title
    ctx.font = '10px Arial';
    ctx.fillText(title, 40, 55);

    return canvas.toDataURL();
}

// Utility function to handle image loading errors
function handleImageError(img) {
    img.src = createPlaceholderImage('🖼️', 'Image');
}
