import os
import datetime
import pprint
import requests
from typing import Optional, Any
from collections import defaultdict
import re
import json


class bcolors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


def is_file_modified_over_a_week_ago(file_path: str) -> bool:
    try:
        modification_time: float = os.path.getmtime(file_path)
    except FileNotFoundError:
        return True

    modification_datetime: datetime.datetime = datetime.datetime.fromtimestamp(
        modification_time
    )

    time_difference: datetime.timedelta = (
        datetime.datetime.now() - modification_datetime
    )

    if time_difference.days > 7:
        return True
    else:
        return False


def is_file_modified_over_duration(file_path: str, duration_str: str) -> bool:
    """
    Checks if a file has been modified over a specified duration ago.

    Args:
        file_path (str): The path to the file.
        duration_str (str): A string representing the duration. Format: "2y 1m 1d"

    Returns:
        bool: True if the file has been modified over the specified duration ago or does not exits, False otherwise.

    Raises:
        ValueError: If the duration string has an invalid format.
    """
    duration_regex = re.compile(r"(?:(\d+)y)?\s*(?:(\d+)m)?\s*(?:(\d+)d)?")
    match = duration_regex.match(duration_str)
    if not match:
        raise ValueError("Invalid duration string format. Example format: '2y 1m 1d'")

    years, months, days = map(int, match.groups())

    try:
        modification_time = os.path.getmtime(file_path)
    except FileNotFoundError:
        return True

    modification_datetime = datetime.datetime.fromtimestamp(modification_time)

    time_difference = datetime.datetime.now() - modification_datetime

    duration_in_days = days + months * 30 + years * 365

    if time_difference.days > duration_in_days:
        return True
    else:
        return False


def send_notification(title: str, message: str) -> None:
    """
    Sends a notification to a Home Assistant instance.

    Args:
        title (str): The title of the notification.
        message (str): The content of the notification.

    Raises:
        ValueError: If required environment variables are not set.

    Returns:
        None
    """
    bearer_token: Optional[str] = os.getenv("HA_BEARER_TOKEN")
    if not bearer_token:
        raise ValueError("Bearer token not found in environment variables.")

    device: Optional[str] = os.getenv("HA_DEVICE")
    if not device:
        raise ValueError("Device name not found in environment variables.")

    host: Optional[str] = os.getenv("HA_HOST")
    if not host:
        raise ValueError("Home Assistant host not found in environment variables.")

    payload = {
        "message": message,
        "title": title,
        "data": {"push": {"category": "notification", "sound": "default"}},
    }

    headers = {
        "Authorization": f"Bearer {bearer_token}",
        "Content-Type": "application/json",
    }

    try:
        response: requests.Response = requests.post(
            f"{host}/api/services/notify/{device}", json=payload, headers=headers
        )
        response.raise_for_status()
        print("Notification sent successfully.")
    except requests.exceptions.RequestException as e:
        print(f"Error sending notification: {e}")


def addToIgnore(sym: Any) -> None:
    """
    Adds a symbol to the ignore list stored in a JSON file.

    Args:
        sym (Any): The symbol to add to the ignore list.

    Returns:
        None
    """
    ignoreData = set()
    ignoreFile = "ignorefile.json"

    if not os.path.exists(ignoreFile):
        with open(ignoreFile, "w") as file:
            json.dump([], file)
    else:
        with open(ignoreFile, "r") as file:
            ignoreData = set(json.load(file))

    ignoreData.add(sym)
    with open(ignoreFile, "w") as file:
        json.dump(sorted(list(ignoreData)), file, indent=4)


def getIgnoreList() -> list[str | None]:
    """
    Opens the ignore file and returns its contents as a list.

    Returns:
        list: The list of symbols stored in the ignore file.
    """
    ignoreFile = "ignorefile.json"

    # If the ignore file doesn't exist, return an empty list
    if not os.path.exists(ignoreFile):
        return []

    with open(ignoreFile, "r") as file:
        ignoreData = json.load(file)

    return ignoreData


def print_status(
    level: str, index: int, total: int, value: str, skipped: Optional[int] = None
) -> None:
    """
    Prints a status message with the given level, index, value, and optional skipped count.

    Args:
        level (str): The level of the status message (pass, fail, skip, warn).
        index (int): The index of the status message in the overall list.
        value (str): The value string of the status message.
        skipped (int, optional): The number of ignored or skipped messages. Defaults to None.

    Returns:
        None
    """
    level_colors = {
        "pass": bcolors.OKGREEN,
        "upd8": bcolors.OKGREEN,
        "fine": bcolors.OKBLUE,
        "fail": bcolors.FAIL,
        "skip": bcolors.WARNING,
        "ignr": bcolors.FAIL,
    }
    level_text = level.upper()
    level_color = level_colors.get(level, "")
    skipped_text = f" ({skipped} skipped)" if skipped is not None else ""
    message = f"{level_color}[{level_text}] {index}/{total}: {value}{skipped_text}{bcolors.ENDC}"
    print(message)


def updateIgnoreList(ignoreData):
    ignoreFile = "ignorefile.json"
    with open(ignoreFile, "w") as file:
        json.dump(ignoreData, file, indent=4)


def get_key(url, timeout, querystring_key, request_filter) -> str | None:
    from playwright.sync_api import sync_playwright
    from urllib.parse import urlparse, parse_qs

    keys = set()

    def on_request(route, request):
        if request_filter in request.url:
            urlobj = urlparse(request.url)
            key = parse_qs(urlobj.query).get(querystring_key)
            if key:
                keys.add(key[0])
        route.continue_()

    with sync_playwright() as playwright:
        browser = playwright.firefox.launch(headless=True)
        context = browser.new_context()
        context.route("**", on_request)
        page = context.new_page()
        page.goto(url)
        page.wait_for_timeout(timeout)
        browser.close()
    if len(keys) == 0 or None in list(keys):
        return None
    return list(keys)[0]


def calculate_average_ratings(data_list, industry_path, score_path):
    industry_ratings = defaultdict(list)
    # Iterate over each data dictionary in the list
    for data in data_list.values():
        industry = get_value_from_path(data, industry_path)
        score = get_value_from_path(data, score_path)

        if industry and score:
            industry_ratings[industry].append(float(score))

    # Calculate average ratings for each industry
    average_ratings = {}
    for industry, scores in industry_ratings.items():
        average_score = sum(scores) / len(scores)
        average_ratings[industry] = round(average_score, 2)

    return average_ratings


def get_value_from_path(data, path):
    if "." not in path:
        keys = [path]
    else:
        keys = path.split(".")

    value = data
    for key in keys:
        if isinstance(value, dict):
            value = value.get(key)
        else:
            return value
    return value
