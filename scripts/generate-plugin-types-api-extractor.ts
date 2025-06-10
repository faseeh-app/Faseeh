#!/usr/bin/env tsx
/**
 * Generate Faseeh Plugin API Types using Microsoft API Extractor
 *
 * This script uses API Extractor to generate the faseeh.d.ts file
 * from our centralized API entry point.
 */

import { Extractor, ExtractorConfig } from '@microsoft/api-extractor'
import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function buildDeclarationFiles(): Promise<void> {
  console.log('📦 Building declaration files...')

  try {
    // Clean up any existing temp directory
    if (fs.existsSync('temp')) {
      fs.rmSync('temp', { recursive: true, force: true })
    }

    // Build declaration files using TypeScript compiler
    await execAsync('npx tsc -p tsconfig.plugin-api.json')
    console.log('✅ Declaration files built successfully')
  } catch (error) {
    console.error('❌ Failed to build declaration files:', error)
    throw error
  }
}

async function main() {
  try {
    console.log('🚀 Starting API Extractor for Faseeh Plugin API...')

    // First, build the declaration files
    await buildDeclarationFiles()

    // Load the API Extractor configuration
    const configPath = path.resolve('./api-extractor.json')
    const extractorConfig = ExtractorConfig.loadFileAndPrepare(configPath)

    // Invoke API Extractor
    const extractorResult = Extractor.invoke(extractorConfig, {
      localBuild: true,
      showVerboseMessages: true
    })

    if (extractorResult.succeeded) {
      console.log('✅ API Extractor completed successfully')

      // Post-process the generated file to add our header and clean up
      await postProcessGeneratedFile()

      // Generate the runtime barrel file
      await generateRuntimeBarrel()

      // Clean up temp directory
      if (fs.existsSync('temp')) {
        fs.rmSync('temp', { recursive: true, force: true })
        console.log('🧹 Cleaned up temporary files')
      }

      console.log('🎉 Plugin API generation complete!')
    } else {
      console.error('❌ API Extractor completed with errors')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ API Extractor failed:', error)
    process.exit(1)
  }
}

async function postProcessGeneratedFile(): Promise<void> {
  const filePath = 'packages/faseeh/faseeh.d.ts'

  if (!fs.existsSync(filePath)) {
    console.error('❌ Generated file not found:', filePath)
    return
  }

  let content = fs.readFileSync(filePath, 'utf-8')

  // Add our custom header
  const header = `/**
 * Faseeh Plugin API
 * 
 * Official TypeScript definitions for developing Faseeh plugins.
 * Generated automatically using Microsoft API Extractor.
 * 
 * @version 1.0.4
 * @author Faseeh Team
 * @license MIT
 * @generated ${new Date().toISOString()}
 */

`

  // Remove any existing API Extractor comments and add our header
  content = content.replace(/^\/\*[\s\S]*?\*\/\s*\n?/, '')
  content = header + content

  // Clean up any references that need fixing
  content = content.replace(/BasePlugin/g, 'Plugin')
  content = content.replace(/IStorageAPI/g, 'StorageAPI')

  fs.writeFileSync(filePath, content, 'utf-8')
  console.log('✅ Post-processed generated file')
}

async function generateRuntimeBarrel(): Promise<void> {
  const content = `/**
 * Faseeh Plugin Runtime Exports
 *
 * This barrel file exports all the runtime code that plugins need access to.
 * Generated automatically from source code.
 * 
 * @generated ${new Date().toISOString()}
 */

// Core Plugin Classes
export { BasePlugin } from '@renderer/core/services/plugins/base-plugin'

// Event System
export { workspaceEvents, storageEvents, pluginEvents } from '@shared/constants/event-emitters'
export { EventEmitterWrapper } from '@shared/utilities/event-system/event-emitter-wrapper'

// Storage Service
export { storage } from '@renderer/core/services/storage/storage-service'

// Type Re-exports (for runtime type checking if needed)
export type {
  PluginManifest,
  PluginInfo,
  FaseehApp,
  BasePlugin as IBasePlugin
} from '@shared/faseeh'

export type {
  EventType,
  Handler,
  WildcardHandler,
  StorageEvents,
  WorkspaceEvents,
  PluginEvents
} from '@shared/faseeh'

export type { IStorageAPI } from '@shared/faseeh'

// Content Document Types
export type {
  BoundingBox,
  BaseBlock,
  TextBlock,
  ImageBlock,
  VideoBlock,
  AudioBlock,
  ImageAnnotation,
  AnnotatedImageBlock,
  ContainerBlock,
  ContentBlock,
  ContentDocument
} from '@shared/faseeh'

// Database Entity Types
export type {
  LibraryItem,
  PluginData,
  AppSettings,
  ContentGroup,
  Collection,
  CollectionMember,
  VocabularyRegistry,
  VocabularySource,
  EmbeddedAsset,
  SupplementaryFile,
  NewLibraryItem,
  NewPluginData,
  NewAppSettings,
  NewContentGroup,
  NewCollection,
  NewCollectionMember,
  NewVocabularyRegistry,
  NewVocabularySource,
  NewEmbeddedAsset,
  NewSupplementaryFile,
  LibraryItemUpdate,
  PluginDataUpdate,
  AppSettingsUpdate,
  ContentGroupUpdate,
  CollectionUpdate,
  CollectionMemberUpdate,
  VocabularyRegistryUpdate,
  VocabularySourceUpdate,
  EmbeddedAssetUpdate,
  SupplementaryFileUpdate
} from '@main/db/types'

// Import required dependencies for createFaseehApp
import { storage } from '@renderer/core/services/storage/storage-service'
import { workspaceEvents, storageEvents, pluginEvents } from '@shared/constants/event-emitters'
import type { FaseehApp } from '@shared/faseeh'

/**
 * Creates the FaseehApp object that plugins receive
 */
export function createFaseehApp(): FaseehApp {
  return {
    appInfo: {
      version: '1.0.0', // TODO: Get from package.json or build config
      platform: (typeof window !== 'undefined' ? 'win' : 'linux') as 'win' | 'mac' | 'linux'
    },
    storage,
    plugins: {
      getPlugin: (_id: string) => null // TODO: Implement plugin registry lookup
    },
    workspaceEvents,
    storageEvents,
    pluginEvents
  }
}
`

  const outputPath = 'src/renderer/src/runtime/plugin-runtime.ts'

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, content, 'utf-8')
  console.log(`✅ Generated runtime barrel: ${outputPath}`)
}

// Run if called directly
if (require.main === module) {
  main()
}

export { main }
