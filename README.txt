Narakeet API client

  Command line client that allows building videos using the Narakeet API.
  See https://www.narakeet.com/docs/automating/ for more information.

Installation:

  Install from NPM using "npm i -g @narakeet/api-client"
  Upgrade from a previous version using "npm i -g @narakeet/api-client@latest"

Usage:

  narakeet-api-client --api-key <api-key> \
    --source <source file> \
    --repository <repository> \
    --repository-type <repository type> \
    [optional arguments]

Mandatory arguments:

* --api-key:         Your Narakeet API key

Additional arguments for video projects:

* --source:          (Required) Narakeet script path inside the repository
* --repository:      (Required) Narakeet project location
                     See "Repository types" below for more information
* --repository-type: (Required) Project location type (eg github or local-dir)
                     See "Repository types" below for more information
Additional arguments for GitHub repositories:

* --github-token:    (Required) repository access token
* --github-sha:      (Optional) source commit SHA
                     useful for building from a specific tag or version
                     if not specified, the current head commit will be used

Additional arguments for audio (text-to-speech) projects:

* --script:          input text for speech synthesis, required if script-file is not specified
* --script-file:     (Optional) file containing the input script, relative to current directory
* --output-type:     (Optional) output file type. "wav", "m4a" or "mp3". 
                     Defaults to m4a
* --voice:           (Optional) default voice for text-to-speech synthesis. See
                     https://www.narakeet.com/languages/ for available options

Optional arguments:

* --output:          File name for the resulting file. 
                     Default: result.mp4 for videos, or result.<type> for audio
* --project-type:    "video" or "audio". selects slower video build or faster
                     text-to-speech build. Default: video
* --verbose:         Print troubleshooting information when working
* --api-url:         override the API url, useful for testing


Repository types:

  local-dir:

    Use the files inside a directory on your local disk. 
    To use this option, provide the following:

    --repository: Directory path for the project
    --source: path inside the directory for your main script file

    NOTE: This requires your OS TEMP directory to be writable, 
    as the client will create a temporary ZIP file there 
    and upload it to Narakeet. If the TEMP dir is not writable,
    use the local-zip repository type.

  local-zip: 

    Package your project as a ZIP file on your local disk. 
    To use this option, provide the following:

    --repository: path to the ZIP archive on your local disk 
    --source: path inside the archive four main script file

  zip-url:

    Package your project as a ZIP file, and upload it somewhere for Narakeet to
    download.  (for example, upload to S3 and generate a pre-signed URL for
    private downlads).
    To use this option, provide the following:

    --repository: URL of your ZIP file
    --source: path inside the archive to your main script file

  github:

    Commit your project to GitHub, and build directly from the repository.
    To use this option, provide the following:

    --repository-type: github
    --repository: GitHub repository name (user/project)
    --github-token: access token with rights to download the repository
    --github-sha: optional, SHA commit to download

Examples:

  Build a video from a local directory:

    narakeet-api-client --api-key $API_KEY \
     --source source.md \
     --repository my-video-project \
     --repository-type local-dir

  Build a video from a local zip:

    narakeet-api-client --api-key $API_KEY \
     --source source.md \
     --repository my-video-project.zip \
     --repository-type local-zip

  Build a video from a git repo:

    narakeet-api-client --api-key $API_KEY \
     --source hello-world/script/source.md \
     --repository narakeet/examples \
     --repository-type github \
     --github-token $GITHUB_TOKEN

  Build a video from a ZIP published to a URL:

    narakeet-api-client --api-key $API_KEY \
     --repository $URL \
     --source source.md \
     --repository-type zip-url

  Build an audio MP3 from a local text file:

    narakeet-api-client --api-key $API_KEY \
     --project-type audio \
     --source script.txt \
     --output-type mp3

  Build an audio WAV from a local text file, using the Rodney
  voice, saving to my-script.wav

    narakeet-api-client --api-key $API_KEY \
     --project-type audio \
     --source script.txt \
     --output-type wav \
     --voice rodney \
     --output my-script.wav

