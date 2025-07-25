This branch is a side project that:
* Uses Gemini to analyze all the files in a Google Drive and assign them relevant tags
* Sorts files in a Drive according to: Year Created, Month Created, Tag Assigned (you can choose between MOVING files into a sorted folder, or COPYING files into a sorted folder depending on how much you trust this program)

# IMPORTANT THINGS TO KNOW:
### This program will require you to create a Google Cloud project, as well as a Google Gemini API key. 
The reason you must create a Google Cloud project yourself is so that you and only you maintain complete control over your own Drive. Doing this means that there is absolutely no way anyone in our team would be able to access your drive. 
You will also create your own Gemini API key so that you may choose to upgrade to the paid version if you desire (we recommend you stick with the free tier, however).

### PLEASE NOTE: The free tier of Gemini only allows 400 messages per day
This means that this program will only be able to analyze (assign tags to) 400 files in a 24 hour period. If you have more than 400 files in you Drive then you will need to run this program and click 'tag' over the course of multiple 24 hour periods.
