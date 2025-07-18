# All files, once tagged, will be COPIED into a folder by this name.
# Copied and not moved in case something goes wrong.
baseOrganizedFilesFolderName = "Organized-Drive-Files"

# Provides Gemini with a file and has it return a tag
def promptGemini(temp_file_path, promptMessage):
  try:
      print(f"Attempting to upload file to Gemini: {temp_file_path}") # Add this line
      myfile = client.files.upload(file=temp_file_path) # This is the likely line causing the HttpError
      print(f"Successfully uploaded file to Gemini: {myfile.name}") # This line won't print if error occurs above

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
          
  except HttpError as error:
      print(f"An HttpError occurred during Gemini file upload or content generation: {error}")
      print(f"Gemini API Error Status: {error.resp.status}")
      print(f"Gemini API Error Reason: {error.resp.reason}")
      if error.content:
          print(f"Gemini API Error Content: {error.content.decode()}")
      # Re-raise the error or handle it as appropriate for your main downloadFileAndUpdateMetadata
      raise # Re-raise to let the outer try-except handle it, providing more context.
  except Exception as e:
      print(f"An unexpected error occurred in promptGemini: {e}")
      raise # Re-raise for outer handling


  '''
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
    '''

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
def updateTagMetadata(fileId, tagValue):

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
    fileType = mimetypes.guess_extension(mimeType, strict=False) # use the mimetypes library to extract file type
    
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
    
  except Exception as error:
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
      nextFilesBatch = [] # The next batch of files to perform tagging on
      
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
      
      # Update the pageToken for the next iteration
      pageToken = retrievedFilesJson.get('nextPageToken', None)

      # If there's no nextPageToken, we've processed all files
      if not pageToken:
        print("All files processed, exiting crawlDrive().")
        return

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

      print(f"------Attempting to copy file '{originalFileName}' (ID: {fileId}) (Parent folder ID: {destinationFolderId})")
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
        print(f"Copied {fileId} to {copiedFileId}")
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
  Checks if there is a file with a given NAME (not ID) in a specified folder.
  This is so that if organizeFiles() is run multiple times, it won't copy over 
'''
def checkIfFileInFolder(service, fileName, folderId):
  pass

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
            
            # monthCreated is a number, so find the word (aka 7 -> July) for better folder naming
            monthCreatedWord = numberToMonth[monthCreated]

            monthFolderId = checkIfFolderExists(service, monthCreatedWord, yearFolderId)
            if monthFolderId:
              print(f"Month folder for {monthCreatedWord} exists, proceeding with tag organization.")

              # Now check the tag
              tagValue = properties.get('tag') # Default to 'Uncategorized' if no tag exists     

              if tagValue:
                tagFolderId = checkIfFolderExists(service, tagValue, monthFolderId)

                if tagFolderId:
                  print(f"Tag folder for '{tagValue}' exists, proceeding with file copy.")
                  copiedFileId = copyFileToFolder(service, fileId, tagFolderId)

                  if copiedFileId:
                    print(f"Successfully copied file to tag folder '{tagValue}' (ID: {copiedFileId})")
                  else:
                    print(f"================ ATTENTION!!!!!! Failed to copy file to tag folder '{tagValue}'")
                else:
                  uncategorizedFolderId = checkIfFolderExists(service, "Uncategorized", monthFolderId)

                  if uncategorizedFolderId:
                    print(f"No tag associated with file, so copying to 'Uncategorized' folder")
                    copiedFileId = copyFileToFolder(service, fileId, uncategorizedFolderId)

                    if copiedFileId:
                      print(f"Successfully copied file {fileId} to 'Uncategorized' folder (ID: {copiedFileId})")
                    else:
                      print(f"================ ATTENTION!!!!!! Failed to copy file to 'Uncategorized' folder")

        # Update the pageToken for the next iteration
        pageToken = retrievedFilesJson.get('nextPageToken', None)

        # If there's no nextPageToken, we've processed all files
        if not pageToken:
          print("All files processed, exiting organizeFiles().")
          return
    
    except HttpError as error:
      print(f"An HTTP error occurred while retrieving files: {error}")
      exit(1)
    except Exception as e:
      print(f"An error occurred while retrieving files: {e}")
      exit(1)