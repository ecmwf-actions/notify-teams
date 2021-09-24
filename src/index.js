const core = require('@actions/core');
const main = require('./main');

/**
 * A Github action that notifies about workflow status via Microsoft Teams.
 */
main.call()
    .then((outputs) => {
        core.startGroup('Set Outputs');

        core.info(`==> jobs: ${outputs.jobs}`);
        core.info(`==> workflow_status: ${outputs.workflow_status}`);
        core.info(`==> previous_conclusion: ${outputs.previous_conclusion}`);
        core.info(`==> message_sent: ${outputs.message_sent}`);

        core.setOutput('jobs', outputs.jobs);
        core.setOutput('workflow_status', outputs.workflow_status);
        core.setOutput('previous_conclusion', outputs.previous_conclusion);
        core.setOutput('message_sent', outputs.message_sent);

        core.endGroup();
    }).catch((failureMessage) => {
        core.setFailed(failureMessage);
    });
