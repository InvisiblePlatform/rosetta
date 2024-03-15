import os
import json
from collections import defaultdict

def calculate_average_ratings(folder_path):
    industry_ratings = defaultdict(list)

    # Iterate over each file in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            with open(os.path.join(folder_path, filename), 'r') as file:
                data = json.load(file)
                industry = data.get('industry')
                score = data.get('latestVerifiedScore')

                if industry and score:
                    industry_ratings[industry].append(float(score))

    # Calculate average ratings for each industry
    average_ratings = {}
    for industry, scores in industry_ratings.items():
        average_score = sum(scores) / len(scores)
        average_ratings[industry] = round(average_score, 2)

    return average_ratings

if __name__ == "__main__":
    folder_path = 'split_files'
    average_ratings = calculate_average_ratings(folder_path)

    # Output results as JSON object
    with open('average_ratings_latest_verified_score.json', 'w') as json_file:
        json.dump(average_ratings, json_file, indent=4)

    print("Average Ratings by Industry:")
    for industry, avg_score in average_ratings.items():
        print(f"{industry}: {avg_score:.2f}")

