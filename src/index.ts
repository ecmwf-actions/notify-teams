import * as core from '@actions/core';
import main from './main';

/**
 * A Github action that notifies about workflow status via Microsoft Teams.
 */
// eslint-disable-next-line jest/require-hook
main()
    .then((outputs: ActionOutputs) => {
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
    }).catch((failureMessage: string) => {
        core.setFailed(failureMessage);
    });
