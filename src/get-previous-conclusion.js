const core = require('@actions/core');
const { Octokit } = require('@octokit/core');

const { isError } = require('./helper-functions');

/**
 * Returns conclusion of a previous workflow run.
 *
 * @param {String} repository Github repository owner and name to check.
 * @param {String} branch Branch name to check.
 * @param {String} workflowId The ID or filename of the CI workflow to check.
 * @param {String} githubToken Github access token, with `actions:read` scope.
 * @returns {String} Conclusion of a previous workflow run
 */
module.exports = async (repository, branch, workflowId, githubToken) => {
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

        workflowRuns = response.data.workflow_runs || [];
    }
    catch (error) {
        isError(true, `Error fetching workflow runs for ${repo}: ${error.message}`);
        return previousConclusion;
    }

    const lastRun = workflowRuns.shift();

    if (lastRun) {
        core.info(`==> lastRunId: ${lastRun.id || 'unknown'}`);

        previousConclusion = lastRun.conclusion || 'unknown';
    }

    core.info(`==> previousConclusion: ${previousConclusion}`);

    core.endGroup();

    return previousConclusion;
};