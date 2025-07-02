'''
The following is a basic pipeline for downloading a file from Google Drive, 
and having Gemini analyze it. 

It works by downloading the file from Google Drive as intermediate byte data, 
which it then converts in to a temporary file (so that the user's hard drive isn't clogged up with all the data from the Drive).
Finally, it sends the temporary file to Gemini for analysis. 

The next step will be to use the metadata API to store this tag in the metadata of the actual Drive file.
'''


'''
This program requires you to download the credentials.json file from your Google Cloud project.
I will make a readme explaining how to do this later. 
'''
import io

import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Other misc. libraries
# from PIL import Image
from google import genai
import tempfile
import mimetypes

import os
from dotenv import load_dotenv
load_dotenv()

#import google.generativeai as genai
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

validTags = ['Machine Learning', 'Philosophy', 'Historic Image', 'Non-Historic Image']
geminiCompatibleFileTypes = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'] # TODO UPDATE THIS LIST AS NEEDED

# First scope used to download drive files and update labels (tags)
# Second scope used to create the label in the first place that will be associated with metadata
# NOTE: This means that to use this program, you must use a Google account with admin access to the Google Drive
SCOPES = ["https://www.googleapis.com/auth/drive"]

# "https://www.googleapis.com/auth/drive.admin.labels"

imageAnalyzerPrompt = """You are an AI model tasked with analyzing images to classify them as either Historic Image or Non-Historic Image. A Historic Image is a photograph taken before the modern era (approximately pre-1980s, before widespread digital photography), typically characterized by specific visual and contextual cues. A Non-Historic Image is a photograph taken with modern camera equipment (approximately 1980s or later, including digital cameras and smartphones). Your response must ONLY be "Historic Image" or "Non-Historic Image" with no additional explanation or text.

To classify the image that you have been provided with, analyze the following details:

1. **Image Quality and Characteristics:**
   - **Historic Image**: Look for grainy textures, low resolution, faded colors, sepia or black-and-white tones, uneven exposure, or visible film imperfections (e.g., scratches, dust, or chemical stains).
   - **Non-Historic Image**: Look for high resolution, sharp details, vibrant or natural colors, consistent exposure, and clean, digital-quality visuals typical of modern cameras or smartphones.

2. **Contextual Elements:**
   - **Historic Image**: Presence of period-specific elements such as vintage clothing (e.g., 19th or early 20th-century fashion), old-fashioned vehicles (e.g., horse-drawn carriages, early automobiles), or historical architecture (e.g., pre-modern buildings without contemporary design elements). May include analog photo borders or timestamps from early film cameras.
   - **Non-Historic Image**: Presence of modern elements such as contemporary clothing, recent car models, smartphones, modern buildings with glass or steel designs, or digital watermarks/timestamps.

3. **Technological Indicators:**
   - **Historic Image**: Evidence of older photographic techniques, such as soft focus, limited depth of field, or signs of early flash photography (e.g., harsh shadows or overexposed spots). May include physical photo damage like creases or tears.
   - **Non-Historic Image**: Signs of digital photography, such as lens flares typical of modern lenses, high dynamic range (HDR), or metadata-like digital timestamps embedded in the image.

Classify the image based on these criteria and return ONLY Historic Image or Non-Historic Image, and nothing else
"""

fileAndPromptDict = {
    ".jpg": imageAnalyzerPrompt,
    ".jpeg": imageAnalyzerPrompt,
    ".png": imageAnalyzerPrompt,
}

# Provides Gemini with a file and has it return a tag
def promptGemini(temp_file_path, promptMessage):

  myfile = client.files.upload(file=temp_file_path)

  response = client.models.generate_content(
      model="gemini-2.0-flash-lite", contents=[
          promptMessage,
          myfile 
      ])

  cleanedResponse = response.text.strip()

  if cleanedResponse in validTags:
      print(f"Gemini returned valid tag: {cleanedResponse}")
      return cleanedResponse
  else:
    print(f"Invalid response from Gemini: {cleanedResponse}.\nValid tags are: {validTags}")
    print("Setting tag to 'Uncategorized' in meantime.")
    return "Uncategorized"

# Sets up authentication needed to access Drive API
# Returns the service object for the Drive API
def authenticateDriveAPI():
  creds = None
  flow = None

  try:
    if os.path.exists('token.json'):
      creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
      if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
      else:
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json',
                                                        SCOPES)
        creds = flow.run_local_server(port=0)
      # Save the credentials for the next run
      with open('token.json', 'w') as token:
        token.write(creds.to_json())

    return build("drive", "v3", credentials=creds)
  except Exception as e:
    print(f"An error occurred during authentication: {e}")
    exit(1)

# Stores a file's tag in its metadata.
# Returns True if successful, False otherwise.
def updateTagMetadata(fileId, tagValue, service):

  new_properties = {
      "tag": tagValue
  }

  file_metadata = {
      "properties": new_properties
  }

  try:
    updatedFile = service.files().update(
          fileId=fileId,
          body=file_metadata,
          # Specify 'properties' in fields to get them back in the response
          fields='id,name,properties'
      ).execute()

    print(f"Successfully updated file '{updatedFile.get('name')}' (ID: {updatedFile.get('id')}).")
    print(f"New/Updated properties: {updatedFile.get('properties')}")
    return True
  except HttpError as error:
    print(f"An error occurred while updating metadata: {error}")
    return False

# Downloads a file from Google Drive and 
# calls promptGemini() to analyze it
def download_file(fileId, service):
  #creds, _ = google.auth.default()
  # create drive api client

  try:
    # Gemini must be provided witht he mim type of the file, so get that now
    file_metadata = service.files().get(fileId=fileId, fields="mimeType").execute()
    mime_type = file_metadata.get("mimeType")
    print(f"MIME Type: {mime_type}")

    
    request = service.files().get_media(fileId=fileId)
    file = io.BytesIO()
    downloader = MediaIoBaseDownload(file, request)
    done = False
    while done is False:
      status, done = downloader.next_chunk()
      print(f"Downloaded to memory: {int(status.progress() * 100)}.")
    
    # Reset the file pointer to the beginning of the stream
    file.seek(0)

    fileType = mimetypes.guess_extension(mime_type)

    if (fileType is not None) and (fileType in geminiCompatibleFileTypes):
      # Convert the byte stream to a temporary file so that Gemini can actually use it
      with tempfile.NamedTemporaryFile(delete=False, suffix=fileType) as temp_file: # 
        temp_file.write(file.getvalue())
        temp_file_path = temp_file.name 
      
      promptMessage = fileAndPromptDict[fileType]
      tagValue = promptGemini(temp_file_path, promptMessage)

      updateTagMetadata(fileId, tagValue, service)
    
    elif (fileType is not None) and (fileType not in geminiCompatibleFileTypes):
      print(f"File type {fileType} is not compatible with Gemini")
      print("Setting tag to 'Uncategorized' in meantime.")
      updateTagMetadata(fileId, "Uncategorized", service)
    
    else:
      print(f"Could not determine file type for file ID {fileId}.")
      print("Setting tag to 'Uncategorized' in meantime.")
      updateTagMetadata(fileId, "Uncategorized", service)
    
  except HttpError as error:
    print(f"An error occurred: {error}")
    file = None

# Crawls through the user's Google Drive and analyzes each file compatible with Gemini
def crawlDrive():
  # TODO
  # Check if file already has tag
  # If no tag, or if tag is 'Uncategorized', then analyze it
  pass

def main():
  service = authenticateDriveAPI()
  download_file("1yZd5pAI3WTIPyH67_QBHFBZ10Fk6tMRX", service)

if __name__ == "__main__":
  # For testing purposes, use an image of a cat with a crab on its head
  # from my Drive. Ultimately the program will crawl through all files in the Drive
  main()

  # TODO / NOTE TO SELF:
  # Trying to simply read labels first to see how permissions work. 