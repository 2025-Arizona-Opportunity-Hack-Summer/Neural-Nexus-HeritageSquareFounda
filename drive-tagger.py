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
import tkinter as tk # used for the GUI

import os
from dotenv import load_dotenv
load_dotenv()

#import google.generativeai as genai
#client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

validTags = ['Machine Learning', 'Philosophy', 'Historic Image', 'Non-Historic Image']
# removed .webp because mimetypes doesn't recognize it
geminiCompatibleFileTypes = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx', '.txt'] # TODO UPDATE THIS LIST AS NEEDED
imageFileTypes = ['.png', '.jpg', '.jpeg', '.webp'] # Used because image files will have their own prompt

# Drive stores months as numbers, so use this dict when creating the respective month folder
numberToMonth = {1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June", 7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"}

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

''' 
  The GUI will be built using Tkinter,
  and it works best to have a class associated with the GUI.
'''
class TaggerMenu:
  def __init__(self, rootWindow):
    self.root = rootWindow
    self.root.title("Google Drive Tagger")
    self.root.geometry("600x500")

    self.service = None # Used to make calls to Drive API
    self.geminiKey = None 
    self.geminiClient = None # Used to make calls to Gemini API

    # ------- The widgets for the GUI -------
    self.debugLabel = tk.Label(self.root) # Used to print what is happening as the program runs
    
    self.geminiKeyLabel = tk.Label(self.root, text="Enter your Gemini API Key:") # Label for Gemini API key textbox
    self.geminiApiEntry = tk.Entry(self.root) # Textbox for entering Gemini API key
    self.enterGeminiKeyButton = tk.Button(self.root, text="Verify Gemini API Key", command=self.verifyGeminiKey) # Button to verify Gemini API key

    self.tagButton = tk.Button(self.root, text="Perform File Tagging", command=self.tagButtonClicked) # Runs method to analyze each file w/ Gemini and add tag accordingly


    self.drawMainMenu()

  def authenticateDriveAPI(self):
    if self.verifyJsonPresent():
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
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
          # Save the credentials for the next run
          with open('token.json', 'w') as token:
            token.write(creds.to_json())

        return build("drive", "v3", credentials=creds)
      except Exception as e:
        self.debugLabel.config(text=f"An error occurred during Drive authentication")
        return None

  '''
  Checks if folder exists, returns True if it does.
  Othwerise, creates the folder then returns True. 
  Optionally, you can provide the parent folder ID to have nested folders.
'''
  def checkIfFolderExists(self, folderName, parentFolderId=None):

    try:
      # Note that the Drive API treats folders as a file with the MIME type of "application/vnd.google-apps.folder"
      query = f"name='{folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
      if parentFolderId:
        query += f" and '{parentFolderId}' in parents"

      # Check if folder already exists:
      results = self.service.files().list(
              q=query,
              spaces='drive',
              fields='files(id, name)').execute()
      items = results.get('files', [])

      if items: # Folder exists
        return items[0].get('id')
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
        file = self.service.files().create(body=fileMetadata, fields="id").execute()
        folderId = file.get("id")
        
        if folderId:
          return folderId
        else:
          self.debugLabel.config(text="Problem with creating the folder (no ID returned)")
      
    except HttpError as error:
      self.debugLabel.config(text="Http error when checking or creating folder")
    except Exception as e:
      self.debugLabel.config(text="Error occurred when checking or creating folder")

  def copyFileToFolder(self, fileId, destinationFolderId):
    try:
      # Step 1: Get the original file's metadata, including its name and properties.
      # We need 'name' to give the copied file the same name, and 'properties'
      # to transfer the custom 'tag'.
      originalFileMetadata = self.service.files().get(
          fileId=fileId,
          fields='name, properties'
      ).execute()

      originalFileName = originalFileMetadata.get('name')
      originalProperties = originalFileMetadata.get('properties', {})

      # Extract the 'tag' value if it exists
      tagValue = originalProperties.get('tag')

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
      copiedFile = self.service.files().copy(
          fileId=fileId,
          body=copiedFileMetadata,
          fields='id, name, parents, properties' # Request properties back to confirm
      ).execute()

      copiedFileId = copiedFile.get('id')
      if copiedFileId:
        self.debugLabel.config(text=f"Copied {fileId} to {copiedFileId}")
        return copiedFileId
      else:
        self.debugLabel.config(text="Problem with copying the file (no ID returned)")
        return None

    except HttpError as error:
        self.debugLabel.config(text=f"An API error occurred during file copy")
        return None
    except Exception as e:
        self.debugLabel.config(text=f"An unexpected error occurred during file copy")
        return None

  def updateTagMetadata(self, fileId, tagValue):

    new_properties = {
        "tag": tagValue
    }

    file_metadata = {
        "properties": new_properties
    }

    try:
      updatedFile = self.service.files().update(
            fileId=fileId,
            body=file_metadata,
            # Specify 'properties' in fields to get them back in the response
            fields='id,name,properties'
        ).execute()

      self.debugLabel.config(text=f"Successfully tagged file '{updatedFile.get('name')}'.")
      return True
    except HttpError as error:
      self.debugLabel.config(text=f"An error occurred while updating file metadata")
      return False

  # 1) Downloads a file from Google Drive  
  # 2) Calls promptGemini() to analyze it
  # 3) Updates metadata with the tag (or 'Uncategorized' if there is an issue)
  def downloadFileAndUpdateMetadata(self, fileId, mimeType):

    try:
      # First, check if the file type is compatible with Gemini
      # If it isn't, set the tag is 'Uncategorized'
      fileType = mimetypes.guess_extension(mimeType, strict=False) # use the mimetypes library to extract file type
      
      if (fileType is None) or (fileType not in geminiCompatibleFileTypes):
        self.debugLabel.config(text="Setting incompatible file as 'Uncategorized'")
        self.updateTagMetadata(fileId, "Uncategorized")
        return
      
      request = self.service.files().get_media(fileId=fileId)
      file = io.BytesIO()
      downloader = MediaIoBaseDownload(file, request)
      done = False
      while done is False:
        status, done = downloader.next_chunk()
        self.debugLabel.config(text=f"Downloaded to memory: {int(status.progress() * 100)}.")

      # Reset the file pointer to the beginning of the stream
      file.seek(0)
      
      # Convert the byte stream to a temporary file so that Gemini can actually use it
      with tempfile.NamedTemporaryFile(delete=False, suffix=fileType) as temp_file: # 
        temp_file.write(file.getvalue())
        temp_file_path = temp_file.name 
      
      # All the conditions are met to send the file to Gemini
      promptMessage = fileAndPromptDict[fileType]
      tagValue = self.promptGemini(temp_file_path, promptMessage)

      self.updateTagMetadata(fileId, tagValue)

    except Exception as error:
      self.debugLabel.config(text=f"An error occurred: {error}")
      file = None

  def promptGemini(self, tempFilePath, promptMessage):
    try:
      self.debugLabel.config(text=f"Attempting to upload file to Gemini: {tempFilePath}")
      myfile = self.geminiClient.files.upload(file=tempFilePath)
      self.debugLabel.config(text=f"Successfully uploaded file to Gemini: {myfile.name}")

      response = self.geminiClient.models.generate_content(
          model="gemini-2.0-flash-lite", contents=[
              promptMessage,
              myfile 
          ])

      cleanedResponse = response.text.strip()

      if cleanedResponse in validTags:
          self.debugLabel.config(text=f"Gemini returned valid tag: {cleanedResponse}")
          return cleanedResponse
      else:
          self.debugLabel.config(text="Invalid Gemini response. Setting tag as 'Uncategorized'")
          return "Uncategorized"
        
    except HttpError as error:
      self.debugLabel.config(text=f"Http error while prompting Gemini")
      return "Uncategorized"
    except Exception as e:
      self.debugLabel.config(text=f"Error while prompting Gemini")
      return "Uncategorized" 

  def verifyGeminiKey(self):
    self.geminiKey = self.geminiApiEntry.get().strip()  # Get the key from the entry box

    if not self.geminiKey or self.geminiKey == "":
      self.debugLabel.config(text="Please enter a valid Gemini API key.")
      return False

    # Verify that the Gemini API key is valid by making a simple request
    try:
      self.geminiClient = genai.Client(api_key=self.geminiKey)
      response = self.geminiClient.models.list()  # This will raise an error if the key is invalid
      self.debugLabel.config(text=f"Gemini API key is valid.")
      return True
    except Exception as e:
      self.debugLabel.config(text=f"Invalid Gemini API key")
      return False

  # Checks if the Json file from the Google Cloud project is present.
  def verifyJsonPresent(self):
    filename = "credentials.json"
    if os.path.exists(filename):
      self.debugLabel.config(text=f"'{filename}' found successfully")
      return True
    else:
      self.debugLabel.config(text=f"'{filename}' not present in the current directory")
      return False

  '''
    Crawls through the user's Google Drive and analyzes each file compatible with Gemini.
    Designed to look at all files in the Drive (ignoring ones that already have a tag),
    so that it can be run again if it previously crashed or failed. 
  '''
  def tagEachFile(self):
    pageToken = None # Used to request the next step of 1000 files from the Drive API
    pageSize = 20 # The number of files to retrieve (max allowed per request is 1000)
    
    try:
      while True:
        nextFilesBatch = [] # The next batch of files to perform tagging on
        
        # Get the json file containing the list of files from the Drive API
        retrievedFilesJson = self.service.files().list(
            pageSize=pageSize,
            fields="nextPageToken, files(id, name, mimeType)",
            pageToken=pageToken
        ).execute()

        fileItems = retrievedFilesJson.get('files', [])
        if not fileItems:
          self.debugLabel.config(text="No files retrieved from Drive API.")
          return
        
        for item in fileItems:
          nextFilesBatch.append( (item['id'], item['mimeType']) )

        #self.debugLabel.config(text=f"Successfully retrieved {len(nextFilesBatch)} files from Drive API.")

        for file in nextFilesBatch:
          fileId = file[0]
          mimeType = file[1]

          # CHECK IF FILE ALREADY HAS TAG
          fileMetadata = self.service.files().get(
            fileId=fileId, 
            fields='properties'
          ).execute()

          if ('properties' in fileMetadata) and ('tag' in fileMetadata['properties']):
            #self.debugLabel.config(text="File already has tag, skipping analysis")
            pass
          else:
            # File doesn't have tag, so analyze it
            self.debugLabel.config(text=f"Analyzing file {fileId}")
            # TODO self.downloadFileAndUpdateMetadata(fileId, mimeType)

        # Update the pageToken for the next iteration
        pageToken = retrievedFilesJson.get('nextPageToken', None)

        # If there's no nextPageToken, we've processed all files
        if not pageToken:
          self.debugLabel.config(text="Done tagging Drive files")
          return

    except HttpError as error:
      self.debugLabel.config(text=f"An HTTP error occurred while retrieving files")
      return
    except Exception as e:
      self.debugLabel.config(text=f"An error occurred while retrieving files: {e}")
      return

  '''
    Organizes files based first on creation date Year/Month, then on Tag.
    To avoid accidentally messing up the drive, this function will 
    use a new folder called Organized-Drive-Files to store COPIES of the original files.
  '''
  def organizeFiles(self):
    # All files, once tagged, will be COPIED into a folder by this name.
    # Copied and not moved in case something goes wrong.
    baseOrganizedFilesFolderName = "Organized-Drive-Files"
    
    # Very similar to tagEachFile() in that it retrieves all file IDs from the Drive API

    # Ensure the base folder where all organization will take place exists
    baseFolderId = self.checkIfFolderExists(folderName=baseOrganizedFilesFolderName)

    if baseFolderId:
      self.debugLabel.config(text=f"Base folder '{baseOrganizedFilesFolderName}' exists, proceeding with organization.")

      pageToken = None # Used to request the next step of 1000 files from the Drive API
      pageSize = 1000 # The number of files to retrieve (max allowed per request is 1000)
    
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
          retrievedFilesJson = self.service.files().list(
              pageSize=pageSize,
              fields="nextPageToken, files(id, name, createdTime, properties)",
              pageToken=pageToken
          ).execute()

          fileItems = retrievedFilesJson.get('files', [])
          if not fileItems:
            self.debugLabel.config(text="No more files retrieved from Drive API.")
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
              self.debugLabel.config(text=f"Could not extract year or month from createdTime: {createdTimeStr}")
              continue

            # Reminder that the series of folders these files will be stored in is:
            # Organized-Drive-Files/Year/Month/Tag/FileName
            
            yearFolderId = self.checkIfFolderExists(str(yearCreated), baseFolderId)

            if yearFolderId:
              self.debugLabel.config(text=f"Year folder for {yearCreated} exists, proceeding with month organization.")

              # monthCreated is a number, so find the word (aka 7 -> July) for better folder naming
              monthCreatedWord = numberToMonth[monthCreated]

              monthFolderId = self.checkIfFolderExists(monthCreatedWord, yearFolderId)
              if monthFolderId:
                self.debugLabel.config(text=f"Month folder for {monthCreatedWord} exists, proceeding with tag organization.")

                # Now check the tag
                tagValue = properties.get('tag') # Default to 'Uncategorized' if no tag exists     

                if tagValue:
                  tagFolderId = self.checkIfFolderExists(tagValue, monthFolderId)

                  if tagFolderId:
                    self.debugLabel.config(text=f"Tag folder for '{tagValue}' exists, proceeding with file copy.")
                    copiedFileId = self.copyFileToFolder(fileId, tagFolderId)

                    if copiedFileId:
                      self.debugLabel.config(text=f"Successfully copied file to tag folder '{tagValue}' (ID: {copiedFileId})")
                    else:
                      self.debugLabel.config(text="Failed to copy file to tag folder")
                  else:
                    uncategorizedFolderId = self.checkIfFolderExists("Uncategorized", monthFolderId)

                    if uncategorizedFolderId:
                      self.debugLabel.config(text="No tag associated with file, so copying to 'Uncategorized' folder")
                      copiedFileId = self.copyFileToFolder(fileId, uncategorizedFolderId)

                      if copiedFileId:
                        self.debugLabel.config(text=f"Successfully copied file {fileId} to 'Uncategorized' folder (ID: {copiedFileId})")
                      else:
                        self.debugLabel.config(text="Failed to copy file to 'Uncategorized' folder")

          # Update the pageToken for the next iteration
          pageToken = retrievedFilesJson.get('nextPageToken', None)

          # If there's no nextPageToken, we've processed all files
          if not pageToken:
            self.debugLabel.config(text="All files processed, exiting organizeFiles().")
            return
      
      except HttpError as error:
        self.debugLabel.config(text=f"An HTTP error occurred while retrieving files for sorting")
        return
      except Exception as e:
        self.debugLabel.config(text=f"An error occurred while retrieving files for sorting")
        return

  def tagButtonClicked(self):
    # 0. Verify Drive API is authenticated
    self.service = self.authenticateDriveAPI()
    
    if self.service:
      
      # 1. Verify Gemini key is valid
      if self.verifyGeminiKey():
        
        # 2. Verify credentials.json file is present
        if self.verifyJsonPresent():
          self.debugLabel.config(text="Proceeding with tagging")
          self.tagEachFile()
        else:
          return

  def drawMainMenu(self):
    self.debugLabel.grid(row=0, column=0, columnspan=2, padx=10, pady=10)

    self.geminiKeyLabel.grid(row=1, column=0, padx=10, pady=10)
    self.geminiApiEntry.grid(row=1, column=1, columnspan=2, padx=10, pady=10)
    self.enterGeminiKeyButton.grid(row=1, column=3, padx=10, pady=10)

    self.tagButton.grid(row=2, column=0, padx=10, pady=10)

def main():

  rootWindow = tk.Tk()
  app = TaggerMenu(rootWindow)
  rootWindow.mainloop()

if __name__ == "__main__":
  main()

  '''
    TODO / NEXT STEPS:
    - Add real prompt
    - Don't copy file twice
    - Add backoff for Gemini API calls
    - Update README
  '''

