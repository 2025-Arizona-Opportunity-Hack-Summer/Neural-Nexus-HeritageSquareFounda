This branch is a side project that:
* Uses Gemini to analyze all the files in a Google Drive and assign them relevant tags
* Sorts files in a Drive according to: Year Created, Month Created, Tag Assigned (you can choose between MOVING files into a sorted folder, or COPYING files into a sorted folder depending on how much you trust this program)

# IMPORTANT THINGS TO KNOW:
### This program will require you to create a Google Cloud project, as well as a Google Gemini API key. 
The reason you must create a Google Cloud project yourself is so that you and only you maintain complete control over your own Drive. Doing this means that there is absolutely no way anyone in our team would be able to access your Drive. 
You will also create your own Gemini API key so that you may choose to upgrade to the paid version if you desire (we recommend you stick with the free tier, however).

### PLEASE NOTE: The free tier of Gemini only allows 400 messages per day
This means that this program will only be able to analyze (assign tags to) 400 files in a 24 hour period. If you have more than 400 files in you Drive then you will need to run this program and click 'tag' over the course of multiple 24 hour periods.

# GETTING STARTED
Please download the executable file "drive-tagger.exe". Currently this program is only supported on Windows. 
When you create your Google Cloud project, you will get a .json file that you must rename to "credentials.json" and place in the same folder as "drive-tagger.exe".

## CREATING A GOOGLE CLOUD PROJECT
### You will need to follow these steps to create a Google Cloud project. 
[Watch this video to see the steps you must take]()

### 1. 
[Go to Google Cloud](https://console.cloud.google.com/) and agree to any terms of service pop-ups.

### 2.
In the top left and click **Select a project**.

<img width="1028" height="543" alt="Create project - Copy" src="https://github.com/user-attachments/assets/3f683a76-f510-4c64-9cc4-ef83d93f1d14" />

Click "New project".
<img width="1006" height="695" alt="CloudImage" src="https://github.com/user-attachments/assets/3e5e9074-e6b5-4fdf-87e2-3c5b1d028bc1" />

Give the project a name (whatever you want, it doesn't matter).
![Cloud_2](https://github.com/user-attachments/assets/1f702b89-eee0-4baf-8b95-9bb0c0b92fee)

Wait a moment, then on the right, select the project you just created.
![Cloud_3](https://github.com/user-attachments/assets/609cc723-b6ce-4892-a110-8e2d482e22f9)

### 3.
Open the options on the left and click **Oauth consent screen**
![Cloud_4](https://github.com/user-attachments/assets/59a2d6e9-551c-422d-8882-64d9496f99de)

Click **Get started**
![Cloud_5](https://github.com/user-attachments/assets/e44a7d88-d3f5-441d-a934-f991dd32bcee)

Fill out the an app name of your choice, and enter your gmail account as the support email as well as 
![Cloud_6](https://github.com/user-attachments/assets/8397cf84-171b-4048-a977-1c909e947091)

### 4.

Now click **Create OAuth Client**
![Cloud_8](https://github.com/user-attachments/assets/4ef62b9e-c453-40dc-906a-f6f60054f8a2)

Select **Desktop app**
![Cloud_10](https://github.com/user-attachments/assets/05d5252d-070b-43ea-80e3-367e7399f267)































