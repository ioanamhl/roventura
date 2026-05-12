# Jenkins CI/CD

This folder contains the Jenkins pipeline for RoVentura.
Use this file for small CI trigger tests when you need a harmless repository change.

## Jenkins job

Create a Jenkins **Multibranch Pipeline** job so Jenkins can run the pipeline on
pushes to any branch.

Use this script path:

```text
ci/Jenkinsfile
```

Configure the Git repository as the branch source. The Jenkinsfile uses
`pollSCM('H/2 * * * *')`, so Jenkins checks for code changes every few minutes
and runs the pipeline when a branch has new commits.

## Required Jenkins credentials

Create a secret text credential:

```text
ID: mdssc-api-key
Type: Secret text
Value: your OPSWAT MDSSC API key
```

For production deploy, create an SSH private key credential and pass its ID in
the `PROD_SSH_CREDENTIALS_ID` build parameter.

## Required Jenkins agent tools

The Jenkins agent must have:

- Docker CLI
- Docker Compose plugin
- Node.js and npm
- Git
- SSH client, only if deploy is enabled

The existing `jenkins/Dockerfile` already installs Docker CLI, Docker Compose,
Node.js and npm.

## Pipeline stages

1. Checkout source code.
2. Prepare build tools and artifact directory.
3. Install backend and frontend dependencies.
4. Build frontend and Docker artifacts.
5. Archive artifacts in Jenkins.
6. Deploy to production VPS, only when `RUN_DEPLOY=true`.

The source code scan and artifact scan stages are implemented with the OPSWAT
MDSSC CLI scanner container.

## MDSSC configuration

The scan implementation uses the official scanner container:

```text
opswat/mdssc-scanner:latest
```

Set these build parameters in Jenkins:

```text
MDSSC_SERVER=http://35.156.106.42
MDSSC_WORKFLOW_ID=optional-workflow-id
MDSSC_VULNERABILITY_THRESHOLD=high
MDSSC_FAIL_ON_VULNERABILITIES=false
```

Disable `RUN_SOURCE_SCAN` or `RUN_ARTIFACT_SCAN` if you want to test the build
without MDSSC.

## Production deploy

Deploy is disabled by default. To enable it, run the pipeline with:

```text
RUN_DEPLOY=true
PROD_HOST=deploy@your-vps-ip
PROD_PATH=/opt/roventura
PROD_SSH_CREDENTIALS_ID=your-jenkins-ssh-key-id
```

The VPS must have Docker and Docker Compose installed.

## Jenkins plugin wrapper idea

A future Jenkins plugin can wrap the MDSSC scanner command as a configurable
build step with fields for server URL, credentials ID, workflow ID, scan path,
timeout, vulnerability threshold and fail policy. The current Jenkinsfile keeps
that behavior in `runMdsscScan(...)`, so it can be extracted later into a plugin
or shared library without changing the pipeline stages.
