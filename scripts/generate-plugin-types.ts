#!/usr/bin/env tsx
/**
 * Generate Faseeh Plugin API Types
 *
 * This script extracts types from the source code and generates the faseeh.d.ts file
 * for plugin developers. It ensures the API definitions stay in sync with the actual
 * implementation.
 */

import {
  Project,
  SyntaxKind,
  InterfaceDeclaration,
  ClassDeclaration,
  TypeAliasDeclaration
} from 'ts-morph'
import * as fs from 'fs'
import * as path from 'path'

const OUTPUT_FILE = 'packages/faseeh/faseeh.d.ts'

class TypeExtractor {
  private project: Project
  private extractedInterfaces: Map<string, string> = new Map()
  private extractedTypes: Map<string, string> = new Map()
  private extractedClasses: Map<string, string> = new Map()

  constructor() {
    this.project = new Project({
      tsConfigFilePath: 'tsconfig.json',
      skipAddingFilesFromTsConfig: true
    })

    // Add source files we want to extract from
    this.project.addSourceFilesAtPaths([
      'src/shared/types/**/*.d.ts',
      'src/main/db/types.d.ts',
      'src/renderer/src/core/services/plugins/base-plugin.ts',
      'src/shared/utilities/event-system/event-emitter-wrapper.ts',
      'src/shared/constants/event-emitters.ts'
    ])
  }

  extract(): void {
    console.log('🔍 Extracting types from source files...')

    // Extract from each relevant file
    this.extractFromPluginTypes()
    this.extractFromStorageApi()
    this.extractFromContentDocument()
    this.extractFromEventTypes()
    this.extractFromDatabaseTypes()
    this.extractFromBasePlugin()
    this.extractFromEventEmitterWrapper()

    console.log('✅ Type extraction complete')
  }

  private extractFromPluginTypes(): void {
    const file = this.project.getSourceFile('plugin-types.d.ts')
    if (!file) {
      console.warn('⚠️  plugin-types.d.ts not found')
      return
    }

    // Extract PluginManifest interface
    const pluginManifest = file.getInterface('PluginManifest')
    if (pluginManifest) {
      this.extractedInterfaces.set(
        'PluginManifest',
        this.generateInterfaceDeclaration(pluginManifest)
      )
    }

    // Extract PluginInfo interface
    const pluginInfo = file.getInterface('PluginInfo')
    if (pluginInfo) {
      this.extractedInterfaces.set('PluginInfo', this.generateInterfaceDeclaration(pluginInfo))
    }

    // Extract FaseehApp interface
    const faseehApp = file.getInterface('FaseehApp')
    if (faseehApp) {
      this.extractedInterfaces.set('FaseehApp', this.generateInterfaceDeclaration(faseehApp))
    }

    console.log('📝 Extracted plugin types')
  }

  private extractFromStorageApi(): void {
    const file = this.project.getSourceFile('storage-api.d.ts')
    if (!file) {
      console.warn('⚠️  storage-api.d.ts not found')
      return
    }

    // Extract IStorageAPI interface
    const storageApi = file.getInterface('IStorageAPI')
    if (storageApi) {
      // Rename to StorageAPI for the plugin API
      let declaration = this.generateInterfaceDeclaration(storageApi)
      declaration = declaration.replace('interface IStorageAPI', 'interface StorageAPI')
      this.extractedInterfaces.set('StorageAPI', declaration)
    }

    console.log('💾 Extracted storage API types')
  }

  private extractFromContentDocument(): void {
    const file = this.project.getSourceFile('content-document.d.ts')
    if (!file) {
      console.warn('⚠️  content-document.d.ts not found')
      return
    }

    // Extract all relevant interfaces and types
    const interfacesToExtract = [
      'BoundingBox',
      'BaseBlock',
      'TextBlock',
      'ImageBlock',
      'VideoBlock',
      'AudioBlock',
      'ImageAnnotation',
      'AnnotatedImageBlock',
      'ContainerBlock',
      'ContentDocument'
    ]

    interfacesToExtract.forEach((name) => {
      const interface_ = file.getInterface(name)
      if (interface_) {
        this.extractedInterfaces.set(name, this.generateInterfaceDeclaration(interface_))
      }
    })

    // Extract ContentBlock type alias
    const contentBlock = file.getTypeAlias('ContentBlock')
    if (contentBlock) {
      this.extractedTypes.set('ContentBlock', this.generateTypeAliasDeclaration(contentBlock))
    }

    console.log('📄 Extracted content document types')
  }

  private extractFromEventTypes(): void {
    const file = this.project.getSourceFile('event-types.d.ts')
    if (!file) {
      console.warn('⚠️  event-types.d.ts not found')
      return
    }

    // Extract event type aliases
    const eventTypes = [
      'EventType',
      'Handler',
      'WildcardHandler',
      'StorageEvents',
      'WorkspaceEvents',
      'PluginEvents'
    ]
    eventTypes.forEach((name) => {
      const typeAlias = file.getTypeAlias(name)
      if (typeAlias) {
        this.extractedTypes.set(name, this.generateTypeAliasDeclaration(typeAlias))
      }
    })

    console.log('🎭 Extracted event types')
  }

  private extractFromDatabaseTypes(): void {
    const file = this.project.getSourceFile('src/main/db/types.d.ts')
    if (!file) {
      console.warn('⚠️  database types.d.ts not found')
      return
    }

    // Extract table interfaces and convert to simplified entity types
    const tableInterfaces = [
      'LibraryItemTable',
      'PluginDataTable',
      'AppSettingsTable',
      'ContentGroupTable',
      'CollectionTable',
      'CollectionMemberTable',
      'VocabularyRegistryTable',
      'VocabularySourceTable',
      'EmbeddedAssetTable',
      'SupplementaryFileTable'
    ]

    tableInterfaces.forEach((tableName) => {
      const tableInterface = file.getInterface(tableName)
      if (tableInterface) {
        const entityName = tableName.replace('Table', '')

        // Generate base entity interface
        const entityInterface = this.generateEntityInterfaceFromTable(tableInterface, entityName)
        this.extractedInterfaces.set(entityName, entityInterface)

        // Generate New* and *Update type aliases
        const newType = `export type New${entityName} = Omit<${entityName}, 'id' | 'createdAt' | 'updatedAt'>`
        const updateType = `export type ${entityName}Update = Partial<Omit<${entityName}, 'id' | 'createdAt'>>`

        this.extractedTypes.set(`New${entityName}`, newType)
        this.extractedTypes.set(`${entityName}Update`, updateType)
      }
    })

    console.log('🗃️  Extracted database entity types')
  }

  private extractFromBasePlugin(): void {
    const file = this.project.getSourceFile('base-plugin.ts')
    if (!file) {
      console.warn('⚠️  base-plugin.ts not found')
      return
    }

    const basePluginClass = file.getClass('BasePlugin')
    if (basePluginClass) {
      // Convert implementation class to abstract class declaration
      const declaration = this.generateAbstractClassDeclaration(basePluginClass)
      this.extractedClasses.set('Plugin', declaration)
    }

    console.log('🧩 Extracted base plugin class')
  }

  private extractFromEventEmitterWrapper(): void {
    const file = this.project.getSourceFile('event-emitter-wrapper.ts')
    if (!file) {
      console.warn('⚠️  event-emitter-wrapper.ts not found')
      return
    }

    const eventEmitterClass = file.getClass('EventEmitterWrapper')
    if (eventEmitterClass) {
      // Convert to interface declaration for the API
      const declaration = this.generateEventEmitterInterface(eventEmitterClass)
      this.extractedInterfaces.set('EventEmitterWrapper', declaration)
    }

    console.log('📡 Extracted event emitter wrapper')
  }

  private generateInterfaceDeclaration(interface_: InterfaceDeclaration): string {
    const name = interface_.getName()
    const docs = this.extractJSDocComments(interface_)
    const typeParams = interface_
      .getTypeParameters()
      .map((tp) => tp.getText())
      .join(', ')
    const typeParamsStr = typeParams ? `<${typeParams}>` : ''

    const properties = interface_
      .getProperties()
      .map((prop) => {
        const propDocs = this.extractJSDocComments(prop)
        const propName = prop.getName()
        const propType = prop.getType().getText(prop)
        const optional = prop.hasQuestionToken() ? '?' : ''

        return `${propDocs}  ${propName}${optional}: ${propType}`
      })
      .join('\n')

    const methods = interface_
      .getMethods()
      .map((method) => {
        const methodDocs = this.extractJSDocComments(method)
        const methodName = method.getName()
        const params = method
          .getParameters()
          .map((p) => `${p.getName()}: ${p.getType().getText(p)}`)
          .join(', ')
        const returnType = method.getReturnType().getText(method)

        return `${methodDocs}  ${methodName}(${params}): ${returnType}`
      })
      .join('\n')

    return `${docs}export interface ${name}${typeParamsStr} {
${properties}${properties && methods ? '\n' : ''}${methods}
}`
  }

  private generateTypeAliasDeclaration(typeAlias: TypeAliasDeclaration): string {
    const name = typeAlias.getName()
    const docs = this.extractJSDocComments(typeAlias)
    const typeParams = typeAlias
      .getTypeParameters()
      .map((tp) => tp.getText())
      .join(', ')
    const typeParamsStr = typeParams ? `<${typeParams}>` : ''
    const type = typeAlias.getTypeNode()?.getText() || 'unknown'

    return `${docs}export type ${name}${typeParamsStr} = ${type}`
  }

  private generateAbstractClassDeclaration(class_: ClassDeclaration): string {
    const docs = this.extractJSDocComments(class_)

    // Extract public properties
    const properties = class_
      .getProperties()
      .filter(
        (prop) =>
          prop.hasModifier(SyntaxKind.PublicKeyword) || prop.hasModifier(SyntaxKind.ReadonlyKeyword)
      )
      .map((prop) => {
        const propDocs = this.extractJSDocComments(prop)
        const propName = prop.getName()
        const propType = prop.getType().getText(prop)
        const readonly = prop.hasModifier(SyntaxKind.ReadonlyKeyword) ? 'readonly ' : ''

        return `${propDocs}  ${readonly}${propName}: ${propType}`
      })
      .join('\n')

    // Extract public methods
    const methods = class_
      .getMethods()
      .filter(
        (method) =>
          method.hasModifier(SyntaxKind.PublicKeyword) ||
          method.hasModifier(SyntaxKind.AbstractKeyword)
      )
      .map((method) => {
        const methodDocs = this.extractJSDocComments(method)
        const methodName = method.getName()
        const params = method
          .getParameters()
          .map((p) => {
            const paramName = p.getName()
            const paramType = p.getType().getText(p)
            const optional = p.hasQuestionToken() ? '?' : ''
            return `${paramName}${optional}: ${paramType}`
          })
          .join(', ')
        const returnType = method.getReturnType().getText(method)
        const abstract = method.hasModifier(SyntaxKind.AbstractKeyword) ? 'abstract ' : ''

        return `${methodDocs}  ${abstract}${methodName}(${params}): ${returnType}`
      })
      .join('\n')

    // Constructor
    const constructor_ = class_.getConstructors()[0]
    let constructorStr = ''
    if (constructor_) {
      const params = constructor_
        .getParameters()
        .map((p) => {
          const paramName = p.getName()
          const paramType = p.getType().getText(p)
          return `${paramName}: ${paramType}`
        })
        .join(', ')
      constructorStr = `\n  constructor(${params})\n`
    }

    return `${docs}export abstract class Plugin {
${properties}${constructorStr}
${methods}
}`
  }

  private generateEventEmitterInterface(class_: ClassDeclaration): string {
    const docs = this.extractJSDocComments(class_)

    // Extract public methods for the interface
    const methods = class_
      .getMethods()
      .filter((method) => method.hasModifier(SyntaxKind.PublicKeyword))
      .map((method) => {
        const methodDocs = this.extractJSDocComments(method)
        const methodName = method.getName()
        const typeParams = method
          .getTypeParameters()
          .map((tp) => tp.getText())
          .join(', ')
        const typeParamsStr = typeParams ? `<${typeParams}>` : ''
        const params = method
          .getParameters()
          .map((p) => {
            const paramName = p.getName()
            const paramType = p.getType().getText(p)
            const optional = p.hasQuestionToken() ? '?' : ''
            return `${paramName}${optional}: ${paramType}`
          })
          .join(', ')
        const returnType = method.getReturnType().getText(method)

        return `${methodDocs}  ${methodName}${typeParamsStr}(${params}): ${returnType}`
      })
      .join('\n')

    const classTypeParams = class_
      .getTypeParameters()
      .map((tp) => tp.getText())
      .join(', ')
    const typeParamsStr = classTypeParams ? `<${classTypeParams}>` : ''

    return `${docs}export interface EventEmitterWrapper${typeParamsStr} {
${methods}
}`
  }

  private extractJSDocComments(node: any): string {
    const jsDocs = node.getJsDocs?.() || []
    if (jsDocs.length === 0) return ''

    const comment = jsDocs[0].getComment()
    if (!comment) return ''

    return `/**\n * ${comment.replace(/\n/g, '\n * ')}\n */\n`
  }

  private generateEntityInterfaceFromTable(
    tableInterface: InterfaceDeclaration,
    entityName: string
  ): string {
    const docs = this.extractJSDocComments(tableInterface)

    const properties = tableInterface
      .getProperties()
      .map((prop) => {
        const propName = prop.getName()
        const propTypeText = prop.getType().getText(prop)

        // Simplify Kysely column types for plugin API
        let simplifiedType = propTypeText
          .replace(/ColumnType<([^,]+),[^>]*>/g, '$1')
          .replace(/Generated<([^>]+)>/g, '$1')
          .replace(/JSONColumnType<([^>]+)>/g, '$1')

        const optional = prop.hasQuestionToken() ? '?' : ''
        return `  ${propName}${optional}: ${simplifiedType}`
      })
      .join('\n')

    return `${docs}export interface ${entityName} {
${properties}
}`
  }

  generateOutput(): string {
    const header = `/**
 * Faseeh Plugin API
 * 
 * Official TypeScript definitions for developing Faseeh plugins.
 * Generated automatically from source code.
 * 
 * @version 1.0.4
 * @author Faseeh Team
 * @license MIT
 * @generated ${new Date().toISOString()}
 */

// ============================================================================
// CORE TYPES & UTILITIES
// ============================================================================

`

    const coreTypes = [
      this.extractedTypes.get('EventType'),
      this.extractedTypes.get('Handler'),
      this.extractedTypes.get('WildcardHandler')
    ]
      .filter(Boolean)
      .join('\n\n')

    const pluginSection = `
// ============================================================================
// PLUGIN MANIFEST & INFO
// ============================================================================

${this.extractedInterfaces.get('PluginManifest') || ''}

${this.extractedInterfaces.get('PluginInfo') || ''}
`

    const eventSection = `
// ============================================================================
// EVENT SYSTEM
// ============================================================================

${this.extractedInterfaces.get('EventEmitterWrapper') || ''}

${this.extractedTypes.get('StorageEvents') || ''}

${this.extractedTypes.get('WorkspaceEvents') || ''}

${this.extractedTypes.get('PluginEvents') || ''}
`

    const contentSection = `
// ============================================================================
// CONTENT DOCUMENT TYPES
// ============================================================================

${[
  'BoundingBox',
  'BaseBlock',
  'TextBlock',
  'ImageBlock',
  'VideoBlock',
  'AudioBlock',
  'ImageAnnotation',
  'AnnotatedImageBlock',
  'ContainerBlock'
]
  .map((name) => this.extractedInterfaces.get(name))
  .filter(Boolean)
  .join('\n\n')}

${this.extractedTypes.get('ContentBlock') || ''}

${this.extractedInterfaces.get('ContentDocument') || ''}
`

    const storageSection = `
// ============================================================================
// STORAGE API
// ============================================================================

${this.extractedInterfaces.get('StorageAPI') || ''}
`

    const databaseSection = `
// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

${[
  'LibraryItem',
  'PluginData',
  'AppSettings',
  'ContentGroup',
  'Collection',
  'CollectionMember',
  'VocabularyRegistry',
  'VocabularySource',
  'EmbeddedAsset',
  'SupplementaryFile'
]
  .map((name) => this.extractedInterfaces.get(name))
  .filter(Boolean)
  .join('\n\n')}

// New entity types for creation
${[
  'NewLibraryItem',
  'NewPluginData',
  'NewAppSettings',
  'NewContentGroup',
  'NewCollection',
  'NewCollectionMember',
  'NewVocabularyRegistry',
  'NewVocabularySource',
  'NewEmbeddedAsset',
  'NewSupplementaryFile'
]
  .map((name) => this.extractedTypes.get(name))
  .filter(Boolean)
  .join('\n\n')}

// Update entity types for partial updates
${[
  'LibraryItemUpdate',
  'PluginDataUpdate',
  'AppSettingsUpdate',
  'ContentGroupUpdate',
  'CollectionUpdate',
  'CollectionMemberUpdate',
  'VocabularyRegistryUpdate',
  'VocabularySourceUpdate',
  'EmbeddedAssetUpdate',
  'SupplementaryFileUpdate'
]
  .map((name) => this.extractedTypes.get(name))
  .filter(Boolean)
  .join('\n\n')}
`

    const appSection = `
// ============================================================================
// FASEEH APP API
// ============================================================================

${this.extractedInterfaces.get('FaseehApp') || ''}
`

    const pluginClassSection = `
// ============================================================================
// BASE PLUGIN CLASS
// ============================================================================

${this.extractedClasses.get('Plugin') || ''}
`

    return [
      header,
      coreTypes,
      pluginSection,
      eventSection,
      contentSection,
      databaseSection,
      storageSection,
      appSection,
      pluginClassSection
    ].join('\n')
  }

  writeOutput(): void {
    let content = this.generateOutput()

    // Post-process to fix interface name references
    content = content.replace(/storage: IStorageAPI/g, 'storage: StorageAPI')
    content = content.replace(/getPlugin\(id: string\): Plugin/g, 'getPlugin(id: string): Plugin')
    content = content.replace(/BasePlugin/g, 'Plugin')
    content = content.replace(/JSONRecord<string>/g, 'Record<string, any>')

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(OUTPUT_FILE, content, 'utf-8')
    console.log(`✅ Generated ${OUTPUT_FILE}`)
  }

  generateRuntimeBarrel(): string {
    const header = `/**
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
} from '@shared/types/plugin-types'

export type {
  EventType,
  Handler,
  WildcardHandler,
  StorageEvents,
  WorkspaceEvents,
  PluginEvents
} from '@shared/types/event-types'

export type { IStorageAPI } from '@shared/types/storage-api'

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
} from '@shared/types/content-document'

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
import type { FaseehApp } from '@shared/types/plugin-types'

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

    return header
  }

  writeRuntimeBarrel(): void {
    const content = this.generateRuntimeBarrel()
    const outputPath = 'src/renderer/src/runtime/plugin-runtime.ts'

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(outputPath, content, 'utf-8')
    console.log(`✅ Generated ${outputPath}`)
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Faseeh Plugin API generation...')

    const extractor = new TypeExtractor()
    extractor.extract()
    extractor.writeOutput()
    extractor.writeRuntimeBarrel()

    console.log('🎉 Plugin API generation complete!')
  } catch (error) {
    console.error('❌ Generation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { TypeExtractor }
