type ActionInputs = {
    job: string,
    job_context: string,
    needs_context: string,
    repository: string,
    branch: string,
    sha: string,
    workflow: string,
    workflow_id: string,
    run_id: number,
    notify_on: string[],
    github_token: string,
    incoming_webhook: string,
    [key: string]: string[] | boolean | number | string | null,
};

type ActionOutputs = {
    jobs: string,
    workflow_status: string,
    previous_conclusion: string,
    message_sent: boolean | string,
};
