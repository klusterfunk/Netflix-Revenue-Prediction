/**
 * Main application logic
 */

let predictor = null;
let dataRanges = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load model parameters and data ranges
        // These will be loaded from the exported JSON files
        if (typeof modelParams !== 'undefined') {
            predictor = new MovieRevenuePredictor(modelParams);
        } else {
            console.error('Model parameters not loaded');
            return;
        }

        if (typeof dataRanges !== 'undefined') {
            setupSliders(dataRanges);
            populateGenres(dataRanges.genres);
        } else {
            console.error('Data ranges not loaded');
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
    genreSelect.innerHTML = '';
    
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
    
    // Set default to first genre
    if (genres.length > 0) {
        genreSelect.value = genres[0];
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
