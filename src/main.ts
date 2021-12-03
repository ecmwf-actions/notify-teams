import * as core from '@actions/core';

import getAllJobs from './get-all-jobs';
import getPreviousConclusion from './get-previous-conclusion';
import sendTeamsMessage from './send-teams-message';

/**
 * First, the main function parses all workflow jobs that were passed to the action via job and needs contexts. Then,
 *   it retrieves the conclusion of a previous workflow run, if applicable. A message will be posted to Teams in case
 *   configured conditions were met.
 *
 * @returns {Promise<ActionOutputs>} Outputs object on resolution, failure message on rejection.
 */
const main = async (): Promise<ActionOutputs> => {
    try {
        const incomingWebhook = core.getInput('incoming_webhook', { required: true });
        const notifyOn = core.getMultilineInput('notify_on', { required: true }) as NotifyOn[];
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

        const outputs: ActionOutputs = {
            jobs: JSON.stringify(jobs, null, 4),
            previous_conclusion: previousConclusion,
            workflow_status: result.workflowStatus,
            message_sent: result.messageSent,
        };

        return Promise.resolve(outputs);
    }
    catch (error) {
        if (error instanceof Error) return Promise.reject(error.message);
        return Promise.reject();
    }
};

export default main;
