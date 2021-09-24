/**
 * Returns a complete list of current jobs and their states.
 *
 * @param {String} job The ID of the current job.
 * @param {String} jobContext The current job context
 * @param {String} needsContext The list of dependent job contexts.
 * @returns {Array<Object>} List of all jobs with `name` and `value` keys.
 */
module.exports = (job, jobContext, needsContext) => {
    const jobs = [];

    Object.keys(needsContext || {}).forEach((jobName) => {
        jobs.push({
            name: jobName,
            value: needsContext[jobName].result,
        });
    });

    jobs.push({
        name: job,
        value: jobContext.status,
    });

    return jobs;
};
