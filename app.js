/**
 * Main application logic
 */

let predictor = null;
let dataRanges = null;

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

        // Setup sliders if we have ranges
        if (rangesToUse) {
            setupSliders(rangesToUse);
        } else {
            // Use default ranges if data_ranges.js didn't load
            setupSliders({
                votes_range: [178, 1791916, 190970],
                rating_range: [1.9, 9.0, 6.8],
                runtime_range: [66, 191, 114],
                metascore_range: [11, 100, 59]
            });
        }

        // Setup event listeners
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
    // Populate genres immediately - don't wait for anything
    populateGenresNow();
    
    // Then try to initialize the rest of the app
    setTimeout(function() {
        initializeApp();
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

function setupSliders(ranges) {
    // Setup votes slider
    const votesSlider = document.getElementById('votes');
    const votesValue = document.getElementById('votes-value');
    votesSlider.min = ranges.votes_range[0];
    votesSlider.max = ranges.votes_range[1];
    votesSlider.value = ranges.votes_range[2];
    votesValue.textContent = formatNumber(ranges.votes_range[2]);
    
    votesSlider.addEventListener('input', function() {
        votesValue.textContent = formatNumber(this.value);
    });

    // Setup rating slider
    const ratingSlider = document.getElementById('rating');
    const ratingValue = document.getElementById('rating-value');
    ratingSlider.min = ranges.rating_range[0];
    ratingSlider.max = ranges.rating_range[1];
    ratingSlider.value = ranges.rating_range[2];
    ratingValue.textContent = ranges.rating_range[2].toFixed(1);
    
    ratingSlider.addEventListener('input', function() {
        ratingValue.textContent = parseFloat(this.value).toFixed(1);
    });

    // Setup runtime slider
    const runtimeSlider = document.getElementById('runtime');
    const runtimeValue = document.getElementById('runtime-value');
    runtimeSlider.min = ranges.runtime_range[0];
    runtimeSlider.max = ranges.runtime_range[1];
    runtimeSlider.value = ranges.runtime_range[2];
    runtimeValue.textContent = ranges.runtime_range[2];
    
    runtimeSlider.addEventListener('input', function() {
        runtimeValue.textContent = this.value;
    });

    // Setup metascore slider
    const metascoreSlider = document.getElementById('metascore');
    const metascoreValue = document.getElementById('metascore-value');
    metascoreSlider.min = ranges.metascore_range[0];
    metascoreSlider.max = ranges.metascore_range[1];
    metascoreSlider.value = ranges.metascore_range[2];
    metascoreValue.textContent = ranges.metascore_range[2];
    
    metascoreSlider.addEventListener('input', function() {
        metascoreValue.textContent = this.value;
    });
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
    predictBtn.addEventListener('click', handlePrediction);
}

function handlePrediction() {
    if (!predictor) {
        alert('Model not loaded. Please refresh the page.');
        return;
    }

    // Get input values
    const genre = document.getElementById('genre').value;
    const votes = parseInt(document.getElementById('votes').value);
    const rating = parseFloat(document.getElementById('rating').value);
    const runtime = parseInt(document.getElementById('runtime').value);
    const metascore = parseInt(document.getElementById('metascore').value);

    // Validate inputs
    if (!genre) {
        alert('Please select a genre');
        return;
    }

    // Make prediction
    const predictedRevenue = predictor.predict(votes, rating, runtime, metascore, genre);

    // Display result
    displayPrediction(predictedRevenue, genre, rating, votes, runtime, metascore);
}

function displayPrediction(revenue, genre, rating, votes, runtime, metascore) {
    const resultDiv = document.getElementById('prediction-result');
    resultDiv.className = 'prediction-box animated';
    
    resultDiv.innerHTML = `
        <div class="prediction-label">Predicted Box Office Revenue</div>
        <div class="prediction-value">$${formatNumber(revenue.toFixed(2))}M</div>
    `;

    // Update summary
    document.getElementById('summary-genre').textContent = genre;
    document.getElementById('summary-rating').textContent = rating.toFixed(1);
    document.getElementById('summary-votes').textContent = formatNumber(votes);
    document.getElementById('summary-runtime').textContent = `${runtime} min`;
    document.getElementById('summary-metascore').textContent = metascore;
    
    document.getElementById('input-summary').style.display = 'block';
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

