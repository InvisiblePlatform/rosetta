import os
import json
from collections import defaultdict

def calculate_average_ratings(folder_path: str):
    industry_ratings = defaultdict(list)

    # Iterate over each file in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            with open(os.path.join(folder_path, filename), 'r') as file:
                data = json.load(file)
                industry = data.get('industry')
                rating_value = data.get('glasroom_rating', {}).get('ratingValue')

                if industry and rating_value:
                    industry_ratings[industry].append(float(rating_value))

    # Calculate average ratings for each industry
    average_ratings = {}
    for industry, ratings in industry_ratings.items():
        average_rating = sum(ratings) / len(ratings)
        average_ratings[industry] = round(average_rating, 2)

    return average_ratings

if __name__ == "__main__":
    folder_path = 'entities'
    average_ratings = calculate_average_ratings(folder_path)

    # Output results as JSON object
    with open('average_ratings.json', 'w') as json_file:
        json.dump(average_ratings, json_file, indent=4)

    print("Average Ratings by Industry:")
    for industry, avg_rating in average_ratings.items():
        print(f"{industry}: {avg_rating:.2f}")

