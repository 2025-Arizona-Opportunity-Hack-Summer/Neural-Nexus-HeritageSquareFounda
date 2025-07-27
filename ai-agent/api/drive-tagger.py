#!/usr/bin python
# -*- coding: utf-8 -*-

import io

from typing import List, Dict, Tuple, Set, Any, Union

import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload
from google.api_core.exceptions import (
    GoogleAPIError,
)  # Used to catch Gemini rate limit errors

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Other misc. libraries
# from PIL import Image
from google import genai
import tempfile
import mimetypes
from datetime import datetime
import tkinter as tk  # used for the GUI
import time  # Used if minute rate limit exceeded

import os
from dotenv import load_dotenv

load_dotenv({load_dotenv: "../.env"})

# So the program doesn't look like it froze,
# have a thread dedicated to the tagging/sorting process
import threading
import queue  # Since the tagging thread can't directly update labels in the GUI, use a queue

# import google.generativeai as genai
# client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

validTags: List[str] = [
    "Accounting",
    "Curation",
    "Development (contributed revenue generation)",
    "Employee resources (HR)",
    "Board of Directors",
    "Marketing",
    "Operations",
    "Programming",
    "Research (historic info)",
    "Historic Image",
    "Non Historic Image",
]
# removed .webp because mimetypes doesn't recognize it
# geminiCompatibleFileTypes = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx', '.txt'] # TODO UPDATE THIS LIST AS NEEDED
geminiCompatibleFileTypes: List[str] = [
    ".c",
    ".cpp",
    ".py",
    ".java",
    ".php",
    ".sql",
    ".html",
    ".doc",
    ".docx",
    ".pdf",
    ".rtf",
    ".dot",
    ".dotx",
    ".hwp",
    ".hwpx",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".heif",
    ".heic",  # Added .heic for HEIF
    ".txt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".csv",
    ".tsv",
    ".mp4",
    ".mpeg",
    ".mov",
    ".avi",
    ".flv",
    ".mpg",
    ".webm",
    ".wmv",
    ".3gpp",
]

# Drive stores months as numbers, so use this dict when creating the respective month folder
numberToMonth: Dict[int, str] = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
}

# First scope used to download drive files and update labels (tags)
# Second scope used to create the label in the first place that will be associated with metadata
# NOTE: This means that to use this program, you must use a Google account with admin access to the Google Drive
SCOPES: List[str] = ["https://www.googleapis.com/auth/drive"]

# "https://www.googleapis.com/auth/drive.admin.labels"

documentAnalyzerPrompt = """You are assisting the Heritage Square Foundation in organizing their Google Drive by categorizing files based on their content. Review the attached file and use all available context clues (such as text, images, layout, file structure, and any embedded information) to determine which of the following categories it belongs to. Choose only one category that best represents the primary purpose or content of the file.
For context, Heritage Square maintains Victorian era homes that can be toured for educational purposes.
If the file doesn't fit any of the categories, return Uncategorized. Return only the category name, with no additional text, explanations, or punctuation.

The categories are:

Accounting
Curation
Development (contributed revenue generation)
Employee resources (HR)
Board of Directors
Marketing
Operations
Programming
Research (historic info)
Historic Image
Non Historic Image
"""


"""
    --- GEMINI SUPPORTS THE FOLLOWING FILE TYPES:---
  Code files including C, CPP, PY, JAVA, PHP, SQL, and HTML*
  Document files: DOC, DOCX, PDF, RTF, DOT, DOTX, HWP, HWPX
  Documents created in Google Docs
  Images including PNG, JPG, JPEG, WEBP, and HEIF
  Plain text files: TXT
  Presentation files: PPTX
  Presentations created with Google Slides
  Spreadsheet files: XLS, XLSX*
  Spreadsheets created in Google Sheets*
  Tabular data files: CSV, TSV*
  Videos: MP4, MPEG, MOV, AVI, X-FLV, MPG, WEBM, WMV, 3GPP
"""

""" 
  The GUI will be built using Tkinter,
  and it works best to have a class associated with the GUI.
"""


class TaggerMenu(object):
    def __init__(self, rootWindow) -> None:
        self.moveFiles = False  # Used to determine if files should be MOVED or COPIED

        self.root = rootWindow
        self.root.title("Google Drive Tagger")
        self.root.geometry("750x450")

        self.service = None  # Used to make calls to Drive API
        self.geminiKey = None
        self.geminiClient = None  # Used to make calls to Gemini API

        self.debugMessageQueue = (
            queue.Queue()
        )  # Used to update the debug label in the GUI from the tagging thread

        # ------- The widgets for the GUI -------
        # self.debugLabel = tk.Label(self.root, justify=tk.LEFT, bg = "gray75") # Used to print what is happening as the program runs
        # self.debugLabelName = tk.Label(self.root, justify=tk.LEFT, text="Debug Output: ", bg = "gray80") # Label for the debug label
        self.debugFrame = tk.Frame(self.root, bg="gray80")
        self.debugLabelName = tk.Label(
            self.debugFrame,
            justify=tk.LEFT,
            text="Debug Output: ",
            bg="gray80",
            wraplength=700,  # Wrap text at 700 pixels to prevent excessive width
        )

        self.geminiKeyLabel = tk.Label(
            self.root, text="Enter your Gemini API Key:", justify=tk.LEFT
        )  # Label for Gemini API key textbox
        self.geminiApiEntry = tk.Entry(self.root)  # Textbox for entering Gemini API key

        self.tagButton = tk.Button(
            self.root, text="Perform file tagging", command=self.tagButtonClicked
        )  # Runs method to analyze each file w/ Gemini and add tag accordingly
        self.copySortButton = tk.Button(
            self.root,
            text="COPY tagged files into organized folder",
            command=self.copySortButtonClicked,
            state=tk.DISABLED,
        )  # Runs method to organize files based on tag and creation date
        self.moveSortButton = tk.Button(
            self.root,
            text="MOVE tagged files into organized folder",
            command=self.moveSortButtonClicked,
            state=tk.DISABLED,
        )  # Runs method to organize files based on tag and creation date

        instructionString = "Please ensure credentials.json is in the same folder as this program.\n\nYou will need to click 'Perform file tagging' before files can be sorted.\n\nThe free tier of Google Gemini can only process 400 messages per day.\n\nIf you have more than 400 files then you will need to run this across multiple days."

        self.instructionLabel = tk.Label(
            self.root,
            text=instructionString,
            justify=tk.LEFT,
            font=("Verdana", 10),
            bg="gray75",
        )

        self.drawMainMenu()
        self.checkQueue()

    def authenticateDriveAPI(self) -> "drive_v3.Resource" | None:
        if self.verifyJsonPresent():
            # The following is copied from the Drive API documentation quickstart guide
            creds = None
            flow = None

            try:
                if os.path.exists("token.json"):
                    creds = Credentials.from_authorized_user_file("token.json", SCOPES)
                # If there are no (valid) credentials available, let the user log in.
                if not creds or not creds.valid:
                    if creds and creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                    else:
                        flow = InstalledAppFlow.from_client_secrets_file(
                            "credentials.json", SCOPES
                        )
                        creds = flow.run_local_server(port=0)
                    # Save the credentials for the next run
                    with open("token.json", "w") as token:
                        token.write(creds.to_json())

                return build("drive", "v3", credentials=creds)
            except Exception as e:
                self.updateDebugMessageQueue(
                    f"An error occurred during Drive authentication"
                )
                return None

    """
  Checks if folder exists, returns True if it does.
  Othwerise, creates the folder then returns True. 
  Optionally, you can provide the parent folder ID to have nested folders.
  This method WILL NOT copy a file if there is a file with the same name in the destination folder.
  The idea is that if there already is a file with the same name, then this method has been run before on said file. 
"""

    def checkIfFolderExists(self, folderName, parentFolderId=None):

        try:
            # Note that the Drive API treats folders as a file with the MIME type of "application/vnd.google-apps.folder"
            query = f"name='{folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
            if parentFolderId:
                query += f" and '{parentFolderId}' in parents"

            # Check if folder already exists:
            results = (
                self.service.files()
                .list(q=query, spaces="drive", fields="files(id, name)")
                .execute()
            )
            items = results.get("files", [])

            if items:  # Folder exists
                return items[0].get("id")
            else:
                # Folder doesn't exist, so construct it

                # Define metadata for the new folder
                fileMetadata = {
                    "name": folderName,
                    "mimeType": "application/vnd.google-apps.folder",
                }

                # If parentFolderId is provided, set it as the parent in the metadata
                if parentFolderId:
                    fileMetadata["parents"] = [parentFolderId]

                # Create the folder
                file = (
                    self.service.files()
                    .create(body=fileMetadata, fields="id")
                    .execute()
                )
                folderId = file.get("id")

                if folderId:
                    return folderId
                else:
                    self.updateDebugMessageQueue(
                        "Problem with creating the folder (no ID returned)"
                    )

        except HttpError as error:
            self.updateDebugMessageQueue("Http error when checking or creating folder")
        except Exception as e:
            self.updateDebugMessageQueue(
                "Error occurred when checking or creating folder"
            )

    """
  Moves a file from its current location to a specified destination folder in Google Drive.

  Returns the ID of the moved file if successful, None otherwise.
  """

    def moveFileToFolder(self, fileId, destinationFolderId):
        try:
            # Step 1: Get the original file's metadata, specifically its current parents.
            # We need 'parents' to know which folder(s) to remove it from.
            originalFileMetadata = (
                self.service.files()
                .get(
                    fileId=fileId,
                    fields="parents, name",  # Also get name for logging/checking
                )
                .execute()
            )

            currentParents = originalFileMetadata.get("parents", [])
            originalFileName = originalFileMetadata.get("name")

            # Step 1.5: Make sure there isn't already a file with the same name in the destination folder.
            query = f"name = '{originalFileName}' and '{destinationFolderId}' in parents and trashed = false"
            results = (
                self.service.files().list(q=query, fields="files(id, name)").execute()
            )

            existingFiles = results.get("files", [])

            if existingFiles:
                # A file with the same name already exists in the destination folder.
                self.updateDebugMessageQueue(
                    f"File '{originalFileName}' already exists in folder {destinationFolderId}. Skipping move to avoid duplicate names."
                )
                return None  # Indicate that no move was performed

            # Step 2: Prepare the metadata for the update operation.

            # We need to specify the file ID in the update call, but no body is strictly
            # necessary if only parents are changing via addParents/removeParents.
            # However, for consistency and future expansion, an empty body is often used.
            file_body = {}

            # Step 3: Execute the update operation to move the file.
            # pylint: disable=maybe-no-member
            movedFile = (
                self.service.files()
                .update(
                    fileId=fileId,
                    body=file_body,  # Can be empty if only changing parents
                    addParents=destinationFolderId,
                    removeParents=",".join(
                        currentParents
                    ),  # Comma-separated list of parent IDs to remove
                    fields="id, name, parents",  # Request parents back to confirm
                )
                .execute()
            )

            movedFileId = movedFile.get("id")
            if movedFileId:
                self.updateDebugMessageQueue(
                    f"Moved file {fileId} (name: '{originalFileName}') to folder {destinationFolderId}."
                )
                return movedFileId
            else:
                self.updateDebugMessageQueue(
                    "Problem with moving the file (no ID returned)"
                )
                return None

        except HttpError as error:
            self.updateDebugMessageQueue(f"HTTP Error: Could not move file: {error}")
            return None
        except Exception as e:
            self.updateDebugMessageQueue(f"Error: Could not move file: {e}")
            return None

    def copyFileToFolder(self, fileId, destinationFolderId):
        try:
            # Step 1: Get the original file's metadata, including its name and properties.
            # We need 'name' to give the copied file the same name, and 'properties'
            # to transfer the custom 'tag'.
            originalFileMetadata = (
                self.service.files()
                .get(fileId=fileId, fields="name, properties")
                .execute()
            )

            originalFileName = originalFileMetadata.get("name")
            originalProperties = originalFileMetadata.get("properties", {})

            # Extract the 'tag' value if it exists
            tagValue = originalProperties.get("tag")

            # Step 1.5 Ensure that there isn't already a file with the same name in
            # the destination folder. (If there is, don't copy file to it because this means the copy method has already been called for this file)

            query = f"name = '{originalFileName}' and '{destinationFolderId}' in parents and trashed = false"

            # Execute the search query
            results = (
                self.service.files()
                .list(
                    q=query,
                    fields="files(id, name)",  # We only need id and name for the check
                )
                .execute()
            )

            existingFiles = results.get("files", [])

            if existingFiles:
                # A file with the same name already exists in the destination folder
                self.updateDebugMessageQueue(
                    f"File '{originalFileName}' already exists in folder {destinationFolderId}. Skipping copy."
                )
                return None  # Indicate that no copy was performed

            # Step 2: Prepare the metadata for the copied file.
            # This includes the name, the parent folder, and the properties.
            copiedFileMetadata = {
                "name": originalFileName,
                "parents": [destinationFolderId],
            }

            # If the original file had a 'tag', include it in the new file's properties.
            # We create a new dictionary for properties to ensure it's clean.
            if tagValue:
                copiedFileMetadata["properties"] = {"tag": tagValue}
            else:
                # If no tag, ensure properties are not explicitly set or are empty
                # to avoid transferring other unwanted properties if they existed.
                copiedFileMetadata["properties"] = {}

            # Step 3: Execute the copy operation.
            # pylint: disable=maybe-no-member
            copiedFile = (
                self.service.files()
                .copy(
                    fileId=fileId,
                    body=copiedFileMetadata,
                    fields="id, name, parents, properties",  # Request properties back to confirm
                )
                .execute()
            )

            copiedFileId = copiedFile.get("id")
            if copiedFileId:
                self.updateDebugMessageQueue(f"Copied {fileId} to {copiedFileId}")
                return copiedFileId
            else:
                self.updateDebugMessageQueue(
                    "Problem with copying the file (no ID returned)"
                )
                return None

        except HttpError as error:
            self.updateDebugMessageQueue(f"An API error occurred during file copy")
            return None
        except Exception as e:
            self.updateDebugMessageQueue(
                f"An unexpected error occurred during file copy"
            )
            return None

    def updateTagMetadata(self, fileId, tagValue):

        new_properties = {"tag": tagValue}

        file_metadata = {"properties": new_properties}

        try:
            updatedFile = (
                self.service.files()
                .update(
                    fileId=fileId,
                    body=file_metadata,
                    # Specify 'properties' in fields to get them back in the response
                    fields="id,name,properties",
                )
                .execute()
            )

            self.updateDebugMessageQueue(
                f"Successfully tagged file '{updatedFile.get('name')}'."
            )
            return True
        except HttpError as error:
            self.updateDebugMessageQueue(
                f"An error occurred while updating file metadata"
            )
            return False

    # 1) Downloads a file from Google Drive
    # 2) Calls promptGemini() to analyze it
    # 3) Updates metadata with the tag (or 'Uncategorized' if there is an issue)
    def downloadFileAndUpdateMetadata(self, fileId, mimeType):
        temp_file_path = None

        try:
            # First, check if the file type is compatible with Gemini
            # If it isn't, set the tag is 'Uncategorized'
            fileType = mimetypes.guess_extension(
                mimeType, strict=False
            )  # use the mimetypes library to extract file type

            if (fileType is None) or (fileType not in geminiCompatibleFileTypes):
                self.updateDebugMessageQueue(
                    "Setting incompatible file as 'Uncategorized'"
                )
                self.updateTagMetadata(fileId, "Uncategorized")
                return

            request = self.service.files().get_media(fileId=fileId)
            file = io.BytesIO()
            downloader = MediaIoBaseDownload(file, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
                self.updateDebugMessageQueue(
                    f"Downloaded to memory: {int(status.progress() * 100)}."
                )

            # Reset the file pointer to the beginning of the stream
            file.seek(0)

            # Convert the byte stream to a temporary file so that Gemini can actually use it
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=fileType
            ) as temp_file:  #
                temp_file.write(file.getvalue())
                temp_file_path = temp_file.name

            if temp_file_path:
                # All the conditions are met to send the file to Gemini
                tagValue = self.promptGemini(temp_file_path, documentAnalyzerPrompt)
            else:
                self.updateDebugMessageQueue(
                    f"Error creating temporary file for {fileId}"
                )
                tagValue = "Uncategorized"

            if tagValue == "DAILY_LIMIT_EXCEEDED":
                return tagValue

            self.updateTagMetadata(fileId, tagValue)

        except Exception as error:
            self.updateDebugMessageQueue(f"An error occurred: {error}")
            file = None
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)  # Clean up the temporary file
                    self.updateDebugMessageQueue(
                        f"Temporary file {temp_file_path} deleted successfully."
                    )
                except Exception as e:
                    self.updateDebugMessageQueue(f"Error deleting temporary file: {e}")

    def promptGemini(self, tempFilePath, promptMessage):
        """
        gemini-2.0-flash-lite rate limits:
        - 30 requests per minute
        - 200 requests per day
        """

        # Attempt a finite number of times incase rate limit is exceeded
        for _ in range(5):

            try:
                self.updateDebugMessageQueue(
                    f"Attempting to upload file to Gemini: {tempFilePath}"
                )
                myfile = self.geminiClient.files.upload(file=tempFilePath)
                self.updateDebugMessageQueue(
                    f"Successfully uploaded file to Gemini: {myfile.name}"
                )

                response = self.geminiClient.models.generate_content(
                    model="gemini-2.0-flash-lite", contents=[promptMessage, myfile]
                )

                cleanedResponse = response.text.strip()

                if cleanedResponse in validTags:
                    self.updateDebugMessageQueue(
                        f"Gemini returned valid tag: {cleanedResponse}"
                    )
                    return cleanedResponse
                else:
                    self.updateDebugMessageQueue(
                        "Invalid Gemini response. Setting tag as 'Uncategorized'"
                    )
                    return "Uncategorized"

            except GoogleAPIError as error:
                if error.code == 429:
                    self.updateDebugMessageQueue(
                        "Daily Gemini rate limit exceeded. Please try again in 24 hours."
                    )
                    return "DAILY_LIMIT_EXCEEDED"
                else:
                    self.updateDebugMessageQueue(
                        f"An unexpected error occurred: {error}"
                    )
            except Exception as e:
                return "Uncategorized"  # If there is an error, it is likely because of an invalid file type, so return 'Uncategorized'

    def verifyGeminiKey(self) -> bool:
        self.geminiKey = (
            self.geminiApiEntry.get().strip()
        )  # Get the key from the entry box

        if not self.geminiKey or self.geminiKey == "":
            self.updateDebugMessageQueue("Please enter a valid Gemini API key.")
            return False

        # Verify that the Gemini API key is valid by making a simple request
        try:
            self.geminiClient = genai.Client(api_key=self.geminiKey)
            response = (
                self.geminiClient.models.list()
            )  # This will raise an error if the key is invalid
            self.updateDebugMessageQueue(f"Gemini API key is valid.")
            return True
        except Exception as e:
            self.updateDebugMessageQueue(f"Invalid Gemini API key")
            return False

    # Checks if the Json file from the Google Cloud project is present.
    def verifyJsonPresent(self) -> bool:
        filename = "credentials.json"
        if os.path.exists(filename):
            self.updateDebugMessageQueue(f"'{filename}' found successfully")
            return True
        else:
            self.updateDebugMessageQueue(
                f"'{filename}' not present in the current directory"
            )
            return False

    def updateDebugMessageQueue(self, message) -> None:
        self.debugMessageQueue.put(message)

    def checkQueue(self) -> None:
        """Checks the queue for new messages and updates the debug label."""
        try:
            while True:
                message = self.debugMessageQueue.get_nowait()
                self.debugLabelName.config(text=f"Debug Output: {message}")
                self.root.update_idletasks()  # Force GUI update
        except queue.Empty:
            pass  # No messages in the queue

        # Schedule this method to run again after a short delay (e.g., 100 ms)
        self.after_id = self.root.after(100, self.checkQueue)

    """
    Crawls through the user's Google Drive and analyzes each file compatible with Gemini.
    Designed to look at all files in the Drive (ignoring ones that already have a tag),
    so that it can be run again if it previously crashed or failed. 
  """

    def tagEachFile(self) -> None:
        pageToken = (
            None  # Used to request the next step of 1000 files from the Drive API
        )
        pageSize = (
            20  # The number of files to retrieve (max allowed per request is 1000)
        )

        try:
            while True:
                nextFilesBatch = []  # The next batch of files to perform tagging on

                # Get the json file containing the list of files from the Drive API
                retrievedFilesJson = (
                    self.service.files()
                    .list(
                        pageSize=pageSize,
                        fields="nextPageToken, files(id, name, mimeType)",
                        pageToken=pageToken,
                    )
                    .execute()
                )

                fileItems = retrievedFilesJson.get("files", [])
                if not fileItems:
                    # self.debugLabel.config(text="No files retrieved from Drive API.")
                    self.updateDebugMessageQueue("No files retrieved from Drive API.")
                    return

                for item in fileItems:
                    nextFilesBatch.append((item["id"], item["mimeType"]))

                # self.debugLabel.config(text=f"Successfully retrieved {len(nextFilesBatch)} files from Drive API.")
                self.updateDebugMessageQueue(
                    f"Successfully retrieved {len(nextFilesBatch)} files from Drive API."
                )

                for file in nextFilesBatch:
                    fileId = file[0]
                    mimeType = file[1]

                    # CHECK IF FILE ALREADY HAS TAG
                    fileMetadata = (
                        self.service.files()
                        .get(fileId=fileId, fields="properties")
                        .execute()
                    )

                    if ("properties" in fileMetadata) and (
                        "tag" in fileMetadata["properties"]
                    ):
                        # self.debugLabel.config(text="File already has tag, skipping analysis")
                        self.updateDebugMessageQueue(
                            "File already has tag, skipping analysis"
                        )
                    else:
                        # File doesn't have tag, so analyze it
                        # self.debugLabel.config(text=f"Analyzing file {fileId}")
                        self.updateDebugMessageQueue(f"Analyzing file {fileId}")
                        returnedValue = self.downloadFileAndUpdateMetadata(
                            fileId, mimeType
                        )
                        if returnedValue == "DAILY_LIMIT_EXCEEDED":
                            return

                # Update the pageToken for the next iteration
                pageToken = retrievedFilesJson.get("nextPageToken", None)

                # If there's no nextPageToken, we've processed all files
                if not pageToken:
                    # self.debugLabel.config(text="Done tagging Drive files")
                    self.updateDebugMessageQueue("Done tagging Drive files")
                    self.copySortButton.config(state=tk.NORMAL)
                    self.moveSortButton.config(state=tk.NORMAL)
                    return

        except HttpError as error:
            self.updateDebugMessageQueue(
                "An HTTP error occurred while retrieving files"
            )
            return
        except Exception as e:
            self.updateDebugMessageQueue(
                f"An error occurred while retrieving files: {e}"
            )
            return1

    def organizeFiles(self) -> None:
        # All files, once tagged, will be COPIED into a folder by this name.
        # Copied and not moved in case something goes wrong.
        baseOrganizedFilesFolderName = "Organized-Drive-Files"

        # Very similar to tagEachFile() in that it retrieves all file IDs from the Drive API

        # Ensure the base folder where all organization will take place exists
        baseFolderId = self.checkIfFolderExists(folderName=baseOrganizedFilesFolderName)

        if baseFolderId:
            # self.debugLabel.config(text=f"Base folder '{baseOrganizedFilesFolderName}' exists, proceeding with organization.")
            self.updateDebugMessageQueue(
                f"Base folder '{baseOrganizedFilesFolderName}' exists, proceeding with organization."
            )

            pageToken = (
                None  # Used to request the next step of 1000 files from the Drive API
            )
            pageSize = 1000  # The number of files to retrieve (max allowed per request is 1000)

            # This next part is pretty ugly, but does the following:
            # 1 - Iteratively retrieves each file from the Drive
            # 2 - Extracts the year and month from the file's creation date
            # 3 - Checks if the year and month folders exist, creating them if they don't
            # 4 - Checks if the tag folder exists, creating it if it doesn't
            # 5 - Copies the file to the tag folder, preserving its name and properties
            # Note that if a file has an issue being copied, it simply moves on to the next file.
            try:
                while True:
                    # Get the json file containing the list of files from the Drive API
                    retrievedFilesJson = (
                        self.service.files()
                        .list(
                            pageSize=pageSize,
                            fields="nextPageToken, files(id, name, createdTime, properties)",
                            pageToken=pageToken,
                        )
                        .execute()
                    )

                    fileItems = retrievedFilesJson.get("files", [])
                    if not fileItems:
                        # self.debugLabel.config(text="No more files retrieved from Drive API.")
                        self.updateDebugMessageQueue(
                            "No more files retrieved from Drive API."
                        )
                        return

                    # Now process each retrieved file
                    for item in fileItems:
                        fileId = item.get("id")
                        fileName = item.get("name")
                        createdTimeStr = item.get("createdTime")
                        properties = item.get("properties", {})

                        # Extract the year and month from the createdTime
                        # This part is a bit ugly because createdTime is a RFC 3339 formatted string
                        yearCreated = None
                        monthCreated = None

                        if createdTimeStr:
                            if createdTimeStr.endswith("Z"):
                                createdTimeStr = createdTimeStr[:-1]
                            if "." in createdTimeStr:
                                createdTimeStr = createdTimeStr.split(".")[0]

                            created_dt = datetime.fromisoformat(createdTimeStr)
                            yearCreated = created_dt.year
                            monthCreated = created_dt.month

                        if not yearCreated or not monthCreated:
                            # self.debugLabel.config(text=f"Could not extract year or month from createdTime: {createdTimeStr}")
                            self.updateDebugMessageQueue(
                                f"Could not extract year or month from createdTime: {createdTimeStr}"
                            )
                            continue

                        # Reminder that the series of folders these files will be stored in is:
                        # Organized-Drive-Files/Year/Month/Tag/FileName

                        yearFolderId = self.checkIfFolderExists(
                            str(yearCreated), baseFolderId
                        )

                        if yearFolderId:
                            # self.debugLabel.config(text=f"Year folder for {yearCreated} exists, proceeding with month organization.")
                            self.updateDebugMessageQueue(
                                f"Year folder for {yearCreated} exists, proceeding with month organization."
                            )

                            # monthCreated is a number, so find the word (aka 7 -> July) for better folder naming
                            monthCreatedWord = numberToMonth[monthCreated]

                            monthFolderId = self.checkIfFolderExists(
                                monthCreatedWord, yearFolderId
                            )
                            if monthFolderId:
                                # self.debugLabel.config(text=f"Month folder for {monthCreatedWord} exists, proceeding with tag organization.")
                                self.updateDebugMessageQueue(
                                    f"Month folder for {monthCreatedWord} exists, proceeding with tag organization."
                                )

                                # Now check the tag
                                tagValue = properties.get(
                                    "tag"
                                )  # Default to 'Uncategorized' if no tag exists

                                if tagValue:
                                    tagFolderId = self.checkIfFolderExists(
                                        tagValue, monthFolderId
                                    )

                                    if tagFolderId:

                                        # Determine if file will be copied or moved
                                        if self.moveFiles:
                                            self.updateDebugMessageQueue(
                                                f"Tag folder for '{tagValue}' exists, proceeding with file moving."
                                            )

                                            movedFileId = self.moveFileToFolder(
                                                fileId, tagFolderId
                                            )

                                            if movedFileId:
                                                self.updateDebugMessageQueue(
                                                    f"Successfully moved file to tag folder '{tagValue}' (ID: {movedFileId})"
                                                )
                                            else:
                                                self.updateDebugMessageQueue(
                                                    "Failed to move file to tag folder"
                                                )
                                        else:
                                            self.updateDebugMessageQueue(
                                                f"Tag folder for '{tagValue}' exists, proceeding with file copying."
                                            )

                                            copiedFileId = self.copyFileToFolder(
                                                fileId, tagFolderId
                                            )

                                            if copiedFileId:
                                                self.updateDebugMessageQueue(
                                                    f"Successfully copied file {fileId} to tag folder '{tagValue}' (ID: {copiedFileId})"
                                                )
                                            else:
                                                self.updateDebugMessageQueue(
                                                    "Failed to copy file to tag folder"
                                                )

                                    else:
                                        uncategorizedFolderId = (
                                            self.checkIfFolderExists(
                                                "Uncategorized", monthFolderId
                                            )
                                        )

                                        if uncategorizedFolderId:
                                            self.updateDebugMessageQueue(
                                                "No tag associated with file, so copying to 'Uncategorized' folder"
                                            )

                                            if self.moveFiles:
                                                movedFileId = self.moveFileToFolder(
                                                    fileId, uncategorizedFolderId
                                                )

                                                if movedFileId:
                                                    self.updateDebugMessageQueue(
                                                        f"Successfully moved file {fileId} to 'Uncategorized' folder (ID: {movedFileId})"
                                                    )
                                                else:
                                                    self.updateDebugMessageQueue(
                                                        "Failed to move file to 'Uncategorized' folder"
                                                    )
                                            else:
                                                copiedFileId = self.copyFileToFolder(
                                                    fileId, uncategorizedFolderId
                                                )

                                                if copiedFileId:
                                                    self.updateDebugMessageQueue(
                                                        f"Successfully copied file {fileId} to 'Uncategorized' folder (ID: {copiedFileId})"
                                                    )
                                                else:
                                                    self.updateDebugMessageQueue(
                                                        "Failed to copy file to 'Uncategorized' folder"
                                                    )

                    # Update the pageToken for the next iteration
                    pageToken = retrievedFilesJson.get("nextPageToken", None)

                    # If there's no nextPageToken, we've processed all files
                    if not pageToken:
                        self.updateDebugMessageQueue(
                            "All files processed, exiting organizeFiles()."
                        )
                        return

            except HttpError as error:
                self.updateDebugMessageQueue(
                    f"An HTTP error occurred while retrieving files for sorting"
                )
                return
            except Exception as e:
                self.updateDebugMessageQueue(
                    f"An error occurred while retrieving files for sorting"
                )
                return

    def tagButtonClicked(self) -> None:
        # 0. Verify Drive API is authenticated
        self.service = self.authenticateDriveAPI()

        if self.service:

            # 1. Verify Gemini key is valid
            if self.verifyGeminiKey():

                # 2. Verify credentials.json file is present
                if self.verifyJsonPresent():
                    # self.debugLabel.config(text="Proceeding with tagging")
                    # self.tagEachFile()
                    taggingThread = threading.Thread(target=self.tagEachFile)
                    taggingThread.daemon = True
                    taggingThread.start()
                else:
                    return

    def copySortButtonClicked(self) -> None:
        self.moveFiles = False
        # Must run organizeFiles() in a thread otherwise the GUI will appear to freeze up
        # since no other components can be updated while the method is running
        sortingThread = threading.Thread(target=self.organizeFiles)
        sortingThread.daemon = True
        sortingThread.start()

    def moveSortButtonClicked(self) -> None:
        self.moveFiles = True
        # Must run organizeFiles() in a thread otherwise the GUI will appear to freeze up
        # since no other components can be updated while the method is running
        sortingThread = threading.Thread(target=self.organizeFiles)
        sortingThread.daemon = True
        sortingThread.start()

    def drawMainMenu(self) ->  None:
        self.instructionLabel.grid(
            row=0, column=0, columnspan=10, padx=0, pady=10, sticky=tk.W
        )

        # Place the debugFrame in the grid, spanning columns
        self.debugFrame.grid(
            row=1, column=0, columnspan=7, padx=0, pady=10, sticky=tk.W
        )
        # Pack the debugLabelName inside the debugFrame
        self.debugLabelName.pack(side=tk.LEFT, fill=tk.X)
        # self.debugLabelName.grid(row=1, column=0, columnspan=7, padx=0, pady=10, sticky=tk.W) # Label for the debug label
        # self.debugLabel.grid(row=1, column=1, columnspan=3, padx=0, pady=10, sticky=tk.W)

        self.geminiKeyLabel.grid(row=2, column=0, padx=10, pady=10, sticky=tk.W)
        self.geminiApiEntry.grid(
            row=2, column=1, columnspan=2, padx=10, pady=10, sticky=tk.W
        )

        self.tagButton.grid(row=3, column=0, padx=10, pady=10, sticky=tk.W)
        self.copySortButton.grid(row=3, column=1, padx=10, pady=10, sticky=tk.W)
        self.moveSortButton.grid(row=4, column=1, padx=10, pady=10, sticky=tk.W)


def main() -> None:
    rootWindow = tk.Tk()
    app = TaggerMenu(rootWindow)
    rootWindow.mainloop()


if __name__ == "__main__":
    main()

    """
    TODO / NEXT STEPS:
    - Update README
  """
