# notify-teams

[![Changelog](https://img.shields.io/github/package-json/v/ecmwf-actions/notify-teams/develop)](CHANGELOG.md)
[![Build Status](https://img.shields.io/github/workflow/status/ecmwf-actions/notify-teams/ci/develop)](https://github.com/ecmwf-actions/notify-teams/actions/workflows/ci.yml?query=branch:develop)
[![Code Coverage](https://img.shields.io/codecov/c/gh/ecmwf-actions/notify-teams/branch/develop)](https://codecov.io/gh/ecmwf-actions/notify-teams/branch/develop)
[![Licence](https://img.shields.io/github/license/ecmwf-actions/notify-teams)](https://github.com/ecmwf-actions/notify-teams/blob/develop/LICENSE)

A Github action that posts messages via Microsoft Teams when a workflow job fails.

## Features

* Integration with Microsoft Teams via Incoming Webhook
* Supports workflows with both single and multiple jobs
* Notification on configurable workflow states:
  * `failure`: current workflow run has failed or was cancelled
  * `fixed`: current workflow run has succeeded
  * `success`: first successful workflow run after a failure or cancellation
* Colourful message card design for notifications

## Supported Operating Systems

* Linux
* macOS

## Usage

### Single Job

```yaml
steps:
- name: Notify Teams
  if: failure()
  uses: ecmwf-actions/notify-teams@v1
  with:
    incoming_webhook: ${{ secrets.MS_TEAMS_INCOMING_WEBHOOK }}
    notify_on: |
      failure
```

### Multiple Jobs

```yaml
jobs:
  qa:
    ...

  ci:
    ...

  deploy:
    ...

  notify:
    name: notify
    runs-on: ubuntu-20.04
    needs:
    - ci
    - qa
    - deploy
    if: always() && (github.ref == 'refs/heads/master' || github.ref == 'refs/heads/develop')
    steps:
    - name: Notify Teams
      uses: ecmwf-actions/notify-teams@v1
      with:
        incoming_webhook: ${{ secrets.MS_TEAMS_INCOMING_WEBHOOK }}
        needs_context: ${{ toJSON(needs) }}
```

## Inputs

### `incoming_webhook`

**Required** Public URL of the Microsoft Teams incoming webhook. To get the value, make sure that channel in Teams has the appropriate connector set up. Recommended way to define this value is via a secret, e.g. `${{ secrets.MS_TEAMS_INCOMING_WEBHOOK }}`.  

### `notify_on`

**Required** The list of states to notify on. Allowed values are `failure`, `fixed` and `success`.  
**Multiline Support:** yes  
**Default:**

```text
failure
fixed
```

### `job`

**Required** The ID of the current job.  
**Default:** `${{ github.job }}`

### `job_context`

**Required** The current job context, must be encoded as JSON. 
**Default:** `${{ toJSON(job) }}`

### `needs_context`

The list of dependent job contexts, must be encoded as JSON. To pass the current `needs` context, use `${{ toJSON(needs) }}`.  

### `repository`

**Required** The currently checked out source repository name. Repository names should follow the standard Github `owner/name` format.  
**Default:** `${{ github.repository }}`

### `branch`

**Required** The repository branch name to check the CI workflow status for.  
**Default:** `${{ github.ref }}`

### `sha`

**Required** The current repository commit SHA.  
**Default:** `${{ github.sha }}`

### `workflow`

**Required**  The name of the current workflow.  
**Default:** `${{ github.workflow }}`

### `workflow_id`

**Required** The ID or filename of the CI workflow to check.  
**Default:** `ci.yml`

### `run_id`

**Required** The ID of the current workflow run.  
**Default:** `${{ github.run_id }}`

### `github_token`

**Required** Github access token, with `actions:read` scope.  
**Default:** `${{ github.token }}`

## Outputs

### `jobs`

List of considered jobs and their stats.  
**Example:** `[{"name": "ci", "value": "success"}]`

### `workflow_status`

Status of the previous workflow run.  
**Example:** `success`

### `previous_conclusion`

Conclusion of the previous workflow run.  
**Example:** `unknown`

### `message_sent`

Whether or not the message has been sent.  
**Example:** `true`

## Development

### Install Dependencies

```
npm install
```

A post-install script will deploy Git pre-commit hook, that conveniently runs a lint check, builds the action and stages the changes. To skip the hook, simply add `--no-verify` switch to the Git commit command.

### Build Action

This action transpiles its code into a self-contained script, pulling in all of its dependencies. This will happen automatically by the installed pre-commit hook, but in case you do not have it install just make sure to run the build command manually after _any_ changes and stage `dist/` directory.

```
npm run build
```

### Lint Code

```
npm run lint
```

### Run Tests

```
npm test
```

## Licence

This software is licensed under the terms of the Apache License Version 2.0 which can be obtained at http://www.apache.org/licenses/LICENSE-2.0.

In applying this licence, ECMWF does not waive the privileges and immunities granted to it by virtue of its status as an intergovernmental organisation nor does it submit to any jurisdiction.
