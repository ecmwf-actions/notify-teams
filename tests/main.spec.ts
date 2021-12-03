import * as core from '@actions/core';

import main from '../src/main';

import getAllJobs from '../src/get-all-jobs';
import getPreviousConclusion from '../src/get-previous-conclusion';
import sendTeamsMessage from '../src/send-teams-message';

jest.mock('@actions/core');
jest.mock('../src/get-all-jobs');
jest.mock('../src/get-previous-conclusion');
jest.mock('../src/send-teams-message');

const errorObject = new Error('Oops!');
const emptyObject = {};

const inputs: ActionInputs = {
    job: 'notify',
    job_context: JSON.stringify({
        status: 'success',
        container: {
            network: 'github_network_20b575dd5aef46dfb2259c89c0c1664d',
            id: 'ca715f77d221a6c1b187e8594462fb52a21cfd0a7cdf9cb25856de1d16e8a47d',
        },
    }),
    needs_context: JSON.stringify({
        qa: {
            outputs: {},
            result: 'success',
        },
        ci: {
            outputs: {},
            result: 'failure',
        },
        deploy: {
            outputs: {},
            result: 'skipped',
        },
    }),
    repository: 'owner/repo',
    branch: 'develop',
    sha: 'f0b00fd201c7ddf14e1572a10d5fb4577c4bd6a2',
    workflow: 'ci',
    workflow_id: 'ci.yml',
    run_id: 1234567,
    notify_on: [
        'failure',
        'fixed',
    ],
    github_token: '***',
    incoming_webhook: 'https://ecmwf.webhook.office.com/webhookb2/bc6235c5-08d5-4273-b888-26f734e0e2e5@60a30f25-f937-4a3f-a956-4b8fd3764dc0/IncomingWebhook/2fd4e1c67a2d28fced849ee1bb76e7391b93eb12/c3cfbb78-8a55-47c8-a2b9-6371fc2cda72',
};

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
const workflowStatus = 'failure';
const messageSent = true;

const outputs = {
    jobs: JSON.stringify(jobs, null, 4),
    workflow_status: workflowStatus,
    previous_conclusion: previousConclusion,
    message_sent: messageSent,
};

describe('main', () => {
    it('resolves the promise if message was sent', async () => {
        expect.assertions(1);

        (core.getInput as jest.Mock).mockImplementation((inputName) => inputs[inputName as keyof ActionInputs]);
        (core.getMultilineInput as jest.Mock).mockImplementation((inputName) => inputs[inputName]);

        (getAllJobs as jest.Mock).mockReturnValueOnce(jobs);
        (getPreviousConclusion as jest.Mock).mockResolvedValueOnce(previousConclusion);
        (sendTeamsMessage as jest.Mock).mockResolvedValueOnce({
            workflowStatus,
            messageSent,
        });

        await expect(main()).resolves.toStrictEqual(outputs);
    });

    it('resolves the promise if message was not sent', async () => {
        expect.assertions(1);

        (core.getInput as jest.Mock).mockImplementation((inputName) => inputs[inputName]);
        (core.getMultilineInput as jest.Mock).mockImplementation((inputName) => inputs[inputName]);

        (getAllJobs as jest.Mock).mockReturnValueOnce(jobs);
        (getPreviousConclusion as jest.Mock).mockResolvedValueOnce(previousConclusion);
        (sendTeamsMessage as jest.Mock).mockResolvedValueOnce({
            workflowStatus,
            messageSent: false,
        });

        await expect(main()).resolves.toStrictEqual({
            ...outputs,
            message_sent: false,
        });
    });

    it('resolves the promise if no needs context was provided', async () => {
        expect.assertions(1);

        (core.getInput as jest.Mock).mockImplementation((inputName) => {
            if (inputName === 'needs_context') return null;
            return inputs[inputName];
        });
        (core.getMultilineInput as jest.Mock).mockImplementation((inputName) => inputs[inputName]);

        (getAllJobs as jest.Mock).mockReturnValueOnce(jobs.filter((job) => job.name === 'notify'));
        (getPreviousConclusion as jest.Mock).mockResolvedValueOnce(previousConclusion);
        (sendTeamsMessage as jest.Mock).mockResolvedValueOnce({
            workflowStatus,
            messageSent,
        });

        await expect(main()).resolves.toStrictEqual({
            ...outputs,
            jobs: JSON.stringify(jobs.filter((job) => job.name === 'notify'), null, 4),
        });
    });

    it.each`
        error
        ${errorObject}
        ${emptyObject}
    `('rejects the promise if an error is thrown', async ({ error }) => {
        expect.assertions(1);

        (core.getInput as jest.Mock).mockImplementation((inputName) => inputs[inputName]);
        (core.getMultilineInput as jest.Mock).mockImplementation((inputName) => inputs[inputName]);

        (getAllJobs as jest.Mock).mockReturnValueOnce(jobs);
        (getPreviousConclusion as jest.Mock).mockResolvedValueOnce(previousConclusion);

        (sendTeamsMessage as jest.Mock).mockImplementationOnce(() => {
            throw error;
        });

        await expect(main()).rejects.toBe(error.message);
    });
});
