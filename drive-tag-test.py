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
from datetime import datetime

import os
from dotenv import load_dotenv
load_dotenv()

#import google.generativeai as genai
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

validTags = ['Machine Learning', 'Philosophy', 'Historic Image', 'Non-Historic Image']
geminiCompatibleFileTypes = ['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.doc', '.docx', '.txt'] # TODO UPDATE THIS LIST AS NEEDED
imageFileTypes = ['.png', '.jpg', '.jpeg', '.webp'] # Used because image files will have their own prompt

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

documentAnalyzerPrompt = """You are an AI model tasked with analyzing text documents to classify them as either 'Machine Learning' or 'Philosophy'. Your response must ONLY be "Machine Learning" or "Philosophy" with no additional explanation or text.

To classify the document that you have been provided with, analyze the following details:

1.  **Core Concepts and Terminology:**
    * **Machine Learning**: Look for terms such as "algorithm," "neural network," "deep learning," "AI," "data set," "model training," "supervised learning," "unsupervised learning," "reinforcement learning," "feature engineering," "overfitting," "bias," "accuracy," "precision," "recall," "F1-score," "regression," "classification," "clustering," "computer vision," "natural language processing (NLP)," "generative AI," "transformer," "gradient descent," "backpropagation," "tensor," "frameworks" (e.g., TensorFlow, PyTorch), "computational efficiency," "optimization," "predictive analytics," "big data," "data science," "statistical modeling," "pattern recognition," "artificial general intelligence (AGI)," "ethics in AI," "explainable AI (XAI)," "causality in ML," "reinforcement learning from human feedback (RLHF)."
    * **Philosophy**: Look for terms such as "epistemology," "metaphysics," "ethics," "logic," "aesthetics," "ontology," "existentialism," "phenomenology," "rationalism," "empiricism," "idealism," "materialism," "dualism," "monism," "free will," "determinism," "consciousness," "mind-body problem," "virtue," "justice," "truth," "knowledge," "reason," "morality," "value," "meaning of life," "human nature," "political philosophy," "social contract," "utilitarianism," "deontology," "virtue ethics," "analytic philosophy," "continental philosophy," "philosophy of mind," "philosophy of language," "philosophy of science," "philosophy of religion," "a priori," "a posteriori," "deduction," "induction," "argument," "premise," "conclusion," "fallacy," "critique," "dialectic," "hermeneutics," "postmodernism."

2.  **Subject Matter and Focus:**
    * **Machine Learning**: Documents primarily discussing the development, application, theoretical underpinnings, performance, or societal impact of artificial intelligence systems, data analysis techniques, predictive models, and automation. This includes research papers on new algorithms, tutorials on implementing ML models, discussions on data privacy in AI, or analyses of AI's role in various industries.
    * **Philosophy**: Documents primarily discussing fundamental questions about existence, knowledge, values, reason, mind, and language. This includes analyses of ethical dilemmas, discussions on the nature of reality, explorations of human consciousness, interpretations of historical philosophical texts, or arguments for different theories of knowledge or morality.

3.  **Style and Structure:**
    * **Machine Learning**: Often characterized by a more technical, empirical, or mathematical style, including equations, algorithms, experimental results, data visualizations, and discussions of computational methods. May include code snippets or pseudocode. Focus is on problem-solving, efficiency, and practical application.
    * **Philosophy**: Often characterized by a more abstract, argumentative, and discursive style, involving logical reasoning, conceptual analysis, thought experiments, historical context, and critical evaluation of ideas. Focus is on conceptual clarity, coherence, and the exploration of fundamental questions.

Classify the document based on these criteria and return ONLY "Machine Learning" or "Philosophy", and nothing else.
"""


'''
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
'''
fileAndPromptDict = {
    ".jpg": imageAnalyzerPrompt,
    ".jpeg": imageAnalyzerPrompt,
    ".png": imageAnalyzerPrompt,
    ".pdf": documentAnalyzerPrompt,
    ".txt": documentAnalyzerPrompt,
    ".doc": documentAnalyzerPrompt,
    ".docx": documentAnalyzerPrompt
}

# All files, once tagged, will be COPIED into a folder by this name.
# Copied and not moved in case something goes wrong.
baseOrganizedFilesFolderName = "Organized-Drive-Files"

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
    print("Returning tag as 'Uncategorized'")
    return "Uncategorized"

# Sets up authentication needed to access Drive API
# Returns the service object for the Drive API
def authenticateDriveAPI():
  # The following is copied from the Drive API documentation quickstart guide
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

# 1) Downloads a file from Google Drive  
# 2) Calls promptGemini() to analyze it
# 3) Updates metadata with the tag (or 'Uncategorized' if there is an issue)
def downloadFileAndUpdateMetadata(fileId, mimeType, service):

  try:
    # First, check if the file type is compatible with Gemini
    # If it isn't, set the tag is 'Uncategorized'
    fileType = mimetypes.guess_extension(mimeType) # use the mimetypes library to extract file type
    
    if (fileType is None) or (fileType not in geminiCompatibleFileTypes):
      print(f"File type {fileType} is not compatible with Gemini")
      print("Setting tag to 'Uncategorized'")
      updateTagMetadata(fileId, "Uncategorized", service)
      return
    
    request = service.files().get_media(fileId=fileId)
    file = io.BytesIO()
    downloader = MediaIoBaseDownload(file, request)
    done = False
    while done is False:
      status, done = downloader.next_chunk()
      print(f"Downloaded to memory: {int(status.progress() * 100)}.")
    
    # Reset the file pointer to the beginning of the stream
    file.seek(0)
    
    # Convert the byte stream to a temporary file so that Gemini can actually use it
    with tempfile.NamedTemporaryFile(delete=False, suffix=fileType) as temp_file: # 
      temp_file.write(file.getvalue())
      temp_file_path = temp_file.name 
    
    # All the conditions are met to send the file to Gemini
    promptMessage = fileAndPromptDict[fileType]
    tagValue = promptGemini(temp_file_path, promptMessage)

    updateTagMetadata(fileId, tagValue, service)
    
  except HttpError as error:
    print(f"An error occurred: {error}")
    file = None

'''
  Crawls through the user's Google Drive and analyzes each file compatible with Gemini.
  Designed to look at all files in the Drive (ignoring ones that already have a tag),
  so that it can be run again if it previously crashed or failed. 
'''
def crawlDrive(service):
  pageToken = None # Used to request the next step of 1000 files from the Drive API
  pageSize = 1000 # The number of files to retrieve (max allowed per request is 1000)
  
  try:
    while True:
      nextFilesBatch = [] # The next batch of files to preform tagging on
      
      # Get the json file containing the list of files from the Drive API
      retrievedFilesJson = service.files().list(
          pageSize=pageSize,
          fields="nextPageToken, files(id, name, mimeType)",
          pageToken=pageToken
      ).execute()

      fileItems = retrievedFilesJson.get('files', [])
      if not fileItems:
        print("No files retrieved from Drive API.")
        return
      
      for item in fileItems:
        nextFilesBatch.append( (item['id'], item['mimeType']) )

      print(f"Successfully retrieved {len(nextFilesBatch)} files from Drive API.")
      print("Now performing tagging on each file")

      for file in nextFilesBatch:
        fileId = file[0]
        mimeType = file[1]

        # CHECK IF FILE ALREADY HAS TAG
        fileMetadata = service.files().get(
          fileId=fileId, 
          fields='properties'
        ).execute()

        if ('properties' in fileMetadata) and ('tag' in fileMetadata['properties']):
          print("File already has tag, skipping analysis")
        else:
          # File doesn't have tag, so analyze it
          print(f"Analyzing file ID: {fileId}, MIME Type: {mimeType}")
          downloadFileAndUpdateMetadata(fileId, mimeType, service)

  except HttpError as error:
    print(f"An HTTP error occurred while retrieving files: {error}")
    exit(1)
  except Exception as e:
    print(f"An error occurred while retrieving files: {e}")
    exit(1)

  # Check if file already has tag
  # If no tag, or if tag is 'Uncategorized', then analyze it
  #downloadFileAndUpdateMetadata(fileId, service)


'''
  Checks if folder exists, returns True if it does.
  Othwerise, creates the folder then returns True. 
  Optionally, you can provide the parent folder ID to have nested folders.
'''
def checkIfFolderExists(service, folderName, parentFolderId=None):

  try:

    # Note that the Drive API treats folders as a file with the MIME type of "application/vnd.google-apps.folder"
    query = f"name='{folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    if parentFolderId:
      query += f" and '{parentFolderId}' in parents"

    # Check if folder already exists:
    results = service.files().list(
            q=query,
            spaces='drive',
            fields='files(id, name)').execute()
    items = results.get('files', [])

    if items: # Folder exists
      return True
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
      file = service.files().create(body=fileMetadata, fields="id").execute()
      folderId = file.get("id")
      
      if folderId:
        return folderId
      else:
        print("Problem with creating the folder (no ID returned)")
        exit(1)
    
  except HttpError as error:
    print(f"An error occurred: {error}")
    exit(1)
  except Exception as e:
    print(f"An unexpected error occurred: {e}")
    exit(1)


'''
  Copies (NOT moves) a file to a destination folder.
  I only copy and don't move incase something goes wrong.
'''
def copyFileToFolder(service, fileId, destinationFolderId):
  try:
      # Step 1: Get the original file's metadata, including its name and properties.
      # We need 'name' to give the copied file the same name, and 'properties'
      # to transfer the custom 'tag'.
      originalFileMetadata = service.files().get(
          fileId=fileId,
          fields='name, properties'
      ).execute()

      originalFileName = originalFileMetadata.get('name')
      originalProperties = originalFileMetadata.get('properties', {})

      # Extract the 'tag' value if it exists
      tagValue = originalProperties.get('tag')

      print(f"Attempting to copy file '{originalFileName}' (ID: {fileId})")
      if tagValue:
          print(f"  Original file has 'tag': '{tagValue}'")
      else:
          print("  Original file does not have a 'tag' property.")

      # Step 2: Prepare the metadata for the copied file.
      # This includes the name, the parent folder, and the properties.
      copiedFileMetadata = {
          'name': originalFileName,
          'parents': [destinationFolderId]
      }

      # If the original file had a 'tag', include it in the new file's properties.
      # We create a new dictionary for properties to ensure it's clean.
      if tagValue:
          copiedFileMetadata['properties'] = {'tag': tagValue}
      else:
          # If no tag, ensure properties are not explicitly set or are empty
          # to avoid transferring other unwanted properties if they existed.
          copiedFileMetadata['properties'] = {}


      # Step 3: Execute the copy operation.
      # pylint: disable=maybe-no-member
      copiedFile = service.files().copy(
          fileId=fileId,
          body=copiedFileMetadata,
          fields='id, name, parents, properties' # Request properties back to confirm
      ).execute()

      copiedFileId = copiedFile.get('id')
      if copiedFileId:
        return copiedFileId
      else:
        print("Problem with copying the file (no ID returned)")
        return None

  except HttpError as error:
      print(f"An API error occurred during file copy: {error}")
      return None
  except Exception as e:
      print(f"An unexpected error occurred during file copy: {e}")
      return None

'''
  Organizes files based first on creation date Year/Month, then on Tag.
  To avoid accidentally messing up the drive, this function will 
  use a new folder called Organized-Drive-Files to store COPIES of the original files.
'''
def organizeFiles(service):
  # Very similar to crawlDrive() in that it retrieves all file IDs from the Drive API

  # Ensure the base folder where all organization will take place exists
  baseFolderId = checkIfFolderExists(service, baseOrganizedFilesFolderName)

  if baseFolderId:
    print(f"Base folder '{baseOrganizedFilesFolderName}' exists, proceeding with organization.")

    pageToken = None # Used to request the next step of 1000 files from the Drive API
    pageSize = 1000 # The number of files to retrieve (max allowed per request is 1000)
  
    # This next part is somewhat ugly, but does the following:
    # 1 - Iteratively retrieves each file from the Drive 
    # 2 - Extracts the year and month from the file's creation date
    # 3 - Checks if the year and month folders exist, creating them if they don't
    # 4 - Checks if the tag folder exists, creating it if it doesn't
    # 5 - Copies the file to the tag folder, preserving its name and properties
    # Note that if a file has an issue being copied, it simply moves on to the next file. 
    try:
      while True:
        nextFilesBatch = [] # The next batch of files to preform tagging on
        
        # Get the json file containing the list of files from the Drive API
        retrievedFilesJson = service.files().list(
            pageSize=pageSize,
            fields="nextPageToken, files(id, name, createdTime, properties)",
            pageToken=pageToken
        ).execute()

        fileItems = retrievedFilesJson.get('files', [])
        if not fileItems:
          print("No files retrieved from Drive API.")
          return
        
        # Now process each retrieved file
        for item in fileItems:
          fileId = item.get('id')
          fileName = item.get('name')
          createdTimeStr = item.get('createdTime')
          properties = item.get('properties', {})

          # Extract the year and month from the createdTime
          # This part is a bit ugly because createdTime is a RFC 3339 formatted string
          yearCreated = None
          monthCreated = None

          if createdTimeStr:
            if createdTimeStr.endswith('Z'):
              createdTimeStr = createdTimeStr[:-1]
            if '.' in createdTimeStr:
                createdTimeStr = createdTimeStr.split('.')[0]

            created_dt = datetime.fromisoformat(createdTimeStr)
            yearCreated = created_dt.year
            monthCreated = created_dt.month

          if not yearCreated or not monthCreated:
              print(f"Could not extract year or month from createdTime: {createdTimeStr}")
              exit(1)  

          # Reminder that the series of folders these files will be stored in is:
          # Organized-Drive-Files/Year/Month/Tag/FileName
          
          yearFolderId = checkIfFolderExists(service, str(yearCreated), baseFolderId)

          if yearFolderId:
            print(f"Year folder for {yearCreated} exists, proceeding with month organization.")
            
            monthFolderId = checkIfFolderExists(service, str(monthCreated), yearFolderId)
            if monthFolderId:
              print(f"Month folder for {monthCreated} exists, proceeding with tag organization.")
              
              # Now check the tag
              tagValue = properties.get('tag', 'Uncategorized') # Default to 'Uncategorized' if no tag exists     

              tagFolderId = checkIfFolderExists(service, tagValue, monthFolderId)

              if tagFolderId:
                print(f"Tag folder for '{tagValue}' exists, proceeding with file copy.")
                copiedFileId = copyFileToFolder(service, fileId, tagFolderId)

                if copiedFileId:
                  print(f"Successfully copied file to tag folder '{tagValue}' (ID: {copiedFileId})")
                else:
                  print(f"Failed to copy file to tag folder '{tagValue}'")
              else:
                print(f"Problem with creating tag folder '{tagValue}'. File {fileId} was NOT copied to the organized folder.")
                print("Continuing with next file...")
    except HttpError as error:
      print(f"An HTTP error occurred while retrieving files: {error}")
      exit(1)
    except Exception as e:
      print(f"An error occurred while retrieving files: {e}")
      exit(1)

def main():
  service = authenticateDriveAPI()

  crawlDrive(service)

if __name__ == "__main__":
  # For testing purposes, use an image of a cat with a crab on its head
  # from my Drive. Ultimately the program will crawl through all files in the Drive
  main()

  '''
    TODO / NEXT STEPS:
    - Check if file already has tag
    - Crawl through each file
    - Add prompt for each file type
    - Update README
  '''