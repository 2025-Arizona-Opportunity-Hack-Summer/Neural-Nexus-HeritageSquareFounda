This branch is a side project that:
* Uses Gemini to analyze all the files in a Google Drive and assign them relevant tags
* Sorts files in a Drive according to: Year Created, Month Created, Tag Assigned (you can choose between MOVING files into a sorted folder, or Copying files into a sorted folder)

## Steps taken by the program:
* Iteratively retrieve all file IDs from the drive (a max of 1000 can be retrieved at once)
* Download each file as a tempfile
* Send the tempfile to Gemini to find its corresponding tag
* Store the tag as metadata

This program relies on the Drive API to retrieve files and manage their metadata. It also uses the Gemini API to analyze the files. It requires a Google Cloud project to be created. 
