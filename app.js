/**
 * Main application logic
 */

let predictor = null;
let dataRanges = null;
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
    try {
        // Load model parameters and data ranges
        // These will be loaded from the exported JSON files
        if (typeof modelParams !== 'undefined' && modelParams) {
            predictor = new MovieRevenuePredictor(modelParams);
            console.log('Model loaded successfully');
        } else {
            console.error('Model parameters not loaded');
            // Don't return - still try to populate genres
        }

        // Try to get genres from dataRanges, fallback to FALLBACK_GENRES
        let genresToUse = FALLBACK_GENRES;
        let rangesToUse = null;

        if (typeof dataRanges !== 'undefined' && dataRanges) {
            console.log('Data ranges loaded:', dataRanges);
            rangesToUse = dataRanges;
            
            if (dataRanges.genres && Array.isArray(dataRanges.genres) && dataRanges.genres.length > 0) {
                genresToUse = dataRanges.genres;
                console.log('Using genres from data_ranges.js:', genresToUse);
            } else {
                console.warn('Genres array is empty or invalid, using fallback');
            }
        } else {
            console.warn('Data ranges not loaded, using fallback genres');
        }

        // Always populate genres (either from dataRanges or fallback)
        populateGenres(genresToUse);
        console.log('Genres populated successfully with', genresToUse.length, 'genres');

        // Update sliders if we have ranges (they're already initialized, but update with correct values)
        if (rangesToUse) {
            setupSliders(rangesToUse);
        }
        // Note: Event listeners are already set up in DOMContentLoaded, but ensure they're still there
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        // Still try to populate genres even if there's an error
        populateGenres(FALLBACK_GENRES);
    }
}

// Populate genres immediately - don't wait for anything
function populateGenresNow() {
    const genreSelect = document.getElementById('genre');
    if (!genreSelect) {
        console.error('Genre select element not found');
        return;
    }
    
    // Check if genres are already in HTML (hardcoded)
    const hasGenresInHTML = genreSelect.options.length > 1 && 
                            genreSelect.options[0].textContent !== 'Loading...' &&
                            genreSelect.options[0].textContent !== 'Select Genre...';
    
    if (hasGenresInHTML) {
        console.log('Genres already in HTML, no need to populate');
        return;
    }
    
    // Use dataRanges if available, otherwise use fallback
    let genresToUse = FALLBACK_GENRES;
    if (typeof dataRanges !== 'undefined' && dataRanges && dataRanges.genres && Array.isArray(dataRanges.genres) && dataRanges.genres.length > 0) {
        genresToUse = dataRanges.genres;
        console.log('Using genres from data_ranges.js');
    } else {
        console.log('Using fallback genres');
    }
    
    populateGenres(genresToUse);
}

// Wait for DOM and scripts to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded fired ===');
    console.log('Scripts loaded:', {
        modelParams: typeof modelParams !== 'undefined',
        dataRanges: typeof dataRanges !== 'undefined',
        MovieRevenuePredictor: typeof MovieRevenuePredictor !== 'undefined'
    });
    
    // Populate genres immediately - don't wait for anything
    populateGenresNow();
    
    // Initialize sliders immediately with default values (don't wait for data_ranges.js)
    setupSlidersWithDefaults();
    
    // Setup event listeners immediately
    setupEventListeners();
    
    // Then try to initialize the rest of the app (model, etc.)
    setTimeout(function() {
        console.log('Initializing app...');
        initializeApp();
        // Make an initial prediction after everything is loaded
        setTimeout(function() {
            console.log('Attempting initial prediction...');
            if (predictor || (typeof modelParams !== 'undefined' && typeof MovieRevenuePredictor !== 'undefined')) {
                console.log('Conditions met, calling handlePrediction...');
                handlePrediction();
            } else {
                console.log('Conditions not met for initial prediction');
            }
        }, 500);
    }, 100);
});

// Also try when window is fully loaded as a backup
window.addEventListener('load', function() {
    // Double-check genres are populated
    const genreSelect = document.getElementById('genre');
    if (genreSelect && (genreSelect.options.length <= 1 || genreSelect.options[0].value === '')) {
        console.log('Genres not populated yet, populating now');
        populateGenresNow();
    }
});

// One more safety check - run after a short delay
setTimeout(function() {
    const genreSelect = document.getElementById('genre');
    if (genreSelect && (genreSelect.options.length <= 1 || genreSelect.options[0].value === '')) {
        console.log('Final check: populating genres');
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
        console.warn('No ranges provided, using defaults');
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
    
    console.log('Sliders initialized successfully');
}

function populateGenres(genres) {
    const genreSelect = document.getElementById('genre');
    
    if (!genreSelect) {
        console.error('Genre select element not found');
        return;
    }
    
    if (!genres || !Array.isArray(genres) || genres.length === 0) {
        console.error('Invalid genres array:', genres);
        // Don't clear if we already have genres from HTML
        if (genreSelect.options.length <= 1) {
            genreSelect.innerHTML = '<option value="">No genres available</option>';
        }
        return;
    }
    
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
            console.log('Genre dropdown populated with', genres.length, 'genres');
        }
    } else {
        console.log('Genres already populated, skipping update');
    }
}

function setupEventListeners() {
    const predictBtn = document.getElementById('predict-btn');
    if (predictBtn) {
        // The button already has onclick in HTML, but let's also add event listener as backup
        predictBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Predict button clicked via addEventListener');
            if (typeof handlePrediction === 'function') {
                handlePrediction();
            } else {
                console.error('handlePrediction is not a function');
            }
            return false;
        });
        console.log('Predict button event listener attached');
    } else {
        console.error('Predict button not found');
        // Try again after a short delay
        setTimeout(function() {
            const btn = document.getElementById('predict-btn');
            if (btn) {
                btn.onclick = function() { handlePrediction(); return false; };
                btn.addEventListener('click', handlePrediction);
                console.log('Predict button found and listener attached on retry');
            } else {
                console.error('Predict button still not found after retry');
            }
        }, 500);
    }
    
    // Also listen for genre changes
    const genreSelect = document.getElementById('genre');
    if (genreSelect) {
        genreSelect.onchange = function() {
            autoPredict(); // Auto-update prediction when genre changes
        };
    }
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
        if (predictor || (typeof modelParams !== 'undefined' && typeof MovieRevenuePredictor !== 'undefined')) {
            handlePrediction();
        }
    }, 300);
}

// Make handlePrediction globally accessible
window.handlePrediction = function() {
    console.log('=== handlePrediction CALLED ===');
    console.log('Predictor exists:', !!predictor);
    console.log('modelParams exists:', typeof modelParams !== 'undefined');
    console.log('MovieRevenuePredictor exists:', typeof MovieRevenuePredictor !== 'undefined');
    
    // Try to initialize predictor if it's not loaded yet
    if (!predictor) {
        console.log('Predictor not loaded, attempting to initialize...');
        if (typeof modelParams !== 'undefined' && modelParams && typeof MovieRevenuePredictor !== 'undefined') {
            try {
                console.log('Creating new MovieRevenuePredictor...');
                predictor = new MovieRevenuePredictor(modelParams);
                console.log('✓ Predictor initialized successfully');
            } catch (error) {
                console.error('✗ Error initializing predictor:', error);
                console.error('Error stack:', error.stack);
                alert('Model not loaded. Error: ' + error.message + '\n\nCheck console for details.');
                return;
            }
        } else {
            console.error('✗ Model parameters or MovieRevenuePredictor class not available');
            console.error('modelParams type:', typeof modelParams);
            console.error('MovieRevenuePredictor type:', typeof MovieRevenuePredictor);
            alert('Model not loaded. Please refresh the page and wait a moment for the model to load.\n\nCheck console (F12) for details.');
            return;
        }
    } else {
        console.log('✓ Predictor already loaded');
    }

    // Get input values
    console.log('Getting input values...');
    const genre = document.getElementById('genre');
    const votesInput = document.getElementById('votes');
    const ratingInput = document.getElementById('rating');
    const runtimeInput = document.getElementById('runtime');
    const metascoreInput = document.getElementById('metascore');
    
    console.log('Input elements found:', {
        genre: !!genre,
        votes: !!votesInput,
        rating: !!ratingInput,
        runtime: !!runtimeInput,
        metascore: !!metascoreInput
    });
    
    if (!genre || !votesInput || !ratingInput || !runtimeInput || !metascoreInput) {
        console.error('✗ One or more input elements not found');
        alert('Error: Could not find input elements. Please refresh the page.');
        return;
    }
    
    const genreValue = genre.value;
    const votes = parseInt(votesInput.value);
    const rating = parseFloat(ratingInput.value);
    const runtime = parseInt(runtimeInput.value);
    const metascore = parseInt(metascoreInput.value);

    console.log('Input values:', { genreValue, votes, rating, runtime, metascore });

    // Validate inputs
    if (!genreValue || genreValue === '') {
        alert('Please select a genre');
        return;
    }
    
    if (isNaN(votes) || isNaN(rating) || isNaN(runtime) || isNaN(metascore)) {
        console.error('✗ Invalid input values:', { votes, rating, runtime, metascore });
        alert('Error: Invalid input values. Please check your inputs.');
        return;
    }

    console.log('✓ All inputs valid. Making prediction...');
    console.log('Prediction inputs:', { genre: genreValue, votes, rating, runtime, metascore });
    
    try {
        // Make prediction
        console.log('Calling predictor.predict()...');
        const predictedRevenue = predictor.predict(votes, rating, runtime, metascore, genreValue);
        console.log('✓ Prediction successful!');
        console.log('Predicted revenue:', predictedRevenue);
        
        // Display result
        console.log('Displaying prediction result...');
        displayPrediction(predictedRevenue, genreValue, rating, votes, runtime, metascore);
        console.log('✓ Prediction displayed successfully');
    } catch (error) {
        console.error('✗ Error making prediction:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        alert('Error making prediction: ' + error.message + '\n\nCheck console (F12) for details.');
    }
    console.log('=== handlePrediction COMPLETE ===');
};

// Also keep the local reference
var handlePrediction = window.handlePrediction;

function displayPrediction(revenue, genre, rating, votes, runtime, metascore) {
    console.log('displayPrediction called with:', { revenue, genre, rating, votes, runtime, metascore });
    
    const resultDiv = document.getElementById('prediction-result');
    if (!resultDiv) {
        console.error('✗ prediction-result div not found!');
        alert('Error: Could not find result display area.');
        return;
    }
    
    resultDiv.className = 'prediction-box animated';
    
    const formattedRevenue = formatNumber(revenue.toFixed(2));
    console.log('Formatted revenue:', formattedRevenue);
    
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
    
    if (summaryGenre) summaryGenre.textContent = genre;
    if (summaryRating) summaryRating.textContent = rating.toFixed(1);
    if (summaryVotes) summaryVotes.textContent = formatNumber(votes);
    if (summaryRuntime) summaryRuntime.textContent = `${runtime} min`;
    if (summaryMetascore) summaryMetascore.textContent = metascore;
    if (inputSummary) inputSummary.style.display = 'block';
    
    console.log('✓ Prediction displayed successfully');
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

