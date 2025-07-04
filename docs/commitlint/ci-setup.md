Guide: CI Setup
Enforce commit conventions with confidence by linting on your CI servers with commitlint.

This guide assumes you have already configured commitlint for local usage.

Follow the Getting Started for basic installation and configuration instructions.

GitHub Actions
An example of how a GitHub Actions workflow could validate the last commit message or all commit messages inside a Pull Request:


name: CI

on: [push, pull_request]

permissions:
  contents: read

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm
      - name: Install commitlint
        run: npm install -D @commitlint/cli @commitlint/config-conventional
      - name: Print versions
        run: |
          git --version
          node --version
          npm --version
          npx commitlint --version

      - name: Validate current commit (last commit) with commitlint
        if: github.event_name == 'push'
        run: npx commitlint --last --verbose

      - name: Validate PR commits with commitlint
        if: github.event_name == 'pull_request'
        run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose
Travis

# Install and configure if needed
npm install --save-dev @commitlint/travis-cli

# travis.yml
language: node_js
node_js:
  - node
script:
  - commitlint-travis
CircleCI
It's just a simple example of how CircleCI configuration file could look like to validate last commit message


version: 2.1

executors:
  my-executor:
    docker:
      - image: cimg/node:current
    working_directory: ~/project

jobs:
  setup:
    executor: my-executor
    steps:
      - checkout
      - restore_cache:
          key: lock-{{ checksum "package-lock.json" }}
      - run:
          name: Install dependencies
          command: npm install
      - save_cache:
          key: lock-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
      - persist_to_workspace:
          root: ~/project
          paths:
            - node_modules

  lint_commit_message:
    executor: my-executor
    steps:
      - checkout
      - attach_workspace:
          at: ~/project
      - run:
          name: Define environment variable with latest commit's message
          command: |
            echo 'export COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")' >> $BASH_ENV
            source $BASH_ENV
      - run:
          name: Lint commit message
          command: echo "$COMMIT_MESSAGE" | npx commitlint

workflows:
  version: 2.1
  commit:
    jobs:
      - setup
      - lint_commit_message:
          requires:
            - setup
GitLab CI

lint:commit:
  image: registry.hub.docker.com/library/node:alpine
  variables:
    GIT_DEPTH: 0
  before_script:
    - apk add --no-cache git
    - npm install --save-dev @commitlint/config-conventional @commitlint/cli
  script:
    - npx commitlint --from ${CI_MERGE_REQUEST_DIFF_BASE_SHA} --to ${CI_COMMIT_SHA}
GitLab limits git clone depth to 20 commits by default. Setting GIT_DEPTH: 0 removes this limitation, so commitlint can check larger MRs.

GitLab CI with pre-build container

stages: ["lint", "build", "test"]
lint:commit:
  image:
    name: registry.hub.docker.com/commitlint/commitlint:latest
    entrypoint: [""]
  stage: lint
  script:
    # Uncomment the next line if you are extending the @commitlint/config-nx-scopes in your commitlint configuration
    #- npm i -g nx@$(node -pe "require('./package.json').devDependencies.nx")
    - commitlint --from ${CI_MERGE_REQUEST_DIFF_BASE_SHA} --to ${CI_COMMIT_SHA}
Jenkins X

apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: pullrequest
spec:
  pipelineSpec:
    tasks:
      - name: conventional-commits
        taskSpec:
          steps:
            - name: lint-commit-messages
              image: commitlint/commitlint
              script: |
                #!/usr/bin/env sh
                . .jx/variables.sh
                commitlint --extends '@commitlint/config-conventional' --from $PR_BASE_SHA --to $PR_HEAD_SHA
  serviceAccountName: tekton-bot
  timeout: 15m
BitBucket
Validate commits within a PR by leveraging BitBucket`s default variables:


image: node:18

pipelines:
  pull-requests:
    default:
      - step:
        name: Lint commit messages
        script:
          - npm install --save-dev @commitlint/config-conventional @commitlint/cli
          - npx commitlint --from $BITBUCKET_COMMIT~$(git rev-list --count $BITBUCKET_BRANCH ^origin/$BITBUCKET_PR_DESTINATION_BRANCH) --to $BITBUCKET_COMMIT --verbose
BitBucket limits git clone depth to 20 commits by default. You can change this behaviour by changing the clone option.

Azure Pipelines

steps:
  - checkout: self
    fetchDepth: 0

  - task: NodeTool@0
    inputs:
      versionSpec: "20.x"
      checkLatest: true

  - script: |
      git --version
      node --version
      npm --version
      npx commitlint --version
    displayName: Print versions

  - script: |
      npm install conventional-changelog-conventionalcommits
      npm install commitlint@latest
    displayName: Install commitlint

  - script: npx commitlint --last --verbose
    condition: ne(variables['Build.Reason'], 'PullRequest')
    displayName: Validate current commit (last commit) with commitlint

  - script: |
      echo "Accessing Azure DevOps API..."

      response=$(curl -s -X GET -H "Cache-Control: no-cache" -H "Authorization: Bearer $(System.AccessToken)" $(System.TeamFoundationCollectionUri)$(System.TeamProject)/_apis/git/repositories/$(Build.Repository.Name)/pullRequests/$(System.PullRequest.PullRequestId)/commits?api-version=6.0)
      numberOfCommits=$(echo "$response" | jq -r '.count')

      echo "$numberOfCommits commits to check"

      npx commitlint --from $(System.PullRequest.SourceCommitId)~${numberOfCommits} --to $(System.PullRequest.SourceCommitId) --verbose
    condition: eq(variables['Build.Reason'], 'PullRequest')
    displayName: Validate PR commits with commitlint
3rd party integrations
Codemagic

#codemagic.yaml
workflows:
  commitlint:
    name: Lint commit message
    scripts:
      - npx commitlint --from=HEAD~1
TIP

Help yourself adopting a commit convention by using an interactive commit prompt. Learn how to use @commitlint/prompt-cli in the Use prompt guide.