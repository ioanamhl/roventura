# Jenkins CI/CD with MDSSC API wrapper

This folder contains an alternative Jenkins pipeline that keeps the MDSSC scan
logic in a reusable Groovy wrapper instead of embedding all scanner commands in
the Jenkinsfile.

Use this Jenkins script path:

```text
ci-api/Jenkinsfile
```

The wrapper is loaded from:

```text
ci-api/mdsscScan.groovy
```

The Jenkinsfile calls the wrapper as an API:

```groovy
mdssc.scanFile(path: 'artifacts/source-code.tar.gz', label: 'source-code')
mdssc.scanArtifacts(artifactDir: 'artifacts', excludeNames: ['source-code.tar.gz'])
```

## Required Jenkins credential

Create a secret text credential:

```text
ID: mdssc-api-key
Type: Secret text
Value: your OPSWAT MDSSC API key
```

If you use a different credential ID, set the build parameter:

```text
MDSSC_CREDENTIALS_ID=your-credential-id
```

## MDSSC parameters

```text
MDSSC_SERVER=http://35.156.106.42
MDSSC_WORKFLOW_ID=optional-workflow-id
MDSSC_SCAN_TIMEOUT=900
MDSSC_POLL_INTERVAL=10
MDSSC_VULNERABILITY_THRESHOLD=critical
MDSSC_FAIL_ON_VULNERABILITIES=false
MDSSC_SKIP_LARGE_ARTIFACTS=true
MDSSC_MAX_UPLOAD_MB=100
```

`MDSSC_SKIP_LARGE_ARTIFACTS=true` prevents oversized files such as
`docker-images.tar` from causing the MDSSC upload to fail with HTTP 413.

## Jenkins usage

In the Jenkins Multibranch Pipeline configuration, change **Script Path** from:

```text
ci/Jenkinsfile
```

to:

```text
ci-api/Jenkinsfile
```

Commit and push the folder, then let Jenkins rescan or run the job again.
