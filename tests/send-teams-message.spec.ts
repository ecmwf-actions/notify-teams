import * as core from '@actions/core';
import { HttpClient } from '@actions/http-client';

import sendTeamsMessage from '../src/send-teams-message';

jest.mock('@actions/core');
jest.mock('@actions/http-client');

const jobs: JobStatus[] = [
    {
        name: 'qa',
        value: 'success',
    },
    {
        name: 'ci',
        value: 'failure',
    },
    {
        name: 'deploy',
        value: 'skipped',
    },
    {
        name: 'notify',
        value: 'success',
    }
];

const previousConclusion = 'success';
const notifyOn: NotifyOn[] = [
    'failure',
    'success',
    'fixed',
];
const repository = 'owner/repo';
const branch = 'develop';
const sha = 'f0b00fd201c7ddf14e1572a10d5fb4577c4bd6a2';
const workflow = 'ci';
const runId = 1234567;
const incomingWebhook = 'https://ecmwf.webhook.office.com/webhookb2/bc6235c5-08d5-4273-b888-26f734e0e2e5@60a30f25-f937-4a3f-a956-4b8fd3764dc0/IncomingWebhook/2fd4e1c67a2d28fced849ee1bb76e7391b93eb12/c3cfbb78-8a55-47c8-a2b9-6371fc2cda72';
const messages = {
    title: 'failed',
    text: 'Some jobs were not successful',
    color: '#cb2431',
};
const messageCard = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: '#cb2431',
    title: `[${repository}] Run ${messages.title}: ${workflow} - ${branch} (${sha.substring(0,7)})`,
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
const workflowStatus = 'failure';
const messageSent = true;

const result: SendResult = {
    workflowStatus,
    messageSent,
};

const errorObject = new Error('Oops!');
const emptyObject = {};

describe('sendTeamsMessage', () => {
    it('resolves the promise when message is sent on failure', async () => {
        expect.assertions(8);

        (HttpClient.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            postJson: () => Promise.resolve({
                statusCode: 200,
            }),
        }));

        await expect(sendTeamsMessage(jobs, previousConclusion, notifyOn, repository, branch, sha, workflow, runId, incomingWebhook)).resolves.toStrictEqual(result);
        expect(core.info).toHaveBeenCalledWith(`==> branch: ${branch}`);
        expect(core.info).toHaveBeenCalledWith(`==> notifyOn: ${notifyOn}`);
        expect(core.info).toHaveBeenCalledWith(`==> workflowStatus: ${workflowStatus}`);
        expect(core.info).toHaveBeenCalledWith(`==> messages: ${JSON.stringify(messages, null, 4)}`);
        expect(core.info).toHaveBeenCalledWith('==> Sending message to MS Teams...');
        expect(core.info).toHaveBeenCalledWith(`==> messageCard: ${JSON.stringify(messageCard, null, 4)}`);
        expect(core.info).not.toHaveBeenCalledWith('==> Skipping sending of message to MS Teams...');
    });

    it('resolves the promise when message is sent on cancellation', async () => {
        expect.assertions(1);

        const cancelledJobs = [
            ...jobs,
        ];
        cancelledJobs[1].value = 'cancelled';

        (HttpClient.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            postJson: () => Promise.resolve({
                statusCode: 200,
            }),
        }));

        await expect(sendTeamsMessage(cancelledJobs, previousConclusion, notifyOn, repository, branch, sha, workflow, runId, incomingWebhook)).resolves.toStrictEqual({
            ...result,
            workflowStatus: 'cancelled',
        });
    });

    it('resolves the promise when message is sent on success', async () => {
        expect.assertions(1);

        const successfulJobs = [
            ...jobs,
        ];
        successfulJobs[1].value = 'success';

        (HttpClient.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            postJson: () => Promise.resolve({
                statusCode: 200,
            }),
        }));

        await expect(sendTeamsMessage(successfulJobs, previousConclusion, notifyOn, repository, branch, sha, workflow, runId, incomingWebhook)).resolves.toStrictEqual({
            ...result,
            workflowStatus: 'success',
        });
    });

    it('resolves the promise when message is not sent on success', async () => {
        expect.assertions(3);

        const successfulJobs = [
            ...jobs,
        ];
        successfulJobs[1].value = 'success';

        const notifyOnFailure: NotifyOn[] = [
            'failure',
            'fixed',
        ];

        await expect(sendTeamsMessage(successfulJobs, previousConclusion, notifyOnFailure, repository, branch, sha, workflow, runId, incomingWebhook)).resolves.toStrictEqual({
            ...result,
            workflowStatus: 'success',
            messageSent: false,
        });
        expect(core.info).not.toHaveBeenCalledWith('==> Sending message to MS Teams...');
        expect(core.info).toHaveBeenCalledWith('==> Skipping sending of message to MS Teams...');
    });

    it('resolves the promise when message is sent on fixed', async () => {
        expect.assertions(1);

        const successfulJobs = [
            ...jobs,
        ];
        successfulJobs[1].value = 'success';

        const notifyOnFixed: NotifyOn[] = [
            'fixed',
        ];

        (HttpClient.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            postJson: () => Promise.resolve({
                statusCode: 200,
            }),
        }));

        await expect(sendTeamsMessage(successfulJobs, 'failure', notifyOnFixed, repository, branch, sha, workflow, runId, incomingWebhook)).resolves.toStrictEqual({
            ...result,
            workflowStatus: 'success',
        });
    });

    it('rejects the promise if request for sending messages returns unexpected status code', async () => {
        expect.assertions(1);

        (HttpClient.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            postJson: () => Promise.resolve({
                statusCode: 500,
            }),
        }));

        await expect(sendTeamsMessage(jobs, previousConclusion, notifyOn, repository, branch, sha, workflow, runId, incomingWebhook)).rejects.toStrictEqual({
            workflowStatus: 'success',
            messageSent: false,
        });
    });

    it.each`
        error
        ${errorObject}
        ${emptyObject}
    `('rejects the promise if request for sending messages throws an error ($error)', async ({ error }) => {
        expect.assertions(1);

        (HttpClient.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            postJson: () => {
                throw error;
            },
        }));

        await expect(sendTeamsMessage(jobs, previousConclusion, notifyOn, repository, branch, sha, workflow, runId, incomingWebhook)).rejects.toStrictEqual({
            workflowStatus: 'success',
            messageSent: false,
        });
    });
});