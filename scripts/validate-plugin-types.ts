#!/usr/bin/env tsx
/**
 * Validate Faseeh Plugin API Types
 *
 * This script validates that the manually curated faseeh.d.ts file
 * is in sync with the actual implementation in the source code.
 */

import { Project, SyntaxKind } from 'ts-morph'
import * as fs from 'fs'
import chalk from 'chalk'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

class APIValidator {
  private project: Project
  private errors: string[] = []
  private warnings: string[] = []
  constructor() {
    this.project = new Project({
      tsConfigFilePath: 'tsconfig.json',
      skipAddingFilesFromTsConfig: true
    })

    // Add source files to validate against
    this.project.addSourceFilesAtPaths([
      'src/shared/types/**/*.d.ts',
      'src/main/db/types.d.ts',
      'src/renderer/src/core/services/plugins/base-plugin.ts',
      'src/shared/utilities/event-system/event-emitter-wrapper.ts',
      'src/renderer/src/runtime/plugin-runtime.ts',
      'packages/faseeh/faseeh.d.ts'
    ])
  }
  validate(): ValidationResult {
    console.log('🔍 Validating Plugin API against source code...')

    this.validatePluginManifest()
    this.validateStorageAPI()
    this.validateBasePluginClass()
    this.validateEventSystem()
    this.validateRuntimeBarrel()
    this.validateGeneratedFile()

    const isValid = this.errors.length === 0

    return {
      isValid,
      errors: this.errors,
      warnings: this.warnings
    }
  }
  private validatePluginManifest(): void {
    const sourceManifest = this.project
      .getSourceFile('plugin-types.d.ts')
      ?.getInterface('PluginManifest')

    // Look for PluginManifest in the top-level exports (no longer in module declaration)
    const apiFile = this.project.getSourceFile('faseeh.d.ts')
    const apiManifest = apiFile?.getInterface('PluginManifest')

    if (!sourceManifest) {
      this.errors.push('❌ PluginManifest interface not found in source')
      return
    }

    if (!apiManifest) {
      this.errors.push('❌ PluginManifest interface not found in API')
      return
    }

    // Compare properties
    const sourceProps = sourceManifest.getProperties().map((p) => ({
      name: p.getName(),
      type: p.getType().getText(p),
      optional: p.hasQuestionToken()
    }))

    const apiProps = apiManifest.getProperties().map((p) => ({
      name: p.getName(),
      type: p.getType().getText(p),
      optional: p.hasQuestionToken()
    }))

    // Check for missing properties in API
    sourceProps.forEach((sourceProp) => {
      const apiProp = apiProps.find((p) => p.name === sourceProp.name)
      if (!apiProp) {
        this.errors.push(`❌ PluginManifest.${sourceProp.name} missing in API`)
      } else if (sourceProp.type !== apiProp.type) {
        this.warnings.push(
          `⚠️  PluginManifest.${sourceProp.name} type mismatch: source=${sourceProp.type}, api=${apiProp.type}`
        )
      }
    })

    console.log('✅ PluginManifest validation complete')
  }
  private validateStorageAPI(): void {
    const sourceStorage = this.project
      .getSourceFile('storage-api.d.ts')
      ?.getInterface('IStorageAPI')

    // Look for StorageAPI in the top-level exports
    const apiFile = this.project.getSourceFile('faseeh.d.ts')
    const apiStorage = apiFile?.getInterface('StorageAPI')

    if (!sourceStorage) {
      this.errors.push('❌ IStorageAPI interface not found in source')
      return
    }

    if (!apiStorage) {
      this.errors.push('❌ StorageAPI interface not found in API')
      return
    }

    // Compare methods
    const sourceMethods = sourceStorage.getMethods().map((m) => ({
      name: m.getName(),
      signature: m.getText()
    }))

    const apiMethods = apiStorage.getMethods().map((m) => ({
      name: m.getName(),
      signature: m.getText()
    }))

    // Check for missing methods in API
    sourceMethods.forEach((sourceMethod) => {
      const apiMethod = apiMethods.find((m) => m.name === sourceMethod.name)
      if (!apiMethod) {
        this.errors.push(`❌ StorageAPI.${sourceMethod.name} missing in API`)
      }
    })

    console.log('✅ StorageAPI validation complete')
  }
  private validateBasePluginClass(): void {
    const sourceClass = this.project.getSourceFile('base-plugin.ts')?.getClass('BasePlugin')

    // Look for Plugin class in the top-level exports
    const apiFile = this.project.getSourceFile('faseeh.d.ts')
    const apiClass = apiFile?.getClass('Plugin')

    if (!sourceClass) {
      this.errors.push('❌ BasePlugin class not found in source')
      return
    }

    if (!apiClass) {
      this.errors.push('❌ Plugin class not found in API')
      return
    }

    // Compare public methods
    const sourceMethods = sourceClass
      .getMethods()
      .filter(
        (m) => m.hasModifier(SyntaxKind.PublicKeyword) || m.hasModifier(SyntaxKind.AbstractKeyword)
      )
      .filter((m) => !m.getName().startsWith('_')) // Exclude internal methods
      .map((m) => ({
        name: m.getName(),
        abstract: m.hasModifier(SyntaxKind.AbstractKeyword)
      }))

    const apiMethods = apiClass.getMethods().map((m) => ({
      name: m.getName(),
      abstract: m.hasModifier(SyntaxKind.AbstractKeyword)
    }))

    // Check for missing methods
    sourceMethods.forEach((sourceMethod) => {
      const apiMethod = apiMethods.find((m) => m.name === sourceMethod.name)
      if (!apiMethod) {
        this.errors.push(`❌ Plugin.${sourceMethod.name} missing in API`)
      } else if (sourceMethod.abstract !== apiMethod.abstract) {
        this.warnings.push(`⚠️  Plugin.${sourceMethod.name} abstract modifier mismatch`)
      }
    })

    console.log('✅ BasePlugin/Plugin validation complete')
  }
  private validateEventSystem(): void {
    const sourceEvents = this.project.getSourceFile('event-types.d.ts')
    const apiFile = this.project.getSourceFile('faseeh.d.ts')

    if (!sourceEvents || !apiFile) {
      this.errors.push('❌ Event type files not found')
      return
    }

    // Check for required event types in top-level exports
    const requiredTypes = ['StorageEvents', 'WorkspaceEvents', 'PluginEvents']

    requiredTypes.forEach((typeName) => {
      const sourceType = sourceEvents.getTypeAlias(typeName)
      const apiType = apiFile.getTypeAlias(typeName)

      if (!sourceType) {
        this.warnings.push(`⚠️  ${typeName} not found in source event types`)
      }

      if (!apiType) {
        this.errors.push(`❌ ${typeName} missing in API`)
      }
    })

    console.log('✅ Event system validation complete')
  }
  private validateRuntimeBarrel(): void {
    const runtimeFile = this.project.getSourceFile('plugin-runtime.ts')

    if (!runtimeFile) {
      this.errors.push(
        '❌ Runtime barrel file not found at src/renderer/src/runtime/plugin-runtime.ts'
      )
      return
    }

    // Check that it exports BasePlugin
    const basePluginExport = runtimeFile
      .getExportDeclarations()
      .find(
        (exp) => exp.getModuleSpecifierValue() === '@renderer/core/services/plugins/base-plugin'
      )

    if (!basePluginExport) {
      this.errors.push('❌ Runtime barrel missing BasePlugin export')
    }

    // Check that it exports storage
    const storageExport = runtimeFile
      .getExportDeclarations()
      .find(
        (exp) => exp.getModuleSpecifierValue() === '@renderer/core/services/storage/storage-service'
      )

    if (!storageExport) {
      this.errors.push('❌ Runtime barrel missing storage export')
    }

    // Check that it exports event emitters
    const eventExport = runtimeFile
      .getExportDeclarations()
      .find((exp) => exp.getModuleSpecifierValue() === '@shared/constants/event-emitters')

    if (!eventExport) {
      this.errors.push('❌ Runtime barrel missing event emitters export')
    }

    // Check that createFaseehApp function exists
    const createFaseehAppFunction = runtimeFile.getFunction('createFaseehApp')
    if (!createFaseehAppFunction) {
      this.errors.push('❌ Runtime barrel missing createFaseehApp function')
    }
    console.log('✅ Runtime barrel validation complete')
  }

  private validateGeneratedFile(): void {
    const apiFile = this.project.getSourceFile('faseeh.d.ts')

    if (!apiFile) {
      this.errors.push('❌ Generated faseeh.d.ts file not found')
      return
    }

    // Check that the file has the generated comment
    const fileText = apiFile.getFullText()
    if (!fileText.includes('@generated')) {
      this.warnings.push('⚠️  Generated file missing @generated comment - may be manually edited')
    }

    // Check that it's using top-level exports (not module declarations)
    const modules = apiFile.getModules()
    if (modules.length > 0) {
      this.errors.push('❌ Generated file should use top-level exports, not module declarations')
    }

    // Check for required top-level exports
    const requiredInterfaces = ['PluginManifest', 'PluginInfo', 'FaseehApp', 'StorageAPI']
    const requiredClasses = ['Plugin']
    const requiredTypes = ['EventType', 'Handler', 'WildcardHandler']

    requiredInterfaces.forEach((interfaceName) => {
      const interface_ = apiFile.getInterface(interfaceName)
      if (!interface_) {
        this.errors.push(`❌ Missing required interface: ${interfaceName}`)
      }
    })

    requiredClasses.forEach((className) => {
      const class_ = apiFile.getClass(className)
      if (!class_) {
        this.errors.push(`❌ Missing required class: ${className}`)
      }
    })

    requiredTypes.forEach((typeName) => {
      const type = apiFile.getTypeAlias(typeName)
      if (!type) {
        this.errors.push(`❌ Missing required type: ${typeName}`)
      }
    })

    console.log('✅ Generated file validation complete')
  }

  printResults(result: ValidationResult): void {
    console.log('\n🔍 Validation Results:')
    console.log('='.repeat(50))

    if (result.isValid) {
      console.log(chalk.green('✅ API is in sync with source code!'))
    } else {
      console.log(chalk.red('❌ API validation failed!'))
    }

    if (result.errors.length > 0) {
      console.log(chalk.red('\n🚨 Errors:'))
      result.errors.forEach((error) => console.log(`  ${error}`))
    }

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'))
      result.warnings.forEach((warning) => console.log(`  ${warning}`))
    }

    console.log(`\n📊 Summary: ${result.errors.length} errors, ${result.warnings.length} warnings`)
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Faseeh Plugin API validation...')

    const validator = new APIValidator()
    const result = validator.validate()
    validator.printResults(result)

    if (!result.isValid) {
      console.log(
        chalk.yellow(
          '\n💡 Tip: Run `npx tsx scripts/generate-plugin-types.ts` to auto-sync the API'
        )
      )
      process.exit(1)
    }

    console.log('\n🎉 API validation complete!')
  } catch (error) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { APIValidator }
