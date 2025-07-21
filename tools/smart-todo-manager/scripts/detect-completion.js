#!/usr/bin/env node
// Smart Todo Manager - Completion Detection Script
// This script is called by git hooks to detect completed todos

const { SmartTodoManager } = require('../dist/SmartTodoManager.js')
const path = require('path')

async function main() {
  const projectRoot = process.cwd()
  const config = {
    projectRoot,
    futureTodoPath: path.join(projectRoot, 'FUTURE_TODO.md'),
    todoDataPath: path.join(projectRoot, '.todo-data', 'todos.json'),
    gitEnabled: true,
    autoDetectionEnabled: true,
    syncInterval: 60,
    backupEnabled: true,
    maxArchiveSize: 1000
  }
  
  const todoManager = new SmartTodoManager(config)
  await todoManager.initialize()
  
  // Run completion detection
  const detectionResults = await todoManager.runCompletionDetection()
  
  if (detectionResults.length > 0) {
    console.log(`🎯 Detected ${detectionResults.length} potential todo completions:`)
    for (const result of detectionResults) {
      console.log(`  - ${result.evidence} (confidence: ${(result.confidence * 100).toFixed(0)}%)`)
    }
  }
}

main().catch(console.error)
