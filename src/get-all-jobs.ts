/**
 * Returns a complete list of current jobs and their states.
 *
 * @param {string} job The ID of the current job.
 * @param {CurrentJobContext} jobContext The current job context.
 * @param {NeedsContext} needsContext The list of dependent job contexts.
 * @returns {Array<Object>} List of all jobs with `name` and `value` keys.
 */
const getAllJobs = (job: string, jobContext: CurrentJobContext, needsContext: NeedsContext | null): JobStatus[] => {
    const jobs = [];

    Object.keys(needsContext || {}).forEach((jobName) => {
        jobs.push({
            name: jobName,
            value: (needsContext as NeedsContext)[jobName].result,
        });
    });

    jobs.push({
        name: job,
        value: jobContext.status,
    });

    return jobs as JobStatus[];
};

export default getAllJobs;
