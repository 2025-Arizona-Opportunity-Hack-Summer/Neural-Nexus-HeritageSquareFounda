This branch is a side project that uses Gemini to analyze all the files in a Google Drive and assign them relevant tags. The end goal is for a future project to use these tags to organize the Google Drive. 

## Steps taken by the program:
* Iteratively retrieve all file IDs from the drive (a max of 1000 can be retrieved at once)
* Download each file as a tempfile
* Send the tempfile to Gemini to find its corresponding tag
* Store the tag as metadata

This program relies on the Drive API to retrieve files and manage their metadata. It also uses the Gemini API to analyze the files. It requires a Google Cloud project to be created. 
