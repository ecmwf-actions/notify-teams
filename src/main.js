const core = require('@actions/core');

const getAllJobs = require('./get-all-jobs');
const getPreviousConclusion = require('./get-previous-conclusion');
const sendTeamsMessage = require('./send-teams-message');

/**
 * First, the main function parses all workflow jobs that were passed to the action via job and needs contexts. Then,
 *   it retrieves the conclusion of a previous workflow run, if applicable. A message will be posted to Teams in case
 *   configured conditions were met.
 *
 * @returns {Promise} Outputs object on resolution, failure message on rejection.
 */
module.exports = async () => {
    try {
        const incomingWebhook = core.getInput('incoming_webhook', { required: true });
        const notifyOn = core.getMultilineInput('notify_on', { required: true });
        const job = core.getInput('job', { required: true });
        const jobContext = JSON.parse(core.getInput('job_context', { required: true }));
        const needsContext = JSON.parse(core.getInput('needs_context', { required: false }) || '{}');
        const repository = core.getInput('repository', { required: true });
        const branch = core.getInput('branch', { required: true });
        const sha = core.getInput('sha', { required: true });
        const workflow = core.getInput('workflow', { required: true });
        const workflowId = core.getInput('workflow_id', { required: true });
        const runId = core.getInput('run_id', { required: true });
        const githubToken = core.getInput('github_token', { required: true });

        const jobs = getAllJobs(job, jobContext, needsContext);

        const previousConclusion = await getPreviousConclusion(repository, branch, workflowId, githubToken);

        const result = await sendTeamsMessage(jobs, previousConclusion, notifyOn, repository, branch, sha, workflow, runId, incomingWebhook);

        const outputs = {
            jobs: JSON.stringify(jobs, null, 4),
            previous_conclusion: previousConclusion,
            workflow_status: result.workflowStatus,
            message_sent: result.messageSent,
        };

        return Promise.resolve(outputs);
    }
    catch (error) {
        return Promise.reject(error.message);
    }
};
