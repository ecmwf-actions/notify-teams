type CurrentJobContext = {
    status: string,
    container: Record<string, string>,
};

type JobContext = {
    result: string,
    outputs: Record<string, string>,
};

type NeedsContext = {
    [key: string]: JobContext,
};

type JobStatus = {
    name: string,
    value: string,
};
