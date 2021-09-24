const getAllJobs = require('../src/get-all-jobs');

const job = 'notify';
const jobContext = {
    status: 'success',
    container: {
        network: 'github_network_20b575dd5aef46dfb2259c89c0c1664d',
        id: 'ca715f77d221a6c1b187e8594462fb52a21cfd0a7cdf9cb25856de1d16e8a47d',
    },
};
const needsContext = {
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
    },
];

describe('getAllJobs', () => {
    it('returns a complete list of current jobs and their states', () => {
        expect.assertions(1);

        expect(getAllJobs(job, jobContext, needsContext)).toStrictEqual(jobs);
    });

    it('returns jobs even in case needs context is undefined', () => {
        expect.assertions(1);

        expect(getAllJobs(job, jobContext, null)).toStrictEqual([
            {
                ...jobs[3],
            },
        ]);
    });
});
