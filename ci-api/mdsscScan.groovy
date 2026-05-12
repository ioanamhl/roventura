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

String apiBaseUrl(String server) {
    String cleanServer = server.replaceAll('/+$', '')
    return cleanServer.endsWith('/api') ? cleanServer : "${cleanServer}/api"
}

String optionalWorkflowForm() {
    String workflowId = paramValue('MDSSC_WORKFLOW_ID')
    return workflowId ? "-F workflowId=${shellQuote(workflowId)}" : ''
}

String optionalMetadataForm(String label) {
    String metadata = "{\"source\":\"jenkins\",\"label\":\"${label.replace('"', '\\"')}\"}"
    return "-F metadata=${shellQuote(metadata)}"
}

void scanFile(Map config = [:]) {
    String filePath = config.path?.toString()
    if (!filePath) {
        error('MDSSC scanFile requires a path.')
    }

    String label = config.label?.toString() ?: filePath
    String mdsscServer = config.server?.toString()?.trim() ?: paramValue('MDSSC_SERVER', 'http://35.156.106.42')
    String credentialsId = config.credentialsId?.toString()?.trim() ?: paramValue('MDSSC_CREDENTIALS_ID', 'mdssc-api-key')
    String apiKeyHeader = config.apiKeyHeader?.toString()?.trim() ?: paramValue('MDSSC_API_KEY_HEADER', 'apikey')
    String scanTimeout = config.scanTimeout?.toString()?.trim() ?: paramValue('MDSSC_SCAN_TIMEOUT', '900')
    String pollInterval = config.pollInterval?.toString()?.trim() ?: paramValue('MDSSC_POLL_INTERVAL', '10')
    String threshold = config.vulnerabilityThreshold?.toString()?.trim() ?: paramValue('MDSSC_VULNERABILITY_THRESHOLD', 'critical')
    String failOnVulnerabilities = config.failOnVulnerabilities != null
        ? config.failOnVulnerabilities.toString()
        : (params.MDSSC_FAIL_ON_VULNERABILITIES == null ? 'false' : params.MDSSC_FAIL_ON_VULNERABILITIES.toString())
    String baseUrl = apiBaseUrl(mdsscServer)
    String responsePrefix = ".mdssc-${label.replaceAll('[^A-Za-z0-9_.-]', '-')}"

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

            echo "Submitting ${label} to MDSSC direct API: ${filePath}"

            http_code=\$(curl -sS -w '%{http_code}' -o ${shellQuote("${responsePrefix}-submit.json")} \\
                -X POST ${shellQuote("${baseUrl}/v1/scans/direct")} \\
                -H ${shellQuote("${apiKeyHeader}: ")}"\$MDSSC_API_KEY" \\
                -F file=@${shellQuote(filePath)} \\
                ${optionalWorkflowForm()} \\
                ${optionalMetadataForm(label)})

            if [ "\$http_code" -lt 200 ] || [ "\$http_code" -ge 300 ]; then
                echo "MDSSC direct API submission failed for ${label}. HTTP \$http_code"
                cat ${shellQuote("${responsePrefix}-submit.json")}
                exit 1
            fi

            node -e "
                const fs = require('fs');
                const data = JSON.parse(fs.readFileSync(${shellQuote("${responsePrefix}-submit.json")}, 'utf8'));
                const scanIds = data.scanIds || data.ScanIds || data.ScanIDs || data.scanIDs;
                const scanId = Array.isArray(scanIds) ? scanIds[0] : (data.scanId || data.ScanId || data.id || data.Id);
                if (!scanId) {
                    console.error('No scan ID returned by MDSSC direct API.');
                    console.error(JSON.stringify(data, null, 2));
                    process.exit(1);
                }
                fs.writeFileSync(${shellQuote("${responsePrefix}-scan-id.txt")}, String(scanId));
                console.log('MDSSC scan ID: ' + scanId);
            "

            scan_id=\$(cat ${shellQuote("${responsePrefix}-scan-id.txt")})
            elapsed=0

            while [ "\$elapsed" -le ${shellQuote(scanTimeout)} ]; do
                result_http_code=\$(curl -sS -w '%{http_code}' -o ${shellQuote("${responsePrefix}-result.json")} \\
                    -H ${shellQuote("${apiKeyHeader}: ")}"\$MDSSC_API_KEY" \\
                    ${shellQuote("${baseUrl}/v1/scans")}/"\$scan_id")

                if [ "\$result_http_code" -lt 200 ] || [ "\$result_http_code" -ge 300 ]; then
                    echo "MDSSC direct API result lookup failed for ${label}. HTTP \$result_http_code"
                    cat ${shellQuote("${responsePrefix}-result.json")}
                    exit 1
                fi

                node -e "
                    const fs = require('fs');
                    const data = JSON.parse(fs.readFileSync(${shellQuote("${responsePrefix}-result.json")}, 'utf8'));
                    const status =
                        data.scanStatus?.scanningState ||
                        data.ScanStatus?.ScanningState ||
                        data.ScanStatus ||
                        data.scanStatus ||
                        data.status ||
                        data.Status ||
                        data.discoveryStatus ||
                        data.DiscoveryStatus ||
                        'Unknown';
                    const elapsed = process.env.ELAPSED || '0';
                    console.log('MDSSC status for ${label}: ' + status + ' (elapsed ' + elapsed + 's)');
                    const normalized = String(status).toLowerCase();
                    if (['completed', 'complete', 'finished', 'done', 'success'].includes(normalized)) process.exit(0);
                    if (['failed', 'failure', 'error', 'cancelled', 'canceled'].includes(normalized)) process.exit(2);
                    process.exit(1);
                " && break || status_code=\$?

                if [ "\$status_code" -eq 2 ]; then
                    echo "MDSSC scan failed for ${label}."
                    cat ${shellQuote("${responsePrefix}-result.json")}
                    exit 1
                fi

                sleep ${shellQuote(pollInterval)}
                elapsed=\$((elapsed + ${pollInterval}))
                export ELAPSED="\$elapsed"
            done

            if [ "\$elapsed" -gt ${shellQuote(scanTimeout)} ]; then
                echo "MDSSC scan timed out for ${label} after ${scanTimeout}s."
                exit 1
            fi

            node -e "
                const fs = require('fs');
                const data = JSON.parse(fs.readFileSync(${shellQuote("${responsePrefix}-result.json")}, 'utf8'));
                const issues =
                    data.vulnerabilityIssues ||
                    data.VulnerabilityIssues ||
                    data.scanInformation?.vulnerabilityIssues ||
                    data.ScanInformation?.VulnerabilityIssues ||
                    data.ScanInformation?.VulnerabilityIssues?.SeverityCount ||
                    {};
                const counts = {
                    critical: Number(issues.critical ?? issues.Critical ?? 0),
                    high: Number(issues.high ?? issues.High ?? 0),
                    medium: Number(issues.medium ?? issues.Medium ?? 0),
                    low: Number(issues.low ?? issues.Low ?? 0),
                    unknown: Number(issues.unknown ?? issues.Unknown ?? 0),
                };
                console.log('');
                console.log('==========================================');
                console.log('       MDSSC DIRECT API SCAN SUMMARY      ');
                console.log('==========================================');
                console.log('Label:             ${label}');
                console.log('Scan ID:           ' + fs.readFileSync(${shellQuote("${responsePrefix}-scan-id.txt")}, 'utf8').trim());
                console.log('Critical:          ' + counts.critical);
                console.log('High:              ' + counts.high);
                console.log('Medium:            ' + counts.medium);
                console.log('Low:               ' + counts.low);
                console.log('Unknown:           ' + counts.unknown);
                console.log('==========================================');

                const threshold = ${shellQuote(threshold.toLowerCase())};
                const order = ['low', 'medium', 'high', 'critical'];
                const thresholdIndex = order.indexOf(threshold);
                const failing = order
                    .filter((severity) => order.indexOf(severity) >= thresholdIndex)
                    .some((severity) => counts[severity] > 0);

                if (${shellQuote(failOnVulnerabilities)} === 'true' && failing) {
                    console.error('MDSSC vulnerabilities found at or above threshold: ' + threshold);
                    process.exit(2);
                }
            "
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

        find ${shellQuote(artifactDir)} -maxdepth 1 -type f ${excludeArgs} -print | while IFS= read -r artifact; do
            artifact_name=\$(basename "\$artifact")
            artifact_size_bytes=\$(wc -c < "\$artifact")
            max_size_bytes=\$(( ${maxUploadMb} * 1024 * 1024 ))

            if [ ${shellQuote(skipLargeArtifacts)} = "true" ] && [ "\$artifact_size_bytes" -gt "\$max_size_bytes" ]; then
                echo "Skipping MDSSC direct API scan for \$artifact_name because it is larger than ${maxUploadMb} MB." >&2
                continue
            fi

            echo "\$artifact"
        done > .mdssc-artifacts-to-scan

        if [ ! -s .mdssc-artifacts-to-scan ]; then
            echo "No artifact files selected for MDSSC scanning."
            exit 0
        fi
    """

    String selectedArtifacts = sh(
        script: 'cat .mdssc-artifacts-to-scan',
        returnStdout: true
    ).trim()

    selectedArtifacts.split('\n').findAll { it.trim() }.each { artifact ->
        scanFile(path: artifact.trim(), label: "artifact ${artifact.tokenize('/').last()}")
    }
}

return this
