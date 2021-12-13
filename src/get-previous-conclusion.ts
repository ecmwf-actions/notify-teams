import * as core from '@actions/core';
import { Octokit } from '@octokit/core';

import { isError } from './helper-functions';

/**
 * Returns conclusion of a previous workflow run.
 *
 * @param {string} repository Github repository owner and name to check.
 * @param {string} branch Branch name to check.
 * @param {string} workflowId The ID or filename of the CI workflow to check.
 * @param {string} githubToken Github access token, with `actions:read` scope.
 * @returns {Promise<string>} Conclusion of a previous workflow run.
 */
const getPreviousConclusion = async (repository: string, branch: string, workflowId: string, githubToken: string): Promise<string> => {
    core.startGroup('Previous Conclusion');

    const [owner, repo] = repository.split('/');

    core.info(`==> repository: ${owner}/${repo}`);

    branch = branch.replace(/^refs\/heads\//, '');

    core.info(`==> branch: ${branch}`);
    core.info(`==> workflowId: ${workflowId}`);

    // Fetch previous workflow run conclusion via REST API for the same branch.
    const octokit = new Octokit({
        auth: githubToken,
    });

    let previousConclusion = 'unknown';
    let workflowRuns;

    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
            owner,
            repo,
            branch,
            workflow_id: workflowId,
        });

        if (isError(response.status != 200, `Wrong response code while fetching workflow runs for ${repo}: ${response.status}`))
            return previousConclusion;

        workflowRuns = response.data.workflow_runs as WorkflowRun[] || [];
    }
    catch (error) {
        if (error instanceof Error) isError(true, `Error fetching workflow runs for ${repo}: ${error.message}`);
        return previousConclusion;
    }

    // Consider only workflow runs that:
    // - have status "completed"
    workflowRuns = workflowRuns.filter((workflowRun) => workflowRun.status === 'completed');

    const lastRun = workflowRuns.shift() || {};

    core.info(`==> lastRunId: ${lastRun?.id || 'unknown'}`);

    previousConclusion = lastRun?.conclusion || 'unknown';

    core.info(`==> previousConclusion: ${previousConclusion}`);

    core.endGroup();

    return previousConclusion;
};

export default getPreviousConclusion;
