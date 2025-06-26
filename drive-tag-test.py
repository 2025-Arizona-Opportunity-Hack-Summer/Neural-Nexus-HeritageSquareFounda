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

import os
from dotenv import load_dotenv
load_dotenv()

#import google.generativeai as genai
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SCOPES = ["https://www.googleapis.com/auth/drive"]

def promptGemini(temp_file_path):

  myfile = client.files.upload(file=temp_file_path)

  response = client.models.generate_content(
      model="gemini-2.0-flash-lite", contents=[
          "Analyze the attached image file and provide a brief description of its contents.",
          myfile 
      ])

  # TODO: Make sure the LLM responded with a valid tag since LLMs can be unpredictable
  # TODO: emini seems to add invisible characters, so clean the string before checking
  response = response.text
  print(f"Response:\n\n{response}\n\n")

def download_file(real_file_id):
  #creds, _ = google.auth.default()
  flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
  creds = flow.run_local_server(port=0)

  try:
    # create drive api client
    service = build("drive", "v3", credentials=creds)

    file_id = real_file_id

    # Gemini must be provided witht he mim type of the file, so get that now
    file_metadata = service.files().get(fileId=file_id, fields="mimeType").execute()
    mime_type = file_metadata.get("mimeType")
    print(f"MIME Type: {mime_type}")

    # pylint: disable=maybe-no-member
    request = service.files().get_media(fileId=file_id)
    file = io.BytesIO()
    downloader = MediaIoBaseDownload(file, request)
    done = False
    while done is False:
      status, done = downloader.next_chunk()
      print(f"Downloaded to memory: {int(status.progress() * 100)}.")
    
    # Reset the file pointer to the beginning of the stream
    file.seek(0)

    # Convert the byte stream to a temporary file so that Gemini can actually use it
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
      temp_file.write(file.getvalue())
      temp_file_path = temp_file.name 
    
    promptGemini(temp_file_path)

  except HttpError as error:
    print(f"An error occurred: {error}")
    file = None


if __name__ == "__main__":
  # For testing purposes, use an image of a cat with a crab on its head
  # from my Drive. Ultimately the program will crawl through all files in the Drive
  download_file(real_file_id="1yZd5pAI3WTIPyH67_QBHFBZ10Fk6tMRX")