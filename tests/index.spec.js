const core = require('@actions/core');
const main = require('../src/main');

jest.mock('@actions/core');
jest.mock('../src/main');

const outputs = {
    jobs: JSON.stringify([
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
    ]),
    workflow_status: 'failure',
    previous_conclusion: 'success',
    message_sent: 'true',
};

describe('entry', () => {
    it('sets outputs and logs values', async () => {
        expect.assertions(8);

        main.mockImplementation(() => Promise.resolve(outputs));

        await jest.isolateModules(() => require('../src/index'));

        Object.keys(outputs).forEach((outputName) => {
            const outputValue = outputs[outputName];

            expect(core.setOutput).toHaveBeenCalledWith(outputName, outputValue);
            expect(core.info).toHaveBeenCalledWith(`==> ${outputName}: ${outputValue}`);
        });

        main.mockReset();
    });

    it('sets failure on errors', async () => {
        expect.assertions(1);

        const errorMessage = 'Oops!';

        main.mockImplementation(() => Promise.reject(errorMessage));

        // For some reason, checking toHaveBeenCalledWith() on this mock function does not work, possibly because of
        //   some race condition at play. Instead, we mock its implementation and check if it's called with correct
        //   parameter.
        core.setFailed.mockImplementation((failureMessage) => {
            expect(failureMessage).toBe(errorMessage);
        });

        await jest.isolateModules(() => require('../src/index'));

        main.mockReset();
    });
});
