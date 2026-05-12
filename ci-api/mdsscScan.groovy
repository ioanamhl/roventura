String paramValue(String name, String defaultValue = '') {
    def value = params[name]
    if (value == null) {
        return defaultValue
    }

    String text = value.toString().trim()
    return text ? text : defaultValue
}

String shellQuote(String value) {
    return "'${value.replace("'", "'\"'\"'")}'"
}

String workflowEnv() {
    String workflowId = paramValue('MDSSC_WORKFLOW_ID')
    return workflowId ? "-e WORKFLOW_ID=${shellQuote(workflowId)}" : ''
}

void scanFile(Map config = [:]) {
    String filePath = config.path?.toString()
    if (!filePath) {
        error('MDSSC scanFile requires a path.')
    }

    String label = config.label?.toString() ?: filePath
    String mdsscServer = config.server?.toString()?.trim() ?: paramValue('MDSSC_SERVER', 'http://35.156.106.42')
    String credentialsId = config.credentialsId?.toString()?.trim() ?: paramValue('MDSSC_CREDENTIALS_ID', 'mdssc-api-key')
    String scanTimeout = config.scanTimeout?.toString()?.trim() ?: paramValue('MDSSC_SCAN_TIMEOUT', '900')
    String pollInterval = config.pollInterval?.toString()?.trim() ?: paramValue('MDSSC_POLL_INTERVAL', '10')
    String threshold = config.vulnerabilityThreshold?.toString()?.trim() ?: paramValue('MDSSC_VULNERABILITY_THRESHOLD', 'critical')
    String failOnVulnerabilities = config.failOnVulnerabilities != null
        ? config.failOnVulnerabilities.toString()
        : (params.MDSSC_FAIL_ON_VULNERABILITIES == null ? 'false' : params.MDSSC_FAIL_ON_VULNERABILITIES.toString())

    if (!mdsscServer) {
        error("MDSSC_SERVER is required when ${label} scanning is enabled.")
    }

    withCredentials([string(credentialsId: credentialsId, variable: 'MDSSC_API_KEY')]) {
        sh """
            set -eu

            if [ ! -f ${shellQuote(filePath)} ]; then
                echo "MDSSC ${label} input file not found: ${filePath}"
                exit 1
            fi

            echo "Scanning ${label} with MDSSC API wrapper: ${filePath}"

            docker run --rm \
                --volumes-from "\$HOSTNAME" \
                -e MDSSC_SERVER=${shellQuote(mdsscServer)} \
                -e MDSSC_API_KEY="\$MDSSC_API_KEY" \
                -e SCAN_TIMEOUT=${shellQuote(scanTimeout)} \
                -e POLL_INTERVAL=${shellQuote(pollInterval)} \
                -e FAIL_ON_VULNERABILITIES=${shellQuote(failOnVulnerabilities)} \
                -e VULNERABILITY_THRESHOLD=${shellQuote(threshold)} \
                ${workflowEnv()} \
                opswat/mdssc-scanner:latest "\$PWD/${filePath}"
        """
    }
}

void scanArtifacts(Map config = [:]) {
    String artifactDir = config.artifactDir?.toString() ?: env.ARTIFACT_DIR ?: 'artifacts'
    List excludeNames = config.excludeNames ?: []
    String excludeArgs = excludeNames.collect { "! -name ${shellQuote(it.toString())}" }.join(' ')
    String skipLargeArtifacts = paramValue('MDSSC_SKIP_LARGE_ARTIFACTS', 'true')
    String maxUploadMb = paramValue('MDSSC_MAX_UPLOAD_MB', '100')

    sh """
        set -eu

        if [ ! -d ${shellQuote(artifactDir)} ]; then
            echo "Artifact directory not found: ${artifactDir}"
            exit 1
        fi

        artifact_count=\$(find ${shellQuote(artifactDir)} -maxdepth 1 -type f | wc -l)
        if [ "\$artifact_count" -eq 0 ]; then
            echo "No artifact files found in ${artifactDir}"
            exit 1
        fi
    """

    sh """
        set -eu

        find ${shellQuote(artifactDir)} -maxdepth 1 -type f ${excludeArgs} -print | while IFS= read -r artifact; do
            artifact_name=\$(basename "\$artifact")
            artifact_size_bytes=\$(wc -c < "\$artifact")
            max_size_bytes=\$(( ${maxUploadMb} * 1024 * 1024 ))

            if [ ${shellQuote(skipLargeArtifacts)} = "true" ] && [ "\$artifact_size_bytes" -gt "\$max_size_bytes" ]; then
                echo "Skipping MDSSC scan for \$artifact_name because it is larger than ${maxUploadMb} MB." >&2
                continue
            fi

            echo "\$artifact"
        done > .mdssc-artifacts-to-scan
    """

    sh '''
        set -eu
        if [ ! -s .mdssc-artifacts-to-scan ]; then
            echo "No artifact files selected for MDSSC scanning."
            exit 0
        fi
    '''

    String selectedArtifacts = sh(
        script: 'cat .mdssc-artifacts-to-scan',
        returnStdout: true
    ).trim()

    selectedArtifacts.split('\n').findAll { it.trim() }.each { artifact ->
        scanFile(path: artifact.trim(), label: "artifact ${artifact.tokenize('/').last()}")
    }
}

return this
