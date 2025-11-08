/**
 * Simplified Random Forest prediction function
 * This is an approximation based on feature importance and scaling
 */

class MovieRevenuePredictor {
    constructor(modelParams) {
        this.modelParams = modelParams;
        this.numericalFeatures = modelParams.numerical_features;
        this.featureMeans = modelParams.feature_means;
        this.featureStds = modelParams.feature_stds;
        this.genreCategories = modelParams.genre_categories;
        this.featureImportances = modelParams.feature_importances;
    }

    /**
     * Standardize numerical features
     */
    standardize(value, mean, std) {
        return (value - mean) / std;
    }

    /**
     * One-hot encode genre
     */
    encodeGenre(genre) {
        const encoding = new Array(this.genreCategories.length).fill(0);
        const index = this.genreCategories.indexOf(genre);
        if (index !== -1) {
            encoding[index] = 1;
        }
        return encoding;
    }

    /**
     * Predict revenue based on input features
     * This is a simplified approximation of the Random Forest model
     */
    predict(votes, rating, runtime, metascore, primaryGenre) {
        // Standardize numerical features
        const standardizedVotes = this.standardize(votes, this.featureMeans[0], this.featureStds[0]);
        const standardizedRating = this.standardize(rating, this.featureMeans[1], this.featureStds[1]);
        const standardizedRuntime = this.standardize(runtime, this.featureMeans[2], this.featureStds[2]);
        const standardizedMetascore = this.standardize(metascore, this.featureMeans[3], this.featureStds[3]);

        // Encode genre
        const genreEncoding = this.encodeGenre(primaryGenre);

        // Create feature vector
        const features = [
            standardizedVotes,
            standardizedRating,
            standardizedRuntime,
            standardizedMetascore,
            ...genreEncoding
        ];

        // Calculate weighted prediction based on feature importance
        // This is a simplified linear approximation
        let prediction = 0;
        
        // Numerical features contribution
        prediction += standardizedVotes * (this.featureImportances['votes'] || 0.1);
        prediction += standardizedRating * (this.featureImportances['rating'] || 0.15);
        prediction += standardizedRuntime * (this.featureImportances['runtime'] || 0.05);
        prediction += standardizedMetascore * (this.featureImportances['metascore'] || 0.1);

        // Genre contribution
        for (let i = 0; i < genreEncoding.length; i++) {
            const genreName = `primary_genre_${this.genreCategories[i]}`;
            prediction += genreEncoding[i] * (this.featureImportances[genreName] || 0.02);
        }

        // Apply bias and scaling factors (calibrated based on model performance)
        // These values are approximations based on the model's behavior
        const bias = 5.0; // Approximate mean log_revenue
        const scale = 1.2; // Scaling factor for better approximation
        
        const logPrediction = bias + (prediction * scale);

        // Convert from log space back to actual revenue
        // Using expm1 equivalent: exp(x) - 1
        const revenue = Math.exp(logPrediction) - 1;

        // Ensure non-negative
        return Math.max(0, revenue);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MovieRevenuePredictor;
}
