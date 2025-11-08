// Auto-generated from model_params.json
const modelParams = {
  "numerical_features": [
    "votes",
    "rating",
    "runtime",
    "metascore"
  ],
  "categorical_features": [
    "primary_genre"
  ],
  "feature_means": [
    193747.9670014347,
    6.813199426111909,
    113.9583931133429,
    59.445739154850486
  ],
  "feature_stds": [
    195435.42132328768,
    0.896284827781008,
    18.51959268837492,
    16.64754525270437
  ],
  "genre_categories": [
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
  ],
  "feature_importances": {
    "votes": 0.6110299053168136,
    "rating": 0.10642221803854228,
    "runtime": 0.08764428999394781,
    "metascore": 0.08050289940280078,
    "primary_genre_Action": 0.012434589132065996,
    "primary_genre_Adventure": 0.009830041866701469,
    "primary_genre_Animation": 0.03659625296519718,
    "primary_genre_Biography": 0.006336429316982533,
    "primary_genre_Comedy": 0.011978073964705646,
    "primary_genre_Crime": 0.008501828511740597,
    "primary_genre_Drama": 0.021574477053469474,
    "primary_genre_Fantasy": 2.728601180237667e-06,
    "primary_genre_Horror": 0.004386896503405965,
    "primary_genre_Mystery": 0.0016551112655618031,
    "primary_genre_Romance": 1.835291363344739e-05,
    "primary_genre_Sci-Fi": 0.00020092864787260754,
    "primary_genre_Thriller": 0.0008849765053786594
  },
  "model_type": "random_forest",
  "n_estimators": 100,
  "random_state": 42
};
