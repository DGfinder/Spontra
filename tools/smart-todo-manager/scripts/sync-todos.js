#!/usr/bin/env node
// Smart Todo Manager - Todo Sync Script
// This script syncs todos before pushing

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
  
  // Sync FUTURE_TODO.md
  await todoManager.syncToFutureTodoMd()
  
  // Generate progress report
  const progress = await todoManager.generateProgressReport()
  
  console.log(`📊 Todo Progress: ${progress.completedTodos}/${progress.totalTodos} (${(progress.completionRate * 100).toFixed(1)}%) completed`)
  
  if (progress.blockedTodos.length > 0) {
    console.log(`⛔ ${progress.blockedTodos.length} blocked todos need attention`)
  }
}

main().catch(console.error)
