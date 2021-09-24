const core = require('@actions/core');

const main = require('../src/main');

const getAllJobs = require('../src/get-all-jobs');
const getPreviousConclusion = require('../src/get-previous-conclusion');
const sendTeamsMessage = require('../src/send-teams-message');

jest.mock('@actions/core');
jest.mock('../src/get-all-jobs');
jest.mock('../src/get-previous-conclusion');
jest.mock('../src/send-teams-message');

const inputs = {
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

const jobs = [
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

        core.getInput.mockImplementation((inputName) => inputs[inputName]);
        core.getMultilineInput.mockImplementation((inputName) => inputs[inputName]);

        getAllJobs.mockReturnValue(jobs);
        getPreviousConclusion.mockResolvedValue(previousConclusion);
        sendTeamsMessage.mockResolvedValue({
            workflowStatus,
            messageSent,
        });

        await expect(main.call()).resolves.toStrictEqual(outputs);

        getAllJobs.mockReset();
        getPreviousConclusion.mockReset();
        sendTeamsMessage.mockReset();
        core.getInput.mockReset();
        core.getMultilineInput.mockReset();
    });

    it('resolves the promise if message was not sent', async () => {
        expect.assertions(1);

        core.getInput.mockImplementation((inputName) => inputs[inputName]);
        core.getMultilineInput.mockImplementation((inputName) => inputs[inputName]);

        getAllJobs.mockReturnValue(jobs);
        getPreviousConclusion.mockResolvedValue(previousConclusion);
        sendTeamsMessage.mockResolvedValue({
            workflowStatus,
            messageSent: false,
        });

        await expect(main.call()).resolves.toStrictEqual({
            ...outputs,
            message_sent: false,
        });

        getAllJobs.mockReset();
        getPreviousConclusion.mockReset();
        sendTeamsMessage.mockReset();
        core.getInput.mockReset();
        core.getMultilineInput.mockReset();
    });

    it('resolves the promise if no needs context was provided', async () => {
        expect.assertions(1);

        core.getInput.mockImplementation((inputName) => {
            if (inputName === 'needs_context') return null;
            return inputs[inputName];
        });
        core.getMultilineInput.mockImplementation((inputName) => inputs[inputName]);

        getAllJobs.mockReturnValue(jobs.filter((job) => job.name === 'notify'));
        getPreviousConclusion.mockResolvedValue(previousConclusion);
        sendTeamsMessage.mockResolvedValue({
            workflowStatus,
            messageSent,
        });

        await expect(main.call()).resolves.toStrictEqual({
            ...outputs,
            jobs: JSON.stringify(jobs.filter((job) => job.name === 'notify'), null, 4),
        });

        getAllJobs.mockReset();
        getPreviousConclusion.mockReset();
        sendTeamsMessage.mockReset();
        core.getInput.mockReset();
        core.getMultilineInput.mockReset();
    });

    it('rejects the promise if an error is thrown', async () => {
        expect.assertions(1);

        core.getInput.mockImplementation((inputName) => inputs[inputName]);
        core.getMultilineInput.mockImplementation((inputName) => inputs[inputName]);

        getAllJobs.mockReturnValue(jobs);
        getPreviousConclusion.mockResolvedValue(previousConclusion);

        const errorMessage = 'Oops!';

        sendTeamsMessage.mockImplementation(() => {
            throw Error(errorMessage);
        });

        await expect(main.call()).rejects.toBe(errorMessage);

        getAllJobs.mockReset();
        getPreviousConclusion.mockReset();
        sendTeamsMessage.mockReset();
        core.getInput.mockReset();
        core.getMultilineInput.mockReset();
    });
});
