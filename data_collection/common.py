from collections import defaultdict
from playwright.sync_api import sync_playwright
from tld import get_tld
from tld.exceptions import TldDomainNotFound, TldBadUrl
from typing import List, Dict, Optional, Any
from unittest import skip
from urllib.parse import urlparse, parse_qs
import datetime
import glob
import json
import math
import os
import pymongo
import re
import requests


class bcolors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    YELLOW = "\033[33m"
    FAIL = "\033[91m"
    GREY = "\033[90m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    LEVEL_COLORS = {
        "pass": OKGREEN,
        "upd8": OKGREEN,
        "fine": OKBLUE,
        "fail": FAIL,
        "skip": WARNING,
        "ignr": FAIL,
        "warn": WARNING,
        "sing": OKGREEN,
        "mult": OKBLUE,
        "unkn": FAIL,
    }


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


def print_status_line(
    total: Optional[int] = None,
    skipped: Optional[int] = None,
    ignored: Optional[int] = None,
    updated: Optional[int] = None,
    fine: Optional[int] = None,
    passed: Optional[int] = None,
    failed: Optional[int] = None,
    unknown: Optional[int] = None,
    single: Optional[int] = None,
    multiple: Optional[int] = None,
    message: Optional[str] = None,
    print_over: bool = False,
) -> None:
    """
    Prints a status line with the given parameters.

    Args:
        total (int, optional): The total number of status messages.
        skipped (int, optional): The number of skipped messages.
        ignored (int, optional): The number of ignored messages.
        updated (int, optional): The number of updated messages.
        fine (int, optional): The number of fine messages.
        passed (int, optional): The number of passed messages.
        failed (int, optional): The number of failed messages.
        unknown (int, optional): The number of unknown messages.
        single (int, optional): The number of single messages.
        multiple (int, optional): The number of multiple messages.
        message (str, optional): The additional message to display.
        print_over (bool, optional): If True, print over the previous line. Defaults to False.

    Returns:
        None
    """
    level_colors = bcolors.LEVEL_COLORS
    total_text = (
        f"{bcolors.ENDC}{bcolors.BOLD} ({total} total)" if total is not None else ""
    )
    skipped_text = (
        f"{level_colors['skip']} ({skipped} skipped)" if skipped is not None else ""
    )
    ignored_text = (
        f"{level_colors['ignr']} ({ignored} ignored)" if ignored is not None else ""
    )
    updated_text = (
        f"{level_colors['upd8']} ({updated} updated)" if updated is not None else ""
    )
    fine_text = f"{level_colors['fine']} ({fine} fine)" if fine is not None else ""
    passed_text = (
        f"{level_colors['pass']} ({passed} passed)" if passed is not None else ""
    )
    failed_text = (
        f"{level_colors['fail']} ({failed} failed)" if failed is not None else ""
    )
    unknown_text = (
        f"{level_colors['unkn']} ({unknown} unknown)" if unknown is not None else ""
    )
    single_text = (
        f"{level_colors['sing']} ({single} single)" if single is not None else ""
    )
    multiple_text = (
        f"{level_colors['mult']} ({multiple} multiple)" if multiple is not None else ""
    )
    message_text = f"{bcolors.BOLD} {message}{bcolors.ENDC}" if message else ""
    status_line = f"State : {skipped_text}{ignored_text}{updated_text}{fine_text}{passed_text}{failed_text}{unknown_text}{single_text}{multiple_text} {total_text} {message_text}{bcolors.ENDC}"
    if print_over:
        print(status_line, end="\r")
    else:
        print(status_line)


def print_status(
    level: str,
    index: int,
    total: int,
    value: str,
    skipped: Optional[int] = None,
    print_over: bool = False,
) -> None:
    """
    Prints a status message with the given level, index, value, and optional skipped count.

    Args:
        level (str): The level of the status message (pass, fail, skip, warn).
        index (int): The index of the status message in the overall list.
        value (str): The value string of the status message.
        skipped (int, optional): The number of ignored or skipped messages. Defaults to None.
        print_over (bool, optional): If True, print over the previous line. Defaults to False.

    Returns:
        None
    """
    level_colors = bcolors.LEVEL_COLORS
    level_text = level.upper()
    level_color = level_colors.get(level, "")
    skipped_text = (
        f"{bcolors.YELLOW} ({skipped} skipped)" if skipped is not None else ""
    )
    message = f"{level_color}[{level_text}]{bcolors.ENDC} {bcolors.BOLD} {index}/{total}:{bcolors.ENDC} {bcolors.GREY}{value}{bcolors.ENDC}{skipped_text}{bcolors.ENDC}"
    if print_over:
        message += " " * (os.get_terminal_size().columns - len(message))
        print(message, end="\r")
    else:
        print(message)


def updateIgnoreList(ignoreData: list) -> None:
    """
    Updates the ignore list stored in a JSON file.

    Args:
        ignoreData (list): The updated ignore list.

    Returns:
        None
    """
    ignoreFile = "ignorefile.json"
    with open(ignoreFile, "w") as file:
        json.dump(ignoreData, file, indent=4)


def get_key(
    url: str,
    timeout: int,
    key_string: str,
    request_filter: str,
    from_headers: bool = False,
    from_url: bool = False,
) -> str | None:
    """
    Retrieves a key from a URL by making a request and parsing the query string, headers, or URL.

    Args:
        url (str): The URL to make the request to.
        timeout (int): The timeout duration in milliseconds.
        key_string (str): The key in the query string, headers, or URL to retrieve.
        request_filter (str): The filter to match the request URL.
        from_headers (bool, optional): If True, retrieve the key from the headers instead of the query string or URL. Defaults to False.
        from_url (bool, optional): If True, retrieve the URL that matches the request filter. Defaults to False.

    Returns:
        str | None: The retrieved key or URL, or None if no key or URL is found.

    """

    keys = set()
    requested_url = ""

    def on_request(route, request):
        nonlocal requested_url
        if request_filter in request.url:
            if from_headers:
                print(request.headers)
                key = request.headers.get(key_string)
            elif from_url:
                requested_url = request.url.replace(key_string, "").replace(
                    request_filter, ""
                )
                key = None
            else:
                urlobj = urlparse(request.url)
                key = parse_qs(urlobj.query).get(key_string)
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
    if from_url:
        return requested_url
    if len(keys) == 0 or None in list(keys):
        return None
    return list(keys)[0]


def calculate_average_ratings(
    data_list: Dict[str, Dict[str, Any]], industry_path: str, score_path: str
) -> Dict[str, float]:
    """
    Calculates the average ratings for each industry based on the given data list.

    Args:
        data_list (Dict[str, Dict[str, any]]): A dictionary containing the data list.
        industry_path (str): The path to the industry value in the data dictionary.
        score_path (str): The path to the score value in the data dictionary.

    Returns:
        Dict[str, float]: A dictionary containing the average ratings for each industry.

    """
    industry_ratings = defaultdict(list)
    # Iterate over each data dictionary in the list
    for data in data_list.values():
        industry = get_value_from_path(data, industry_path)
        score = get_value_from_path(data, score_path)

        if industry and score:
            if (
                isinstance(score, str)
                or isinstance(score, int)
                or isinstance(score, float)
            ):
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


def lookup_document_by_label(label, alias=False, returnWebsite=False):
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client["rop"]
    collection = db["wikidata"]
    if alias:
        query = {"claims.P856": {"$exists": True}, "aliases.en.value": {"$eq": label}}
    else:
        query = {"claims.P856": {"$exists": True}, "labels.en.value": {"$eq": label}}
    document = collection.find_one(query)

    if returnWebsite:
        if document and "claims" in document and "P856" in document["claims"]:
            canon = get_domain(
                document["claims"]["P856"][0]["mainsnak"]["datavalue"]["value"]
            )
            return canon
        else:
            return None

    return document


def get_domain(url, nottld=False):
    url = "http://" + url if not url.startswith("http") else url
    try:
        parsed_url = get_tld(url, as_object=True)
    except TldDomainNotFound:
        return None
    except TldBadUrl:
        return None

    if nottld:
        return parsed_url.fld.replace(f".{parsed_url.tld}", "")

    if parsed_url.subdomain != "":
        domain = parsed_url.subdomain + "." + parsed_url.fld
    else:
        domain = parsed_url.subdomain + parsed_url.fld

    if parsed_url.subdomain in ["about", "shop", "m"]:
        domain = parsed_url.fld
    return domain


def save_data_to_file(data: Any, filename: str) -> None:
    """
    Save the given data to a file.

    Args:
        data: The data to be saved.
        filename: The name of the file to save the data to.
    """
    with open(filename, "w") as file:
        json.dump(data, file, indent=4)


def load_data_from_file(filename: str):
    """
    Load data from a JSON file.

    Args:
        filename (str): The path to the JSON file.

    Returns:
        dict: The loaded data as a dictionary.
    """
    with open(filename, "r") as json_file:
        data = json.load(json_file)
    return data


def get_oldest_files(
    directory: str, percentage: float = 0.1, extension: str = ".json"
) -> List[str]:
    """
    Returns the percentage oldest files of a specific extension in a directory.

    Args:
        directory (str): The directory to search for files.
        percentage (float): The percentage of oldest files to return.
        extension (str): The file extension to filter.

    Returns:
        List[str]: The list of file paths.
    """
    # Get all files with the specified extension in the directory
    files = glob.glob(os.path.join(directory, f"*.{extension}"))

    # Sort the files by modification time in ascending order
    files.sort(key=lambda x: os.path.getmtime(x))

    # Calculate the number of oldest files to return based on the percentage
    num_files = len(files)
    num_oldest_files = math.ceil(num_files * percentage)

    # Return the percentage oldest files
    return files[:num_oldest_files]
