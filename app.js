/**
 * Main application logic
 */

// Define handlePrediction early so it's available for inline onclick handlers
// Use a different name first, then assign to window.handlePrediction to avoid conflicts
window.handlePredictionFull = function handlePrediction() {
    // Check if predictor exists (will be defined later in the script)
    if (typeof predictor === 'undefined') {
        window.predictor = null;
    }
    
    // Initialize predictor if it's not loaded yet
    if (!window.predictor) {
        window.predictor = new MovieRevenuePredictor(modelParams);
    }

    // Get input values
    const genre = document.getElementById('genre');
    const votesInput = document.getElementById('votes');
    const ratingInput = document.getElementById('rating');
    const runtimeInput = document.getElementById('runtime');
    const metascoreInput = document.getElementById('metascore');
    
    const genreValue = genre.value;
    const votes = parseInt(votesInput.value);
    const rating = parseFloat(ratingInput.value);
    const runtime = parseInt(runtimeInput.value);
    const metascore = parseInt(metascoreInput.value);
    
    // Make prediction
    const predictedRevenue = window.predictor.predict(votes, rating, runtime, metascore, genreValue);
    
    // Display result
    if (typeof displayPrediction === 'function') {
        displayPrediction(predictedRevenue, genreValue, rating, votes, runtime, metascore);
    } else {
        // Fallback display if function not loaded yet
        const resultDiv = document.getElementById('prediction-result');
        resultDiv.innerHTML = `<div class="prediction-label">Predicted Box Office Revenue</div><div class="prediction-value">$${predictedRevenue.toFixed(2)}M</div>`;
    }
};

// Assign to window.handlePrediction after defining (replace stub if it exists)
if (typeof window.handlePrediction === 'function') {
    // Replace the stub with the real function
    window.handlePrediction = window.handlePredictionFull;
} else {
    window.handlePrediction = window.handlePredictionFull;
}

let predictor = null;
// Note: dataRanges is declared in data_ranges.js, don't redeclare it here
let autoPredictTimeout = null; // For debouncing auto-predictions

// Fallback genres in case data_ranges.js doesn't load
const FALLBACK_GENRES = [
    "Action",
    "Adventure",
    "Animation",
    "Biography",
    "Comedy",
    "Crime",
    "Drama",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller"
];

// Initialize the application
function initializeApp() {
    // Load model parameters and data ranges
    // These will be loaded from the exported JSON files
    if (typeof modelParams !== 'undefined' && modelParams) {
        predictor = new MovieRevenuePredictor(modelParams);
        window.predictor = predictor; // Also store in window for global access
    }

    // Get genres from dataRanges, fallback to FALLBACK_GENRES
    let genresToUse = FALLBACK_GENRES;
    let rangesToUse = null;

    if (typeof dataRanges !== 'undefined' && dataRanges) {
        rangesToUse = dataRanges;
        
        if (dataRanges.genres && Array.isArray(dataRanges.genres) && dataRanges.genres.length > 0) {
            genresToUse = dataRanges.genres;
        }
    }

    // Always populate genres (either from dataRanges or fallback)
    populateGenres(genresToUse);

    // Update sliders if we have ranges (they're already initialized, but update with correct values)
    if (rangesToUse) {
        setupSliders(rangesToUse);
    }
    // Note: Event listeners are already set up in DOMContentLoaded, but ensure they're still there
    setupEventListeners();
}

// Populate genres immediately - don't wait for anything
function populateGenresNow() {
    const genreSelect = document.getElementById('genre');
    
    // Check if genres are already in HTML (hardcoded)
    const hasGenresInHTML = genreSelect.options.length > 1 && 
                            genreSelect.options[0].textContent !== 'Loading...' &&
                            genreSelect.options[0].textContent !== 'Select Genre...';
    
    if (hasGenresInHTML) {
        return;
    }
    
    // Use dataRanges if available, otherwise use fallback
    let genresToUse = FALLBACK_GENRES;
    if (typeof dataRanges !== 'undefined' && dataRanges && dataRanges.genres && Array.isArray(dataRanges.genres) && dataRanges.genres.length > 0) {
        genresToUse = dataRanges.genres;
    }
    
    populateGenres(genresToUse);
}

// Wait for DOM and scripts to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Populate genres immediately - don't wait for anything
    populateGenresNow();
    
    // Initialize sliders immediately with default values (don't wait for data_ranges.js)
    setupSlidersWithDefaults();
    
    // Setup event listeners immediately
    setupEventListeners();
    
    // Then try to initialize the rest of the app (model, etc.)
    setTimeout(function() {
        initializeApp();
        // Make an initial prediction after everything is loaded
        setTimeout(function() {
            if (predictor || (typeof modelParams !== 'undefined' && typeof MovieRevenuePredictor !== 'undefined')) {
                if (typeof window.handlePrediction === 'function') {
                    window.handlePrediction();
                } else if (typeof window.handlePredictionFull === 'function') {
                    window.handlePredictionFull();
                }
            }
        }, 500);
    }, 100);
});

// Also try when window is fully loaded as a backup
window.addEventListener('load', function() {
    // Double-check genres are populated
    const genreSelect = document.getElementById('genre');
    if (genreSelect && (genreSelect.options.length <= 1 || genreSelect.options[0].value === '')) {
        populateGenresNow();
    }
});

// One more safety check - run after a short delay
setTimeout(function() {
    const genreSelect = document.getElementById('genre');
    if (genreSelect && (genreSelect.options.length <= 1 || genreSelect.options[0].value === '')) {
        populateGenresNow();
    }
}, 500);

// Setup sliders with default ranges (called immediately)
function setupSlidersWithDefaults() {
    const defaultRanges = {
        votes_range: [178, 1791916, 190970],
        rating_range: [1.9, 9.0, 6.8],
        runtime_range: [66, 191, 114],
        metascore_range: [11, 100, 59]
    };
    setupSliders(defaultRanges);
}

function setupSliders(ranges) {
    if (!ranges) {
        setupSlidersWithDefaults();
        return;
    }
    
    // Setup votes slider
    const votesSlider = document.getElementById('votes');
    const votesValue = document.getElementById('votes-value');
    if (votesSlider && votesValue) {
        votesSlider.min = ranges.votes_range[0];
        votesSlider.max = ranges.votes_range[1];
        votesSlider.value = ranges.votes_range[2];
        votesValue.textContent = formatNumber(ranges.votes_range[2]);
        
        // Remove existing listeners and add new one
        votesSlider.oninput = function() {
            votesValue.textContent = formatNumber(this.value);
            autoPredict(); // Auto-update prediction
        };
    }

    // Setup rating slider
    const ratingSlider = document.getElementById('rating');
    const ratingValue = document.getElementById('rating-value');
    if (ratingSlider && ratingValue) {
        ratingSlider.min = ranges.rating_range[0];
        ratingSlider.max = ranges.rating_range[1];
        ratingSlider.value = ranges.rating_range[2];
        ratingValue.textContent = ranges.rating_range[2].toFixed(1);
        
        ratingSlider.oninput = function() {
            ratingValue.textContent = parseFloat(this.value).toFixed(1);
            autoPredict(); // Auto-update prediction
        };
    }

    // Setup runtime slider
    const runtimeSlider = document.getElementById('runtime');
    const runtimeValue = document.getElementById('runtime-value');
    if (runtimeSlider && runtimeValue) {
        runtimeSlider.min = ranges.runtime_range[0];
        runtimeSlider.max = ranges.runtime_range[1];
        runtimeSlider.value = ranges.runtime_range[2];
        runtimeValue.textContent = ranges.runtime_range[2];
        
        runtimeSlider.oninput = function() {
            runtimeValue.textContent = this.value;
            autoPredict(); // Auto-update prediction
        };
    }

    // Setup metascore slider
    const metascoreSlider = document.getElementById('metascore');
    const metascoreValue = document.getElementById('metascore-value');
    if (metascoreSlider && metascoreValue) {
        metascoreSlider.min = ranges.metascore_range[0];
        metascoreSlider.max = ranges.metascore_range[1];
        metascoreSlider.value = ranges.metascore_range[2];
        metascoreValue.textContent = ranges.metascore_range[2];
        
        metascoreSlider.oninput = function() {
            metascoreValue.textContent = this.value;
            autoPredict(); // Auto-update prediction
        };
    }
    
}

function populateGenres(genres) {
    const genreSelect = document.getElementById('genre');
    
    // Check if genres are already populated (from HTML)
    const currentOptions = Array.from(genreSelect.options).map(opt => opt.value);
    const hasGenres = currentOptions.length > 1 && currentOptions.some(v => v && v !== '');
    
    // Only clear and repopulate if we don't already have genres or if we want to update them
    if (!hasGenres || genreSelect.options[0].textContent === 'Loading...') {
        // Clear existing options
        genreSelect.innerHTML = '';
        
        // Add each genre as an option
        genres.forEach(genre => {
            if (genre) {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre;
                genreSelect.appendChild(option);
            }
        });
        
        // Set default to first genre
        if (genres.length > 0) {
            genreSelect.value = genres[0];
        }
    }
}

function setupEventListeners() {
    // Listen for genre changes
    const genreSelect = document.getElementById('genre');
    genreSelect.onchange = function() {
        autoPredict(); // Auto-update prediction when genre changes
    };
}

// Auto-predict function with debouncing (waits 300ms after user stops moving slider)
function autoPredict() {
    // Clear existing timeout
    if (autoPredictTimeout) {
        clearTimeout(autoPredictTimeout);
    }
    
    // Wait 300ms after user stops moving slider before predicting
    autoPredictTimeout = setTimeout(function() {
        // Only auto-predict if predictor is loaded
        if (window.predictor || predictor || (typeof modelParams !== 'undefined' && typeof MovieRevenuePredictor !== 'undefined')) {
            if (typeof window.handlePrediction === 'function') {
                window.handlePrediction();
            } else if (typeof window.handlePredictionFull === 'function') {
                window.handlePredictionFull();
            }
        }
    }, 300);
}

// handlePrediction is now defined at the top of the file

function displayPrediction(revenue, genre, rating, votes, runtime, metascore) {
    const resultDiv = document.getElementById('prediction-result');
    
    resultDiv.className = 'prediction-box animated';
    
    const formattedRevenue = formatNumber(revenue.toFixed(2));
    
    resultDiv.innerHTML = `
        <div class="prediction-label">Predicted Box Office Revenue</div>
        <div class="prediction-value">$${formattedRevenue}M</div>
    `;

    // Update summary
    const summaryGenre = document.getElementById('summary-genre');
    const summaryRating = document.getElementById('summary-rating');
    const summaryVotes = document.getElementById('summary-votes');
    const summaryRuntime = document.getElementById('summary-runtime');
    const summaryMetascore = document.getElementById('summary-metascore');
    const inputSummary = document.getElementById('input-summary');
    
    summaryGenre.textContent = genre;
    summaryRating.textContent = rating.toFixed(1);
    summaryVotes.textContent = formatNumber(votes);
    summaryRuntime.textContent = `${runtime} min`;
    summaryMetascore.textContent = metascore;
    inputSummary.style.display = 'block';
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

