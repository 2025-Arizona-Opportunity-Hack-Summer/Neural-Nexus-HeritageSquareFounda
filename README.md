This branch is a side project that:
* Uses Gemini to analyze all the files in a Google Drive and assign them relevant tags
* Sorts files in a Drive according to: Year Created, Month Created, Tag Assigned (you can choose between MOVING files into a sorted folder, or COPYING files into a sorted folder depending on how much you trust this program)

# USING THE PROGRAM

After creating the Cloud project and downloading the json file, as well as creating the Gemini API key, you are reading to run the program. Download the "drive-tagger.exe" program from the "dist" folder of this repository, then double click it to run it. Make sure to have the "credentials.json" file in the same folder as this program.

<img width="749" height="476" alt="TaggerPic2" src="https://github.com/user-attachments/assets/5356652a-3ed2-4f12-af7f-6804baba2f59" />

Copy and paste your Gemini API key in to the textbox, then click "Perform file tagging". The first time you run this you will be asked to give permission to your Google account. Since you have created your own Cloud project, you are NOT giving permission to anyone in this team. You are essentially giving permission to yourself. 

The **Perform file tagging** button will go through each file in youe Drive, have Gemini analyze it, then assign one of the following tags based off of its content. We got these from a previous team's document, so hopefully they accurately reflect the genres of files in your Drive:
### IMPORTANT: The free version of Gemini can only handle 400 files per day! If your Drive has more than 400, you will need to run this program and click "Perform file tagging" over the course of multiple days until all files have been tagged. Note the bottom of the menu to see how many untagged files are remaining.

* Accounting
* Curation
* Development (contributed revenue generation)
* Employee resources (HR)
* Board of Directors
* Marketing
* Operations
* Programming
* Research (historic info)
* Historic Image
* Non Historic Image

The other two buttons will organize the files in the following order: Year created -> Month created -> Tag.
The **COPY tagged files into organized folder** will create a new file and COPY all the tagged files in to this according to the sorting order. I recommend you do this first to see if you like how the files are sorted. Note that this will increase the size of your Drive since it is copying files.
Alternative, **MOVE tagged files into organized folder** will actually move files according to the above sorting order. If a file hasn't been tagged yet, then it won't be moved/copied - this means if there are more than 400 files you must run this program then wait 24 hours and run it again until all files have a tag, then select your sorting option.

# IMPORTANT THINGS TO KNOW:
### This program will require you to create a Google Cloud project, as well as a Google Gemini API key. 
The reason you must create a Google Cloud project yourself is so that you and only you maintain complete control over your own Drive. Doing this means that there is absolutely no way anyone in our team would be able to access your Drive. 
You will also create your own Gemini API key so that you may choose to upgrade to the paid version if you desire (we recommend you stick with the free tier, however).

### PLEASE NOTE: The free tier of Gemini only allows 400 messages per day
This means that this program will only be able to analyze (assign tags to) 400 files in a 24 hour period. If you have more than 400 files in you Drive then you will need to run this program and click 'tag' over the course of multiple 24 hour periods.

# PRELIMINARY THINGS
Please download the executable file "drive-tagger.exe". Currently this program is only supported on Windows. 
When you create your Google Cloud project, you will get a .json file that you must rename to "credentials.json" and place in the same folder as "drive-tagger.exe".

## CREATING A GOOGLE CLOUD PROJECT

[Click here to open Google Cloud](https://console.cloud.google.com/)

[Watch this video to see how to make a Cloud project](https://youtu.be/gx7stcEErJc)

You will create your own Google Cloud project so that you do not pass of Drive access to us. There is no way any one in our team will be able to access your files because you have your own Cloud project.

**PLEASE NOTE**: You MUST download the json file and rename it to "credentials.json" when creating your Google Cloud project. This json file must be in the same folder as the drive tagger program for it to be able to access your Drive files.


## CREATING A GEMINI API KEY

[Click here to open the Gemini website](https://aistudio.google.com/)

[Watch this video to see how to make a Gemini Key](https://www.youtube.com/watch?v=oAe-IqvlUVk)

Gemini is the AI model that is used to analyze your Drive's files, so you must create an API key which will be entered in a textbox in the tagger program. The program will use a free version of Gemini, however it can only handle 400 calls per day which means if your Drive has more than 400 files then you must run it multiple times over the course of multiple days. At the bottom of the menu you will see how many untagged files remain. 
