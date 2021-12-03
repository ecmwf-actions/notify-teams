import * as core from '@actions/core';
import { HttpClient } from '@actions/http-client';

import { isError } from './helper-functions';

/**
 * Sends a message to MS Teams if all required conditions are met.
 *
 * @param {JobStatus[]} jobs The list of all current jobs and their states.
 * @param {string} previousConclusion The conclusion of the previous workflow run.
 * @param {NotifyOn[]} notifyOn The list of states to notify on.
 * @param {string} repository The currently checked out source repository name.
 * @param {string} branch The current repository branch name.
 * @param {string} sha The current repository commit SHA.
 * @param {string} workflow The name of the current workflow.
 * @param {number|string} runId The ID of the current workflow run.
 * @param {string} incomingWebhook Public URL of the Microsoft Teams incoming webhook.
 * @returns {Promise<SendResult>} Result object with workflow status and information whether the message was sent.
 */
const sendTeamsMessage = async (jobs: JobStatus[], previousConclusion: string, notifyOn: NotifyOn[], repository: string, branch: string, sha: string, workflow: string, runId: number | string, incomingWebhook: string): Promise<SendResult> => {
    core.startGroup('Send Message to Teams');

    branch = branch.replace(/^refs\/heads\//, '');

    core.info(`==> branch: ${branch}`);

    const result = {};
    let messages;

    core.info(`==> notifyOn: ${notifyOn}`);

    // Check results of all jobs in the same run and determine workflow status and appropriate message values.
    if (jobs.filter((job) => job.value === 'failure').length) {
        (result as SendResult).workflowStatus = 'failure';

        messages = {
            title: 'failed',
            text: 'Some jobs were not successful',
            color: '#cb2431',
        };
    }
    else if (jobs.filter((job) => job.value === 'cancelled').length) {
        (result as SendResult).workflowStatus = 'cancelled';

        messages = {
            title: 'cancelled',
            text: 'Some jobs were not successful',
            color: '#959da5',
        };
    }
    else {
        (result as SendResult).workflowStatus = 'success';

        messages = {
            title: 'succeeded',
            text: 'All jobs were successful',
            color: '#28a745',
        };
    }

    core.info(`==> workflowStatus: ${(result as SendResult).workflowStatus}`);
    core.info(`==> messages: ${JSON.stringify(messages, null, 4)}`);

    (result as SendResult).messageSent = false;

    // Send a status message to the configured MS Teams channel if:
    // - failure notification is active and current workflow run has failed or was cancelled
    // - success notification is active and current workflow run has succeeded
    // - fixed notification is active and this is a first successful workflow run after a failure or cancellation
    if (
        (
            notifyOn.includes('failure')
            && (
                (result as SendResult).workflowStatus === 'failure'
                || (result as SendResult).workflowStatus === 'cancelled'
            )
        )
        || (
            notifyOn.includes('success')
            && (result as SendResult).workflowStatus === 'success'
        )
        || (
            notifyOn.includes('fixed')
            && (result as SendResult).workflowStatus === 'success'
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
            if (error instanceof Error) isError(true, `Error sending message to MS Teams: ${error.message}`);
            return Promise.reject(result);
        }

        (result as SendResult).messageSent = true;
    }
    else {
        core.info('==> Skipping sending of message to MS Teams...');
    }

    core.endGroup();

    return result as SendResult;
};

export default sendTeamsMessage;
