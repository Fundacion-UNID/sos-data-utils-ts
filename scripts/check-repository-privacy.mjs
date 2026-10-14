import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { assertRepositoryPrivacy } from '../dist/repository-privacy.js'

const denylistPath = '.repository-privacy.local'
const forbiddenExactValues = existsSync(denylistPath)
  ? readFileSync(denylistPath, 'utf8').split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
  : []

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)

const strictExtensions = new Set(['.md', '.yaml', '.yml', '.example'])
const strictPath = (path) => path.includes('/tests/')
  || path.startsWith('tests/')
  || path.includes('/test/')
  || path.startsWith('test/')
  || path.includes('example')
  || path.includes('/deploy/')
  || path.startsWith('deploy/')
  || strictExtensions.has(extname(path))

const artifacts = trackedFiles
  .filter((path) => existsSync(path))
  .filter((path) => !path.startsWith('src/repository-privacy.'))
  .map((path) => ({
    path,
    text: readFileSync(path, 'utf8'),
    strictExamples: strictPath(path),
    forbiddenExactValues,
    allowedDomains: [
      'build.fhir.org',
      'github.com',
      'hl7.org',
      'loinc.org',
      'purl.obolibrary.org',
      'snomed.info',
      'terminology.hl7.org',
      'www.hl7.org',
      'www.w3.org',
      'www.whocc.no',
    ],
  }))

assertRepositoryPrivacy(artifacts)
console.log(`repository privacy check: ${artifacts.length} tracked files passed`)
