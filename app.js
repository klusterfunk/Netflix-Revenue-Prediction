/**
 * Main application logic
 */

let predictor = null;
let autoPredictTimeout = null;

function makePrediction() {
    // Initialize predictor if needed
    if (!predictor) {
        predictor = new MovieRevenuePredictor(modelParams);
    }

    // Get input values
    const genre = document.getElementById('genre').value;
    const votes = parseInt(document.getElementById('votes').value);
    const rating = parseFloat(document.getElementById('rating').value);
    const runtime = parseInt(document.getElementById('runtime').value);
    const metascore = parseInt(document.getElementById('metascore').value);
    
    // Make prediction
    const predictedRevenue = predictor.predict(votes, rating, runtime, metascore, genre);
    
    // Display result
    displayPrediction(predictedRevenue, genre, rating, votes, runtime, metascore);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Setup sliders
    if (typeof dataRanges !== 'undefined' && dataRanges) {
        setupSliders(dataRanges);
    } else {
        setupSlidersWithDefaults();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Make initial prediction
    setTimeout(() => makePrediction(), 100);
});

function setupSlidersWithDefaults() {
    setupSliders({
        votes_range: [178, 1791916, 190970],
        rating_range: [1.9, 9.0, 6.8],
        runtime_range: [66, 191, 114],
        metascore_range: [11, 100, 59]
    });
}

function setupSliders(ranges) {
    // Setup votes slider
    const votesSlider = document.getElementById('votes');
    const votesValue = document.getElementById('votes-value');
    votesSlider.min = ranges.votes_range[0];
    votesSlider.max = ranges.votes_range[1];
    votesSlider.value = ranges.votes_range[2];
    votesValue.textContent = formatNumber(ranges.votes_range[2]);
    votesSlider.oninput = () => {
        votesValue.textContent = formatNumber(votesSlider.value);
        autoPredict();
    };

    // Setup rating slider
    const ratingSlider = document.getElementById('rating');
    const ratingValue = document.getElementById('rating-value');
    ratingSlider.min = ranges.rating_range[0];
    ratingSlider.max = ranges.rating_range[1];
    ratingSlider.value = ranges.rating_range[2];
    ratingValue.textContent = ranges.rating_range[2].toFixed(1);
    ratingSlider.oninput = () => {
        ratingValue.textContent = parseFloat(ratingSlider.value).toFixed(1);
        autoPredict();
    };

    // Setup runtime slider
    const runtimeSlider = document.getElementById('runtime');
    const runtimeValue = document.getElementById('runtime-value');
    runtimeSlider.min = ranges.runtime_range[0];
    runtimeSlider.max = ranges.runtime_range[1];
    runtimeSlider.value = ranges.runtime_range[2];
    runtimeValue.textContent = ranges.runtime_range[2];
    runtimeSlider.oninput = () => {
        runtimeValue.textContent = runtimeSlider.value;
        autoPredict();
    };

    // Setup metascore slider
    const metascoreSlider = document.getElementById('metascore');
    const metascoreValue = document.getElementById('metascore-value');
    metascoreSlider.min = ranges.metascore_range[0];
    metascoreSlider.max = ranges.metascore_range[1];
    metascoreSlider.value = ranges.metascore_range[2];
    metascoreValue.textContent = ranges.metascore_range[2];
    metascoreSlider.oninput = () => {
        metascoreValue.textContent = metascoreSlider.value;
        autoPredict();
    };
}

function setupEventListeners() {
    document.getElementById('genre').onchange = autoPredict;
}

function autoPredict() {
    clearTimeout(autoPredictTimeout);
    autoPredictTimeout = setTimeout(makePrediction, 300);
}

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

