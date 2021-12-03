import * as core from '@actions/core';
import { Octokit } from '@octokit/core';

import getPreviousConclusion from '../src/get-previous-conclusion';

jest.mock('@actions/core');
jest.mock('@octokit/core');

const repository = 'owner/repo';
const branch = 'develop';
const workflowId = 'ci.yml';
const githubToken = '***';
const runId = 123456789;
const headSha = 'f0b00fd201c7ddf14e1572a10d5fb4577c4bd6a2';
const previousConclusion = 'success';
const errorObject = new Error('Oops!');
const emptyObject = {};

const resolveWorkflowRuns = () => Promise.resolve({
    status: 200,
    data: {
        workflow_runs: [
            {
                id: runId,
                head_sha: headSha,
                status: 'completed',
                conclusion: previousConclusion,
            },
        ],
    },
});

describe('getPreviousConclusion', () => {
    it('resolves the promise if workflow run was successful', async () => {
        expect.assertions(6);

        (Octokit.prototype.constructor as jest.Mock).mockImplementationOnce((options) => {
            if (!options.auth) throw Error('Octokit authentication missing, did you pass the auth key?');
            // eslint-disable-next-line jest/no-if
            if (options.auth !== githubToken) throw Error('Octokit authentication unsuccessful, please try again.');

            return {
                request: () => resolveWorkflowRuns(),
            };
        });

        await expect(getPreviousConclusion(repository, branch, workflowId, githubToken)).resolves.toStrictEqual(previousConclusion);
        expect(core.info).toHaveBeenCalledWith(`==> repository: ${repository}`);
        expect(core.info).toHaveBeenCalledWith(`==> branch: ${branch}`);
        expect(core.info).toHaveBeenCalledWith(`==> workflowId: ${workflowId}`);
        expect(core.info).toHaveBeenCalledWith(`==> lastRunId: ${runId}`);
        expect(core.info).toHaveBeenCalledWith(`==> previousConclusion: ${previousConclusion}`);
    });

    it('resolves the promise if unexpected status code is returned', async () => {
        expect.assertions(1);

        (Octokit.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            request: () => Promise.resolve({
                status: 500,
            }),
        }));

        await expect(getPreviousConclusion(repository, branch, workflowId, githubToken)).resolves.toBe('unknown');
    });

    it.each`
        error
        ${errorObject}
        ${emptyObject}
    `('resolves the promise if request throws an error ($error)', async ({ error }) => {
        expect.assertions(1);

        (Octokit.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            request: () => {
                throw error;
            },
        }));

        await expect(getPreviousConclusion(repository, branch, workflowId, githubToken)).resolves.toBe('unknown');
    });

    it('resolves the promise if workflow runs response is undefined', async () => {
        expect.assertions(1);

        (Octokit.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            request: () => Promise.resolve({
                status: 200,
                data: {},
            }),
        }));

        await expect(getPreviousConclusion(repository, branch, workflowId, githubToken)).resolves.toBe('unknown');
    });

    it('resolves the promise if last workflow run has unexpected data', async () => {
        expect.assertions(1);

        (Octokit.prototype.constructor as jest.Mock).mockImplementationOnce(() => ({
            request: () => Promise.resolve({
                status: 200,
                data: {
                    workflow_runs: [
                        {},
                    ],
                },
            }),
        }));

        await expect(getPreviousConclusion(repository, branch, workflowId, githubToken)).resolves.toBe('unknown');
    });
});