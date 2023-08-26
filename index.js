const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');

const run = async () => {
    try {
        const context = github.context;
        if (context.payload.pull_request == null) {
            console.warn('Action should be run against pull requests');
            // core.setFailed('No pull request found');
            return;
        }

        const mockoonFilePath = core.getInput('mockoon-json-file');
        console.log(`Received mockoon file: ${mockoonFilePath}`);

        const githubToken = core.getInput('github-token');
        const octokit = new Octokit({ auth: githubToken });

        const { data: fileContent } = await octokit.rest.repos.getContent({
            owner: context.issue.owner,
            repo: context.issue.repo,
            path: mockoonFilePath,
            ref: context.payload.pull_request.head.sha
        });
        const content = Buffer.from(fileContent.content, 'base64').toString();
        const mockoonJson = JSON.parse(content);

        const prComment = parseMockoon(mockoonJson);

        const pullRequestNumber = context.payload.pull_request.number;

        await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pullRequestNumber,
            body: prComment
        });

        core.setOutput('mockoon-docs-md', prComment);

        // const payload = JSON.stringify(context.payload, undefined, 2);
    } catch (error) {
        core.setFailed(error.message);
    }
};

const parseMockoon = (mockoonJson) => {
    const uuid = mockoonJson['uuid'];
    const lastMigration = mockoonJson['lastMigration'];
    const name = mockoonJson['name'];
    const hostname = mockoonJson['hostname'];
    const port = mockoonJson['port'];
    const basePath = mockoonJson['endpointPrefix'];

    let md = "";
    md = appendNewLine(md, `## ${name}`);
    md = appendNewLine(md, `UUID: ${uuid}`);
    md = appendNewLine(md, `Last Migration: ${lastMigration}`);
    md = appendNewLine(md, `Hostname: ${hostname}`);
    md = appendNewLine(md, `Port: ${port}`);
    md = appendNewLine(md, `Base Path: ${basePath}`);
    md = appendNewLine(md, '');

    md = appendNewLine(md, '### Endpoints');
    mockoonJson['routes'].forEach(route => {
        console.log(route['uuid']);
        const endpoint = route['endpoint'];
        const type = route['type'];
        const method = route['method'].toUpperCase();
        md = appendNewLine(md, `- ${type === 'crud' ? 'CRUD' : method} ${hostname}:${port}/${endpoint}`);
        md = appendNewLine(md, '')

        route['responses'].forEach(response => {
            const responseUuid = response['uuid'];
            const responseBody = response['body'];
            // const responseStatusCode = response['statusCode'];
            const responseLabel = response['label'];

            md = appendNewLine(md, `### ${responseLabel ? responseLabel + ' - ' : ''}${responseUuid}`);

            let updatedPath = endpoint;
            let query = [];
            let headers = [];

            response['rules'].forEach(rule => {
                switch (rule.target) {
                    case "params":
                        updatedPath = endpoint.replaceAll(`:${rule['modifier']}`, rule['value']);
                        break;
                    case "header":
                        headers.push(`${rule['modifier']}: ${rule['value']}`);
                        break;
                    case "query":
                        query.push(`${rule['modifier']}=${rule['value']}`);
                        break;

                    default:
                        console.error(`rule target not covered: ${rule.target}`);
                }
            });

            md = appendNewLine(md, '```bash');
            md = appendNewLine(md, `${method === 'crud' ? 'CRUD' : method} ${hostname}:${port}/${updatedPath}${query.length > 0 ? '?' + query.join('&') : ''}`);
            if (headers.length > 0) {
                md = appendNewLine(md, `${headers.join('\n')}`);
            }
            md = appendNewLine(md, '```\n');

            md = appendNewLine(md, '#### Response');
            md = appendNewLine(md, '```bash');
            if (responseBody !== '') {
                md = appendNewLine(md, responseBody);
            }
            md = appendNewLine(md, '```\n');
        });
    });

    return md;
};

const appendNewLine = (md, str) => {
    return md + str + '\n';
};

run()
    .then(() => console.log('parsed mockoon successfully'))
    .catch(err => console.error('failed to create mockoon docs', err));
