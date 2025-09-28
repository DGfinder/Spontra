#!/usr/bin/env tsx

import { readdir, readFile, stat } from 'fs/promises'
import { join, relative, extname } from 'path'
import { cwd } from 'process'

interface ImportIssue {
  file: string
  line: number
  import: string
  type: 'client-in-server' | 'hook-in-server' | 'browser-api-in-server'
  severity: 'error' | 'warning'
  message: string
}

interface AuditResult {
  issues: ImportIssue[]
  serverComponents: string[]
  clientComponents: string[]
  summary: {
    totalFiles: number
    serverFiles: number
    clientFiles: number
    errors: number
    warnings: number
  }
}

const CLIENT_ONLY_PATTERNS = [
  // React hooks
  /\b(useState|useEffect|useCallback|useMemo|useContext|useReducer|useRef|useImperativeHandle|useLayoutEffect|useDebugValue|useDeferredValue|useId|useInsertionEffect|useSyncExternalStore|useTransition)\b/,
  
  // Browser APIs
  /\b(window|document|navigator|localStorage|sessionStorage|location|history)\b/,
  
  // Event handlers
  /\b(onClick|onSubmit|onChange|onFocus|onBlur|onMouseOver|onMouseOut|addEventListener)\b/,
  
  // Client-side libraries (common ones)
  /from\s+['"]react-dom\/client['"]/, // ReactDOM.render
  /from\s+['"]@tanstack\/react-query['"]/, // React Query
  /from\s+['"](.*analytics|.*tracking|.*pixel)['"]/, // Analytics
]

const SERVER_ONLY_PATTERNS = [
  /'use server'/,
  /from\s+['"]fs['"]/, // Node.js filesystem
  /from\s+['"]path['"]/, // Node.js path
  /from\s+['"]crypto['"]/, // Node.js crypto
  /from\s+['"](.*\/api\/|.*\/lib\/.*Server)['"]/, // Likely server-side imports
]

const HOOK_PATTERNS = [
  /\buse[A-Z]\w*/g, // Any function that starts with "use" and capital letter
]

async function getAllFiles(dir: string, extensions = ['.ts', '.tsx', '.js', '.jsx']): Promise<string[]> {
  const files: string[] = []
  
  async function walk(currentDir: string) {
    const entries = await readdir(currentDir)
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry)
      const stats = await stat(fullPath)
      
      if (stats.isDirectory()) {
        // Skip node_modules, .next, and other build directories
        if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(entry)) {
          await walk(fullPath)
        }
      } else if (extensions.includes(extname(entry))) {
        files.push(fullPath)
      }
    }
  }
  
  await walk(dir)
  return files
}

function detectComponentType(content: string): 'server' | 'client' | 'unknown' {
  // Check for explicit directives
  if (content.includes("'use client'") || content.includes('"use client"')) {
    return 'client'
  }
  
  if (content.includes("'use server'") || content.includes('"use server"')) {
    return 'server'
  }
  
  // Heuristic detection
  let serverScore = 0
  let clientScore = 0
  
  // Server indicators
  SERVER_ONLY_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) serverScore += 2
  })
  
  // Client indicators  
  CLIENT_ONLY_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) clientScore += 1
  })
  
  // React hooks are strong client indicators
  const hookMatches = content.match(/\buse[A-Z]\w*/g) || []
  clientScore += hookMatches.length
  
  if (serverScore > clientScore) return 'server'
  if (clientScore > 0) return 'client'
  return 'unknown'
}

function analyzeFile(filePath: string, content: string): ImportIssue[] {
  const issues: ImportIssue[] = []
  const lines = content.split('\n')
  const componentType = detectComponentType(content)
  
  // Only analyze server components and unknown files in app directory
  if (componentType !== 'server' && !filePath.includes('/app/')) {
    return issues
  }
  
  lines.forEach((line, index) => {
    const lineNum = index + 1
    
    // Check for client-only imports in server components
    if (componentType === 'server' || filePath.includes('/app/')) {
      // React hooks usage
      const hookMatches = line.match(HOOK_PATTERNS)
      if (hookMatches) {
        hookMatches.forEach(hook => {
          issues.push({
            file: filePath,
            line: lineNum,
            import: hook,
            type: 'hook-in-server',
            severity: 'error',
            message: `React hook "${hook}" cannot be used in server components`
          })
        })
      }
      
      // Browser API usage
      const browserAPIs = ['window', 'document', 'navigator', 'localStorage', 'sessionStorage']
      browserAPIs.forEach(api => {
        if (new RegExp(`\\b${api}\\b`).test(line) && !line.includes('typeof') && !line.includes('undefined')) {
          issues.push({
            file: filePath,
            line: lineNum,
            import: api,
            type: 'browser-api-in-server',
            severity: 'error',
            message: `Browser API "${api}" is not available in server components`
          })
        }
      })
      
      // Client component imports
      if (line.includes('import') && line.includes('from')) {
        const importMatch = line.match(/from\s+['"]([^'"]+)['"]/)
        if (importMatch) {
          const importPath = importMatch[1]
          
          // Check if importing from known client-only libraries
          const clientOnlyLibs = [
            'react-dom/client',
            '@tanstack/react-query',
            'zustand',
            'jotai',
            'recoil',
            'swr'
          ]
          
          if (clientOnlyLibs.some(lib => importPath.includes(lib))) {
            issues.push({
              file: filePath,
              line: lineNum,
              import: importPath,
              type: 'client-in-server',
              severity: 'warning',
              message: `Importing from client-only library "${importPath}" in server component`
            })
          }
        }
      }
      
      // Event handlers
      const eventHandlers = ['onClick', 'onSubmit', 'onChange', 'onFocus', 'onBlur']
      eventHandlers.forEach(handler => {
        if (line.includes(handler)) {
          issues.push({
            file: filePath,
            line: lineNum,
            import: handler,
            type: 'client-in-server',
            severity: 'error',
            message: `Event handler "${handler}" cannot be used in server components`
          })
        }
      })
    }
  })
  
  return issues
}

async function auditRSCBoundaries(srcDir: string = 'src'): Promise<AuditResult> {
  const startTime = Date.now()
  console.log('🔍 Auditing React Server Components boundaries...\n')
  
  const files = await getAllFiles(srcDir)
  const issues: ImportIssue[] = []
  const serverComponents: string[] = []
  const clientComponents: string[] = []
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8')
      const componentType = detectComponentType(content)
      
      if (componentType === 'server') {
        serverComponents.push(file)
      } else if (componentType === 'client') {
        clientComponents.push(file)
      }
      
      const fileIssues = analyzeFile(file, content)
      issues.push(...fileIssues)
      
    } catch (error) {
      console.warn(`⚠️ Could not read file ${file}:`, error)
    }
  }
  
  const errors = issues.filter(i => i.severity === 'error').length
  const warnings = issues.filter(i => i.severity === 'warning').length
  
  const result: AuditResult = {
    issues,
    serverComponents,
    clientComponents,
    summary: {
      totalFiles: files.length,
      serverFiles: serverComponents.length,
      clientFiles: clientComponents.length,
      errors,
      warnings
    }
  }
  
  // Print results
  console.log(`📊 Audit Results (${Date.now() - startTime}ms)`)
  console.log('=' .repeat(50))
  console.log(`Total files analyzed: ${result.summary.totalFiles}`)
  console.log(`Server components: ${result.summary.serverFiles}`)
  console.log(`Client components: ${result.summary.clientFiles}`)
  console.log(`Issues found: ${errors} errors, ${warnings} warnings\n`)
  
  if (issues.length === 0) {
    console.log('✅ No RSC boundary violations found!')
  } else {
    console.log('🚨 Issues found:\n')
    
    // Group issues by file
    const issuesByFile = issues.reduce((acc, issue) => {
      const relativePath = relative(cwd(), issue.file)
      if (!acc[relativePath]) acc[relativePath] = []
      acc[relativePath].push(issue)
      return acc
    }, {} as Record<string, ImportIssue[]>)
    
    Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
      console.log(`📁 ${file}`)
      fileIssues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : '⚠️'
        console.log(`  ${icon} Line ${issue.line}: ${issue.message}`)
        console.log(`      → "${issue.import}"`)
      })
      console.log()
    })
  }
  
  // Recommendations
  if (errors > 0) {
    console.log('🔧 Recommendations:')
    console.log('- Move client-side logic to "use client" components')
    console.log('- Use dynamic imports with { ssr: false } for browser-only code')
    console.log('- Wrap browser APIs in typeof checks: typeof window !== "undefined"')
    console.log('- Consider using Server Actions for form submissions instead of event handlers')
    console.log()
  }
  
  return result
}

// CLI execution
if (require.main === module) {
  const srcDir = process.argv[2] || 'src'
  
  auditRSCBoundaries(srcDir)
    .then(result => {
      if (result.summary.errors > 0) {
        console.error(`\n❌ Audit failed with ${result.summary.errors} errors`)
        process.exit(1)
      } else if (result.summary.warnings > 0) {
        console.warn(`\n⚠️ Audit completed with ${result.summary.warnings} warnings`)
        process.exit(0)
      } else {
        console.log('\n✅ Audit passed with no issues')
        process.exit(0)
      }
    })
    .catch(error => {
      console.error('💥 Audit failed:', error)
      process.exit(1)
    })
}

export { auditRSCBoundaries, type AuditResult, type ImportIssue }