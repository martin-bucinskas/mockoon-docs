import * as core from '@actions/core'
import github from '@actions/github'
import { Octokit } from '@octokit/rest'
import * as mockoon from '@mockoon/commons'

const run = async (): Promise<void> => {
  try {
    const context = github.context
    if (context.payload.pull_request == null) {
      console.warn('Action should be run against pull requests')
      // core.setFailed('No pull request found');
      return
    }

    const mockoonFilePath = core.getInput('mockoon-json-file')
    console.log(`Received mockoon file: ${mockoonFilePath}`)

    const githubToken = core.getInput('github-token')
    const octokit = new Octokit({ auth: githubToken })

    const fileResponse = await octokit.rest.repos.getContent({
      owner: context.issue.owner,
      repo: context.issue.repo,
      path: mockoonFilePath,
      ref: context.payload.pull_request.head.sha
    })

    let content = ''
    if ('content' in fileResponse.data) {
      content = Buffer.from(fileResponse.data.content, 'base64').toString()
    } else {
      core.setFailed('Expected file content, but received something else')
      return
    }

    const mockoonJson = JSON.parse(content)

    const prComment = parseMockoon(mockoonJson)

    const pullRequestNumber = context.payload.pull_request.number

    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pullRequestNumber,
      body: prComment
    })

    core.setOutput('mockoon-docs-md', prComment)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

const parseMockoon = (mockoonJson: mockoon.Environment): string => {
  const uuid = mockoonJson.uuid
  const lastMigration = mockoonJson.lastMigration
  const name = mockoonJson.name
  const hostname = mockoonJson.hostname
  const port = mockoonJson.port
  const basePath = mockoonJson.endpointPrefix

  let md = ''
  md = appendNewLine(md, `## ${name}`)
  md = appendNewLine(md, `UUID: ${uuid}`)
  md = appendNewLine(md, `Last Migration: ${lastMigration}`)
  md = appendNewLine(md, `Hostname: ${hostname}`)
  md = appendNewLine(md, `Port: ${port}`)
  md = appendNewLine(md, `Base Path: ${basePath}`)
  md = appendNewLine(md, '')

  md = appendNewLine(md, '### Endpoints')
  for (const route of mockoonJson.routes) {
    console.log(route.uuid)
    const endpoint = route.endpoint
    const type = route.type
    const method = route.method.toUpperCase()
    md = appendNewLine(
      md,
      `- ${type === 'crud' ? 'CRUD' : method} ${hostname}:${port}/${endpoint}`
    )
    md = appendNewLine(md, '')

    for (const response of route.responses) {
      const responseUuid = response.uuid
      const responseBody = response.body
      // const responseStatusCode = response.statusCode
      const responseLabel = response.label

      md = appendNewLine(
        md,
        `### ${responseLabel ? `${responseLabel}  - ` : ''}${responseUuid}`
      )

      let updatedPath = endpoint
      const query: string[] = []
      const headers: string[] = []

      for (const rule of response.rules) {
        switch (rule.target) {
          case 'params':
            updatedPath = endpoint.replaceAll(`:${rule.modifier}`, rule.value)
            break
          case 'header':
            headers.push(`${rule.modifier}: ${rule.value}`)
            break
          case 'query':
            query.push(`${rule.modifier}=${rule.value}`)
            break

          default:
            console.error(`rule target not covered: ${rule.target}`)
        }
      }

      md = appendNewLine(md, '```bash')
      md = appendNewLine(
        md,
        `${
          method === 'crud' ? 'CRUD' : method
        } ${hostname}:${port}/${updatedPath}${
          query.length > 0 ? `?${query.join('&')}` : ''
        }`
      )
      if (headers.length > 0) {
        md = appendNewLine(md, `${headers.join('\n')}`)
      }
      md = appendNewLine(md, '```\n')

      md = appendNewLine(md, '#### Response')
      md = appendNewLine(md, '```bash')
      if (responseBody !== '') {
        md = appendNewLine(md, responseBody)
      }
      md = appendNewLine(md, '```\n')
    }
  }

  return md
}

const appendNewLine = (md: string, str: string | undefined): string => {
  return `${md}${str}\n`
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
