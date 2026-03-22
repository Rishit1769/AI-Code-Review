import axios from 'axios'
import crypto from 'crypto'

const GITHUB_API = 'https://api.github.com'

function headers(token?: string) {
  return {
    Authorization: `token ${token || process.env.GITHUB_TOKEN}`,
    Accept:        'application/vnd.github.v3+json',
    'User-Agent':  'CodeReview-AI-Bot',
  }
}

export async function getPRDiff(
  owner: string, repo: string, prNumber: number, token?: string
): Promise<string> {
  const { data } = await axios.get(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`,
    { headers: { ...headers(token), Accept: 'application/vnd.github.v3.diff' }, responseType: 'text' }
  )
  return data
}

export async function postPRComment(
  owner: string, repo: string, prNumber: number, body: string, token?: string
): Promise<void> {
  await axios.post(
    `${GITHUB_API}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    { body },
    { headers: headers(token) }
  )
}

export async function listUserRepos(token: string) {
  const { data } = await axios.get(`${GITHUB_API}/user/repos`, {
    headers: headers(token),
    params:  { per_page: 100, sort: 'updated', type: 'owner' },
  })
  return data.map((r: any) => ({
    id: r.id, name: r.name, full_name: r.full_name, private: r.private,
  }))
}

export function verifyGitHubWebhook(rawBody: Buffer, signature: string): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch { return false }
}