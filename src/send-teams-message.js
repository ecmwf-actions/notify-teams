const core = require('@actions/core');
const { HttpClient } = require('@actions/http-client');

const { isError } = require('./helper-functions');

/**
 * Sends a message to MS Teams if all required conditions are met.
 *
 * @param {Array} jobs The list of all current jobs and their states.
 * @param {String} previousConclusion The conclusion of the previous workflow run.
 * @param {Array} notifyOn The list of states to notify on.
 * @param {String} repository The currently checked out source repository name.
 * @param {String} branch The current repository branch name.
 * @param {String} sha The current repository commit SHA.
 * @param {String} workflow The name of the current workflow.
 * @param {String} runId The ID of the current workflow run.
 * @param {String} incomingWebhook Public URL of the Microsoft Teams incoming webhook.
 * @returns {Array<Object>} List of all jobs with `name` and `value` keys.
 */
module.exports = async (jobs, previousConclusion, notifyOn, repository, branch, sha, workflow, runId, incomingWebhook) => {
    core.startGroup('Send Message to Teams');

    branch = branch.replace(/^refs\/heads\//, '');

    core.info(`==> branch: ${branch}`);

    const result = {};
    let messages;

    core.info(`==> notifyOn: ${notifyOn}`);

    // Check results of all jobs in the same run and determine workflow status and appropriate message values.
    if (jobs.filter((job) => job.value === 'failure').length) {
        result.workflowStatus = 'failure';

        messages = {
            title: 'failed',
            text: 'Some jobs were not successful',
            color: '#cb2431',
        };
    }
    else if (jobs.filter((job) => job.value === 'cancelled').length) {
        result.workflowStatus = 'cancelled';

        messages = {
            title: 'cancelled',
            text: 'Some jobs were not successful',
            color: '#959da5',
        };
    }
    else {
        result.workflowStatus = 'success';

        messages = {
            title: 'succeeded',
            text: 'All jobs were successful',
            color: '#28a745',
        };
    }

    core.info(`==> workflowStatus: ${result.workflowStatus}`);
    core.info(`==> messages: ${JSON.stringify(messages, null, 4)}`);

    result.messageSent = false;

    // Send a status message to the configured MS Teams channel if:
    // - failure notification is active and current workflow run has failed or was cancelled
    // - success notification is active and current workflow run has succeeded
    // - fixed notification is active and this is a first successful workflow run after a failure or cancellation
    if (
        (
            notifyOn.includes('failure')
            && (
                result.workflowStatus === 'failure'
                || result.workflowStatus === 'cancelled'
            )
        )
        || (
            notifyOn.includes('success')
            && result.workflowStatus === 'success'
        )
        || (
            notifyOn.includes('fixed')
            && result.workflowStatus === 'success'
            && (
                previousConclusion === 'failure' || previousConclusion === 'cancelled'
            )
        )
    ) {
        const messageCard = {
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            themeColor: messages.color,
            title: `[${repository}] Run ${messages.title}: ${workflow} - ${branch} (${sha.substring(0, 7)})`,
            summary: `${workflow}: ${messages.text}`,
            text: `${workflow}: ${messages.text}`,
            sections: [
                {
                    facts: jobs,
                },
            ],
            potentialAction: [
                {
                    '@type': 'OpenUri',
                    name: 'View workflow run',
                    targets: [
                        {
                            os: 'default',
                            uri: `https://github.com/${repository}/actions/runs/${runId}`,
                        },
                    ],
                },
            ],
        };

        core.info('==> Sending message to MS Teams...');

        core.info(`==> messageCard: ${JSON.stringify(messageCard, null, 4)}`);

        try {
            const response = await new HttpClient().postJson(incomingWebhook, messageCard);

            if (isError(response.statusCode != 200, `Wrong response code while sending message to MS Teams: ${response.statusCode}`))
                return Promise.reject(result);
        }
        catch (error) {
            isError(true, `Error sending message to MS Teams: ${error.message}`);
            return Promise.reject(result);
        }

        result.messageSent = true;
    }
    else {
        core.info('==> Skipping sending of message to MS Teams...');
    }

    core.endGroup();

    return result;
};
