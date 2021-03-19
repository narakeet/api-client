# Contributing and development

## Testing

Create a `.env` file in the project root (it is ignored by git), containing
the following parameters:

```
API_KEY=
SOURCE_PATH=
GITHUB_REPOSITORY=
GITHUB_TOKEN=
```

To build from a specific SHA hash, instead of the repository head, add 

```
SHA=
```

Optionally, to use the Dev api instead of the production one, also add:

```
API_URL=https://testapi.narakeet.com/video/build
```

You can then run `npm run test:integration` to execute an integration test.
