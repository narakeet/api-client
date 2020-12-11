Narakeet API client

   Command line client that allows building videos using the Narakeet API,
   from either GitHub commits or published ZIP archives

Installation:

  Install from NPM using "npm i -g @narakeet/api-client"

Usage:

narakeet-api-client --api-key <api-key> --source <source file> --repository <repository> [optional arguments]

Options:

* --api-key:         mandatory - your Narakeet API key
* --source:          mandatory - Narakeet script path inside the repository
* --repository:      mandatory - Narakeet project URL
                     See "Repository types" below for more information
* --output:          optional - file name for the resulting video.
*                    Defaults to result.mp4
* --repository-type: optional - github or zip-url. Defaults to zip-url
                     See "Repository types" below for more information
* --verbose:         optional - print troubleshooting information when working
* --github-sha:      optional - only for github repositories, source commit SHA
                     useful for building from a specific tag or version
                     if not specified, the current head commit will be used
* --github-token:    required for github repositories - repository access token
* --api-url:         optional - override the API url, useful for testing

Repository types:

  zip-url:
    Package your project as a ZIP file, and upload it somewhere for Narakeet to download.
    (for example, upload to S3 and generate a pre-signed URL for private downlads).
    To use this option, provide the following:

    --repository: URL of your ZIP file
    --source: path inside the archive to your main script file

  github:
    Commit your project to GitHub, and build directly from the repository.
    To use this option, provide the following:

    --repository-type: github
    --repository: GitHub repository name (user/project)
    --github-token: access token with rights to download files from the repository
    --github-sha: optional, SHA commit to download

Examples:

  Build from a git repo:

  narakeet-api-client --api-key $API_KEY \
   --source hello-world/script/source.md \
   --repository narakeet/examples \
   --repository-type github \
   --github-token $GITHUB_TOKEN

  Build from a URL:

  narakeet-api-client --api-key $API_KEY \
   --repository $URL \
   --source source.md
