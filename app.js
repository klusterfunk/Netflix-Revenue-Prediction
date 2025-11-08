/**
 * Main application logic
 */

let predictor = null;
let dataRanges = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Wait a moment to ensure scripts are loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Load model parameters and data ranges
        // These will be loaded from the exported JSON files
        if (typeof modelParams !== 'undefined' && modelParams) {
            predictor = new MovieRevenuePredictor(modelParams);
            console.log('Model loaded successfully');
        } else {
            console.error('Model parameters not loaded');
            document.getElementById('prediction-result').innerHTML = 
                '<p class="placeholder">Error: Model parameters not loaded. Please check model_params.js</p>';
            return;
        }

        if (typeof dataRanges !== 'undefined' && dataRanges) {
            console.log('Data ranges loaded:', dataRanges);
            console.log('Genres available:', dataRanges.genres);
            
            if (dataRanges.genres && Array.isArray(dataRanges.genres) && dataRanges.genres.length > 0) {
                setupSliders(dataRanges);
                populateGenres(dataRanges.genres);
                console.log('Genres populated successfully');
            } else {
                console.error('Genres array is empty or invalid:', dataRanges.genres);
                document.getElementById('genre').innerHTML = '<option value="">No genres available</option>';
            }
        } else {
            console.error('Data ranges not loaded');
            document.getElementById('prediction-result').innerHTML = 
                '<p class="placeholder">Error: Data ranges not loaded. Please check data_ranges.js</p>';
            return;
        }

        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        document.getElementById('prediction-result').innerHTML = 
            '<p class="placeholder">Error loading model. Please refresh the page.</p>';
    }
});

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
        genreSelect.innerHTML = '<option value="">No genres available</option>';
        return;
    }
    
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
